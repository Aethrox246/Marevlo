$sourceDir = "c:\Users\sudha\Desktop\Marevlo\Marevlo\frontend\public\docx\courses\Data_Science\pytorch"
$targetDir = "c:\Users\sudha\Desktop\Marevlo\Marevlo\frontend\public\cources\Data_Science\pytorch"

Get-ChildItem -Path $sourceDir -Filter *.docx -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1)
    $targetFileHtml = Join-Path $targetDir ($relativePath -replace '\.docx$', '.html')
    $targetSubDir = Split-Path $targetFileHtml -Parent
    
    if (-not (Test-Path $targetSubDir)) {
        New-Item -ItemType Directory -Force -Path $targetSubDir | Out-Null
    }
    
    Write-Host "Converting $($_.FullName) to $targetFileHtml"
    npx mammoth "$($_.FullName)" "$targetFileHtml"
}
