param(
  [Parameter(Mandatory = $false)]
  [string]$SourceRef = "digrvtbfonatvytwpbbn",

  [Parameter(Mandatory = $false)]
  [string]$TargetRef = "oilillvaatchsyvqbyxo",

  [Parameter(Mandatory = $false)]
  [string]$OutDir = ".\\scripts\\reports\\out"
)

$ErrorActionPreference = "Stop"

function Require-EnvVar([string]$name) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if (-not [string]::IsNullOrWhiteSpace($v)) { return $v }

  Write-Host "Env var $name is not set."
  Write-Host "Paste token input is hidden. Press Enter to continue."
  $secure = Read-Host -AsSecureString "$name"
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
  if ([string]::IsNullOrWhiteSpace($plain)) { throw "Missing token value for: $name" }
  $t = $plain.Trim()
  # Users often paste tokens wrapped in quotes. Strip a single pair.
  if (($t.StartsWith("'") -and $t.EndsWith("'")) -or ($t.StartsWith('"') -and $t.EndsWith('"'))) {
    $t = $t.Substring(1, $t.Length - 2).Trim()
  }
  return $t
}

function Invoke-Transfer([string]$ProjectRef, [string]$AccessToken, [object]$Body) {
  $url = "https://$ProjectRef.supabase.co/functions/v1/admin-data-transfer"
  $headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
  }
  try {
    return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body ($Body | ConvertTo-Json -Depth 50)
  } catch {
    $ex = $_.Exception
    $status = $null
    try { $status = [int]$ex.Response.StatusCode } catch { }
    if ($ex.Response) {
      try {
        $reader = New-Object System.IO.StreamReader($ex.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "HTTP error body: $respBody"
      } catch {
        # ignore
      }
    }
    throw
  }
}

function Invoke-TransferWithRetry([string]$ProjectRef, [string]$AccessToken, [object]$Body, [int]$MaxAttempts = 4) {
  $attempt = 1
  $sleepSeconds = 2
  while ($true) {
    try {
      return Invoke-Transfer -ProjectRef $ProjectRef -AccessToken $AccessToken -Body $Body
    } catch {
      $msg = $_.Exception.Message
      $is502 = ($msg -match "502")
      if ($attempt -ge $MaxAttempts -or (-not $is502)) { throw }
      Write-Host "Got 502 from $ProjectRef. Retrying in ${sleepSeconds}s (attempt $attempt/$MaxAttempts)..."
      Start-Sleep -Seconds $sleepSeconds
      $attempt += 1
      $sleepSeconds = [Math]::Min($sleepSeconds * 2, 20)
    }
  }
}

function Decode-JwtPayload([string]$jwt) {
  if ([string]::IsNullOrWhiteSpace($jwt)) { return $null }
  $parts = $jwt.Split(".")
  if ($parts.Length -lt 2) { return $null }
  $b64 = $parts[1].Replace("-", "+").Replace("_", "/")
  switch ($b64.Length % 4) {
    2 { $b64 += "==" }
    3 { $b64 += "=" }
  }
  try {
    $json = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64))
    return ($json | ConvertFrom-Json)
  } catch {
    return $null
  }
}

function Get-PropOrMissing($obj, [string]$prop) {
  if ($null -eq $obj) { return "<missing>" }
  $v = $obj.$prop
  if ($null -eq $v -or ($v -is [string] -and [string]::IsNullOrWhiteSpace($v))) { return "<missing>" }
  return $v
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$srcToken = Require-EnvVar "SRC_ACCESS_TOKEN"
$tgtToken = Require-EnvVar "TGT_ACCESS_TOKEN"

Write-Host "Validating tokens (decoded JWT payload)..."
$srcPayload = Decode-JwtPayload $srcToken
$tgtPayload = Decode-JwtPayload $tgtToken
Write-Host ("SRC iss: " + (Get-PropOrMissing $srcPayload "iss"))
Write-Host ("SRC sub: " + (Get-PropOrMissing $srcPayload "sub"))
Write-Host ("SRC exp: " + (Get-PropOrMissing $srcPayload "exp"))
Write-Host ("TGT iss: " + (Get-PropOrMissing $tgtPayload "iss"))
Write-Host ("TGT sub: " + (Get-PropOrMissing $tgtPayload "sub"))
Write-Host ("TGT exp: " + (Get-PropOrMissing $tgtPayload "exp"))

if ($srcPayload.iss -notlike "https://$SourceRef.supabase.co/auth/v1*") {
  throw "SRC_ACCESS_TOKEN is not for expected source project: $SourceRef"
}
if ($tgtPayload.iss -notlike "https://$TargetRef.supabase.co/auth/v1*") {
  throw "TGT_ACCESS_TOKEN is not for expected target project: $TargetRef"
}

Write-Host "Export from $SourceRef..."
$exportRes = Invoke-TransferWithRetry -ProjectRef $SourceRef -AccessToken $srcToken -Body @{ action = "export" }
if (-not $exportRes.bundle) { throw "Export did not return bundle" }

$bundlePath = Join-Path $OutDir "bundle_$SourceRef`_to_$TargetRef.json"
$exportRes.bundle | ConvertTo-Json -Depth 50 | Set-Content -Encoding UTF8 $bundlePath
Write-Host "Saved bundle to $bundlePath"

Write-Host "Preflight on $TargetRef..."
$preflightRes = Invoke-TransferWithRetry -ProjectRef $TargetRef -AccessToken $tgtToken -Body @{ action = "preflight"; bundle = $exportRes.bundle }
$preflightPath = Join-Path $OutDir "preflight_$TargetRef.json"
$preflightRes | ConvertTo-Json -Depth 50 | Set-Content -Encoding UTF8 $preflightPath

if (-not $preflightRes.report.ok) {
  Write-Host "Preflight failed. See $preflightPath"
  throw "Preflight failed"
}

$runId = $preflightRes.runId
if ([string]::IsNullOrWhiteSpace($runId)) { throw "Missing runId from preflight" }
Write-Host "Preflight OK. runId=$runId"

Write-Host "Commit on $TargetRef (this will create missing users via invite)..."
$commitRes = Invoke-TransferWithRetry -ProjectRef $TargetRef -AccessToken $tgtToken -Body @{ action = "commit"; runId = $runId; bundle = $exportRes.bundle }
$commitPath = Join-Path $OutDir "commit_$TargetRef`_$runId.json"
$commitRes | ConvertTo-Json -Depth 50 | Set-Content -Encoding UTF8 $commitPath

Write-Host "Commit finished. See $commitPath"
Write-Host ("Publish summary: " + ($commitRes.publish | ConvertTo-Json -Depth 10))

