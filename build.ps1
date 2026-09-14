$ErrorActionPreference = 'Stop'
$packageFiles = @('manifest.json','background.js','content.js','detector.js','launcher.js','popup.html','popup.js','README.md','SORUMLULUK.md')
$packagePaths = $packageFiles | ForEach-Object { Join-Path $PSScriptRoot $_ }
foreach ($packagePath in $packagePaths) {
    if (-not (Test-Path -LiteralPath $packagePath)) { throw "Eksik dosya: $packagePath" }
}
Compress-Archive -LiteralPath $packagePaths -DestinationPath (Join-Path $PSScriptRoot 'Egitim-Ilerletici.zip') -Force
Write-Output 'Egitim-Ilerletici.zip hazır.'
