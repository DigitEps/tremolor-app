$root = Get-Location
Write-Host "ROOT: $root"

$needles = @(
  "Mirall (reformulat)",
  "El que has escrit",
  "Avís de seguretat",
  "NIT 1",
  "NIT 5",
  "El teu informe"
)

foreach($n in $needles){
  Write-Host "`n== FIND: $n =="
  Get-ChildItem -Path $root -Recurse -File -Include "*.tsx","*.ts","*.js" |
    Select-String -Pattern $n -SimpleMatch |
    Select-Object -First 50 |
    ForEach-Object { "{0}:{1}  {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim() }
}
