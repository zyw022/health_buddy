# Health Buddy environment setup
$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Health Buddy - Setup'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Write-Step { param($n, $msg) Write-Host "  [$n] $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "  [!!] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "  [--] $msg" -ForegroundColor Gray }

Write-Host ''
Write-Host '  ========================================' -ForegroundColor Magenta
Write-Host '     Health Buddy  -  Environment Setup' -ForegroundColor Magenta
Write-Host '  ========================================' -ForegroundColor Magenta
Write-Host ''

# Step 1: Node.js
Write-Step '1/4' 'Checking Node.js'
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User')

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Info 'Node.js not found, downloading v22 LTS (~30 MB)...'
  $url = 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi'
  $msi = Join-Path $env:TEMP 'node-install.msi'
  try {
    Invoke-WebRequest -Uri $url -OutFile $msi -UseBasicParsing
    Write-Info 'Installing Node.js silently, please wait...'
    Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /quiet /norestart ADDLOCAL=ALL" -Wait -Verb RunAs
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [System.Environment]::GetEnvironmentVariable('Path', 'User')
    Write-OK 'Node.js installed'
  } catch {
    Write-Fail "Node.js install failed: $_"
    Write-Info 'Install manually from https://nodejs.org'
    Read-Host 'Press Enter to exit'
    exit 1
  }
} else {
  $ver = node --version 2>&1
  Write-OK "Found $ver ($($nodeCmd.Source))"
}

# Step 2: npm
Write-Step '2/4' 'Checking npm'
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User')
try {
  $npmVer = npm --version 2>&1
  Write-OK "npm v$npmVer"
} catch {
  Write-Fail 'npm unavailable, reinstall Node.js'
  Read-Host 'Press Enter to exit'
  exit 1
}

# Step 3: dependencies
Write-Step '3/4' 'Installing dependencies (first run ~1-2 min)'
if (-not (Test-Path 'node_modules')) {
  npm install --legacy-peer-deps
  if ($LASTEXITCODE -ne 0) {
    Write-Fail 'npm install failed, check network'
    Read-Host 'Press Enter to exit'
    exit 1
  }
} else {
  Write-Info 'node_modules exists, skipping install'
}
Write-OK 'Dependencies ready'

# Step 4: assets
Write-Step '4/4' 'Checking project assets'
New-Item -ItemType Directory -Path 'assetstore\data' -Force | Out-Null
New-Item -ItemType Directory -Path 'assetstore\icons' -Force | Out-Null

$assets = @(
  'assetstore\treehouse\treehouseorigin.jpg',
  'assetstore\pets\birds\gentle\usual.png',
  'assetstore\pets\birds\gentle\chat.png',
  'assetstore\pets\birds\gentle\tired.png',
  'assetstore\pets\birds\gentle\prompt.png'
)
$missing = $assets | Where-Object { -not (Test-Path $_) }
if ($missing) {
  Write-Fail 'Missing asset files:'
  $missing | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
} else {
  Write-OK 'All asset files present'
}

Write-Host ''
Write-Host '  ========================================' -ForegroundColor Magenta
Write-Host '  Setup complete! Double-click launch.bat.' -ForegroundColor Green
Write-Host '  ========================================' -ForegroundColor Magenta
Write-Host ''
Read-Host 'Press Enter to exit'
