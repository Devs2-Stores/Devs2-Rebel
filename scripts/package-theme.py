import argparse, os, re, zipfile, fnmatch, json

THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'listings', 'locales', 'sections', 'snippets', 'templates']
REQUIRED_ENTRIES = ['layout/theme.liquid', 'config/settings_schema.json', 'config/settings_data.json', 'locales/en.default.json']
FORBIDDEN_PATTERNS = ['.env', '.env.*', '*.md', 'runs/*', 'plans/*', 'scratch/*', 'node_modules/*', '.git/*', '.DS_Store', 'Thumbs.db', '*.pyc', '*.orig', '*.rej']
TEXT_EXTENSIONS = ('.liquid', '.json', '.js', '.css', '.svg', '.txt')
MAX_BYTES = 50 * 1024 * 1024

parser = argparse.ArgumentParser(description='Package the theme into sartor-v<version>.zip')
parser.add_argument('--out', default='dist', help='output directory (default: dist)')
parser.add_argument('--force', action='store_true', help='overwrite an existing zip')
parser.add_argument('--only-preset', metavar='HANDLE', help='ship a single preset: drops listings/ and keeps only that preset in config/settings_data.json')
args = parser.parse_args()

ignore_patterns = []
if os.path.exists('.shopifyignore'):
    for line in open('.shopifyignore', encoding='utf-8'):
        line = line.strip()
        if line and not line.startswith('#'):
            ignore_patterns.append(line)

def should_ignore(path):
    normalized = path.replace('\\', '/')
    base = os.path.basename(normalized)
    for pat in ignore_patterns:
        pat_clean = pat.rstrip('/')
        if fnmatch.fnmatch(normalized, pat) or fnmatch.fnmatch(base, pat) or normalized.startswith(pat_clean + '/'):
            return True
    return False

with open('config/settings_schema.json', encoding='utf-8') as schema_file:
    theme_info = next(item for item in json.load(schema_file) if item.get('name') == 'theme_info')
zip_suffix = f'-{args.only_preset}' if args.only_preset else ''
zip_path = os.path.join(args.out, f"sartor-v{theme_info['theme_version']}{zip_suffix}.zip")

if os.path.exists(zip_path) and not args.force:
    raise SystemExit(f'FAIL: {zip_path} already exists; pass --force to overwrite it or --out DIR to build elsewhere')

os.makedirs(args.out, exist_ok=True)
tmp_path = zip_path + '.partial'

def clear_demo_handles(node):
    if isinstance(node, dict):
        return {key: ('' if key == 'product_handle' and isinstance(value, str) else clear_demo_handles(value)) for key, value in node.items()}
    if isinstance(node, list):
        return [clear_demo_handles(item) for item in node]
    return node

def dump_json(data):
    return (json.dumps(data, indent=2, ensure_ascii=False) + '\n').encode('utf-8')

def load_json(path):
    with open(path, encoding='utf-8') as handle_file:
        return json.loads(re.sub(r'^\s*/\*[\s\S]*?\*/', '', handle_file.read()))

overrides = {}
if args.only_preset:
    handle = args.only_preset
    settings = load_json('config/settings_data.json')
    match = [name for name in settings['presets'] if re.sub(r'\s+', '-', name.strip().lower()) == handle]
    if len(match) != 1:
        raise SystemExit(f'FAIL: --only-preset {handle!r} matches {match} in config/settings_data.json')
    overrides['config/settings_data.json'] = dump_json({'current': match[0], 'presets': {match[0]: settings['presets'][match[0]]}})
    listing_dir = f'listings/{handle}'
    if not os.path.isdir(listing_dir):
        raise SystemExit(f'FAIL: {listing_dir} not found; the install state of a single-preset zip comes from it')
    for sub in ('templates', 'sections'):
        sub_dir = os.path.join(listing_dir, sub)
        for name in sorted(os.listdir(sub_dir)) if os.path.isdir(sub_dir) else []:
            overrides[f'{sub}/{name}'] = dump_json(clear_demo_handles(load_json(os.path.join(sub_dir, name))))

file_count = 0
written = set()
with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    def add(rel_path, data):
        global file_count
        if rel_path.endswith(TEXT_EXTENSIONS):
            data = data.replace(b'\r\n', b'\n')
        zf.writestr(rel_path, data)
        written.add(rel_path)
        file_count += 1
    for d in THEME_DIRS:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            for f in sorted(files):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, '.').replace('\\', '/')
                if should_ignore(rel_path):
                    continue
                if args.only_preset and rel_path.startswith('listings/'):
                    continue
                if rel_path in overrides:
                    add(rel_path, overrides[rel_path])
                    continue
                with open(full_path, 'rb') as src:
                    add(rel_path, src.read())
    for rel_path in sorted(set(overrides) - written):
        add(rel_path, overrides[rel_path])

