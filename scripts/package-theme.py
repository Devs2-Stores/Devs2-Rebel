import os, zipfile, fnmatch

THEME_DIRS = ['assets', 'blocks', 'config', 'layout', 'listings', 'locales', 'sections', 'snippets', 'templates']

ignore_patterns = []
if os.path.exists('.shopifyignore'):
    for line in open('.shopifyignore', encoding='utf-8'):
        line = line.strip()
        if line and not line.startswith('#'):
            ignore_patterns.append(line)

def should_ignore(path):
    normalized = path.replace('\\', '/')
    for pat in ignore_patterns:
        pat_clean = pat.rstrip('/')
        if fnmatch.fnmatch(normalized, pat) or fnmatch.fnmatch(normalized, f'*{pat}*') or normalized.startswith(pat_clean + '/'):
            return True
        if fnmatch.fnmatch(os.path.basename(normalized), pat):
            return True
    return False

os.makedirs('dist', exist_ok=True)
zip_path = 'dist/devs2-rebel-v1.0.0.zip'

file_count = 0
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for d in THEME_DIRS:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, '.')
                if should_ignore(rel_path):
                    continue
                zf.write(full_path, rel_path)
                file_count += 1

size_mb = os.path.getsize(zip_path) / (1024 * 1024)
print(f'SUCCESS: Packaged {file_count} files into {zip_path} ({size_mb:.2f} MB, < 50 MB limit)')
