import os, zipfile, fnmatch, json

THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates']

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

os.makedirs('dist', exist_ok=True)
with open('config/settings_schema.json', encoding='utf-8') as schema_file:
    theme_info = next(item for item in json.load(schema_file) if item.get('name') == 'theme_info')
zip_path = f"dist/sartor-v{theme_info['theme_version']}.zip"

TEXT_EXTENSIONS = ('.liquid', '.json', '.js', '.css', '.svg', '.txt')
MAX_BYTES = 50 * 1024 * 1024

file_count = 0
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
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

size_bytes = os.path.getsize(zip_path)
if size_bytes > MAX_BYTES:
    raise SystemExit(f'FAIL: {zip_path} is {size_bytes} bytes, over the 50 MB limit')
with zipfile.ZipFile(zip_path) as zf:
    stray = sorted({name.split('/')[0] for name in zf.namelist()} - set(THEME_DIRS))
if stray:
    raise SystemExit(f'FAIL: unexpected top-level entries in the zip: {stray}')
print(f'SUCCESS: Packaged {file_count} files into {zip_path} ({size_bytes / (1024 * 1024):.2f} MB, < 50 MB limit)')
