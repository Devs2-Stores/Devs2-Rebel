import argparse, os, re, zipfile, fnmatch, json

THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'listings', 'locales', 'sections', 'snippets', 'templates']
REQUIRED_ENTRIES = ['layout/theme.liquid', 'config/settings_schema.json', 'config/settings_data.json', 'locales/en.default.json']
FORBIDDEN_PATTERNS = ['.env', '.env.*', '*.md', 'runs/*', 'plans/*', 'scratch/*', 'node_modules/*', '.git/*']
TEXT_EXTENSIONS = ('.liquid', '.json', '.js', '.css', '.svg', '.txt')
MAX_BYTES = 50 * 1024 * 1024

parser = argparse.ArgumentParser(description='Package the theme into sartor-v<version>.zip')
parser.add_argument('--out', default='dist', help='output directory (default: dist)')
parser.add_argument('--force', action='store_true', help='overwrite an existing zip')
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
zip_path = os.path.join(args.out, f"sartor-v{theme_info['theme_version']}.zip")

if os.path.exists(zip_path) and not args.force:
    raise SystemExit(f'FAIL: {zip_path} already exists; pass --force to overwrite it or --out DIR to build elsewhere')

os.makedirs(args.out, exist_ok=True)
tmp_path = zip_path + '.partial'

file_count = 0
with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for d in THEME_DIRS:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            for f in sorted(files):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, '.').replace('\\', '/')
                if should_ignore(rel_path):
                    continue
                with open(full_path, 'rb') as src:
                    data = src.read()
                if rel_path.endswith(TEXT_EXTENSIONS):
                    data = data.replace(b'\r\n', b'\n')
                zf.writestr(rel_path, data)
                file_count += 1

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
    crlf = []
    bad_json = []
    for name in names:
        data = zf.read(name)
        if name.endswith(TEXT_EXTENSIONS) and b'\r\n' in data:
            crlf.append(name)
        if name.endswith('.json'):
            try:
                json.loads(re.sub(r'^\s*/\*[\s\S]*?\*/', '', data.decode('utf-8')))
            except ValueError as error:
                bad_json.append(f'{name}: {error}')
    if crlf:
        problems.append(f'CRLF line endings left in text members: {crlf}')
    if bad_json:
        problems.append(f'invalid JSON members: {bad_json}')
if problems:
    fail('; '.join(problems))

os.replace(tmp_path, zip_path)
print(f'SUCCESS: Packaged {file_count} files into {zip_path} ({size_bytes / (1024 * 1024):.2f} MB, < 50 MB limit)')