def fail(message):
    os.remove(tmp_path)
    raise SystemExit(f'FAIL: {message}')

size_bytes = os.path.getsize(tmp_path)
if size_bytes > MAX_BYTES:
    fail(f'{zip_path} is {size_bytes} bytes, over the 50 MB limit')

problems = []
with zipfile.ZipFile(tmp_path) as zf:
    names = zf.namelist()
    missing = [name for name in REQUIRED_ENTRIES if name not in names]
    if missing:
        problems.append(f'required entries missing from the zip: {missing}')
    forbidden = sorted(name for name in names if any(fnmatch.fnmatch(name, pat) or fnmatch.fnmatch(os.path.basename(name), pat) for pat in FORBIDDEN_PATTERNS))
    if forbidden:
        problems.append(f'forbidden entries in the zip: {forbidden}')
    stray = sorted({name.split('/')[0] for name in names} - set(THEME_DIRS))
    if stray:
        problems.append(f'unexpected top-level entries in the zip: {stray}')
    presets = json.loads(re.sub(r'^\s*/\*[\s\S]*?\*/', '', zf.read('config/settings_data.json').decode('utf-8'))).get('presets', {})
    handles = {re.sub(r'\s+', '-', name.strip().lower()) for name in presets}
    listed = {name.split('/')[1] for name in names if name.startswith('listings/') and name.count('/') >= 3}
    if len(presets) > 1 and handles != listed:
        problems.append(f'listings/ folders {sorted(listed)} do not match the presets in settings_data.json {sorted(handles)}')
    bad_listing = sorted(name for name in names if name.startswith('listings/') and not re.fullmatch(r'listings/[a-z0-9-]+/(templates|sections)/[^/]+\.json', name))
    if bad_listing:
        problems.append(f'listings/ entries outside <preset>/templates or <preset>/sections: {bad_listing}')
    if args.only_preset:
        if len(presets) != 1 or listed or any(name.startswith('listings/') for name in names):
            problems.append(f'--only-preset build must hold exactly one preset and no listings/ folder; found presets {sorted(handles)} and listing folders {sorted(listed)}')
        other_presets = sorted(re.sub(r'\s+', '-', name.strip().lower()) for name in json.loads(open('config/settings_data.json', encoding='utf-8').read())['presets'] if re.sub(r'\s+', '-', name.strip().lower()) != args.only_preset)
    crlf = []
    bad_json = []
    store_specific = []
    residue = []
    leaked = []
    for name in names:
        data = zf.read(name)
        if name.endswith(TEXT_EXTENSIONS) and b'\r\n' in data:
            crlf.append(name)
        if name.endswith(TEXT_EXTENSIONS) and re.search(rb'\brebel\b', data, re.I):
            residue.append(name)
        if args.only_preset and other_presets and name.endswith(TEXT_EXTENSIONS) and re.search(rb'\b(' + b'|'.join(re.escape(p.encode()) for p in other_presets) + rb')\b', data, re.I):
            leaked.append(name)
        if name.endswith('.json'):
            try:
                json.loads(re.sub(r'^\s*/\*[\s\S]*?\*/', '', data.decode('utf-8')))
            except ValueError as error:
                bad_json.append(f'{name}: {error}')
            text = data.decode('utf-8', 'replace')
            if 'shopify://' in text or re.search(r'metafields\.(?!shopify\.)[A-Za-z0-9_-]+\.', text):
                store_specific.append(name)
    if crlf:
        problems.append(f'CRLF line endings left in text members: {crlf}')
    if residue:
        problems.append(f'former theme name "Rebel" found in: {residue}')
    if leaked:
        problems.append(f'names of presets left out of this build found in: {leaked}')
    if bad_json:
        problems.append(f'invalid JSON members: {bad_json}')
    if store_specific:
        problems.append(f'JSON members reference custom metafields or shopify:// URLs, which do not exist on a merchant store: {store_specific}')
if problems:
    fail('; '.join(problems))

os.replace(tmp_path, zip_path)
print(f'SUCCESS: Packaged {file_count} files into {zip_path} ({size_bytes / (1024 * 1024):.2f} MB, < 50 MB limit)')
