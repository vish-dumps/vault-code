$file = "E:\VaultCode\client\src\pages\community\friends.tsx"

Write-Host "Reading file..."
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

Write-Host "File length: $($content.Length) characters"

# Check for literal \n
$literalNewlines = ([regex]::Matches($content, '\\n')).Count
Write-Host "Found $literalNewlines literal \n sequences"

if ($literalNewlines -gt 0) {
    # Create backup
    $backup = $file + ".backup"
    [System.IO.File]::WriteAllText($backup, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Backup created: $backup"
    
    # Replace literal \n with actual newlines
    $fixed = $content -replace '\\n', "`n"
    
    # Write fixed content
    [System.IO.File]::WriteAllText($file, $fixed, [System.Text.Encoding]::UTF8)
    Write-Host "FIXED! File has been corrected."
} else {
    Write-Host "No literal \n sequences found."
}
