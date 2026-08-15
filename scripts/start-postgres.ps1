# Start portable PostgreSQL on port 5432 (dev helper)
$ErrorActionPreference = "Continue"
$pgBin = "C:\Users\basya\pgsql\bin"
$dataDir = "C:\Users\basya\AccioWork\2026-08-15-00-55-19-591-1d56c40b\.pgdata"
$logDir = "C:\Users\basya\AccioWork\2026-08-15-00-55-19-591-1d56c40b\.pg"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Already running?
$ready = & "$pgBin\pg_isready.exe" -p 5432 2>$null
if ($LASTEXITCODE -eq 0) { Write-Output "ALREADY_RUNNING"; exit 0 }

$stdout = Join-Path $logDir "postgres.stdout.log"
$stderr = Join-Path $logDir "postgres.stderr.log"

$proc = Start-Process -FilePath "$pgBin\postgres.exe" `
  -ArgumentList @("-D", $dataDir, "-p", "5432") `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -PassThru

Start-Sleep -Seconds 6
if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) {
  Write-Output "RUNNING pid=$($proc.Id)"
} else {
  Write-Output "EXITED pid=$($proc.Id)"
  Write-Output "--- stdout ---"
  Get-Content $stdout -ErrorAction SilentlyContinue | Select-Object -First 20
  Write-Output "--- stderr ---"
  Get-Content $stderr -ErrorAction SilentlyContinue | Select-Object -First 20
}
& "$pgBin\pg_isready.exe" -p 5432
