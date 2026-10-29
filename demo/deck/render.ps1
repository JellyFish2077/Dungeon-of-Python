param(
    [string]$Deck = "$PSScriptRoot\pydungeon-deck.pptx",
    [string]$OutDir = "$PSScriptRoot\render"
)

$ErrorActionPreference = "Stop"
$soffice = "C:\Program Files\LibreOffice\program\soffice.exe"
if (-not (Test-Path $soffice)) { throw "LibreOffice не найден: $soffice" }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$profile = Join-Path $env:TEMP ("lo-prof-" + [guid]::NewGuid().ToString("N"))
$profileUrl = "file:///" + ($profile -replace '\\', '/')

$proc = Start-Process -FilePath $soffice -PassThru -Wait -WindowStyle Hidden -ArgumentList @(
    "--headless", "--nologo", "--nofirststartwizard", "--norestore",
    "-env:UserInstallation=$profileUrl",
    "--convert-to", "pdf", "--outdir", $OutDir, (Resolve-Path $Deck).Path
)
if ($proc.ExitCode -ne 0) { throw "LibreOffice вернул код $($proc.ExitCode)" }

python -c @"
import sys, pymupdf
pdf = sys.argv[1]
out = sys.argv[2]
doc = pymupdf.open(pdf)
for i, page in enumerate(doc, 1):
    page.get_pixmap(dpi=150).save(f'{out}/slide-{i}.png')
print(f'rendered {doc.page_count} pages')
"@ (Join-Path $OutDir "pydungeon-deck.pdf") $OutDir
