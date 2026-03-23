$file = 'c:\Users\Admin\Desktop\Devs2 Shopify\assets\theme.js'
$lines = Get-Content $file
# Remove lines 579-870 (index 578-869) - orphaned TOC code + duplicate PRODUCT CARD comment
$before = $lines[0..577]
$after = $lines[870..($lines.Count-1)]
$result = $before + $after
$result | Set-Content $file -Encoding UTF8
