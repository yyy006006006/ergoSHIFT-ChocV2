param(
    [string]$ArduinoCli='arduino-cli',
    [string]$CompilerPath=(Join-Path $env:LOCALAPPDATA 'Arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7')
)
$ErrorActionPreference='Stop'
# 個人のArduino設定を変更せず、同梱した依存ソースで出荷版を再ビルドする。
if (!(Test-Path -LiteralPath (Join-Path $CompilerPath 'bin/avr-gcc.exe'))) { throw 'Install Arduino AVR Boards 1.8.6, or specify -CompilerPath for avr-gcc 7.3.0-atmel3.6.1-arduino7.' }
$buildRoot=Join-Path $PSScriptRoot 'tmp/source-build'
$dataRoot=Join-Path $buildRoot 'data'
New-Item -ItemType Directory -Path (Join-Path $dataRoot 'packages') -Force | Out-Null
# 他のインストール済みボードの影響を避け、必要な索引とCLI標準ツールだけを作業領域へコピーする。
$installedData=Join-Path $env:LOCALAPPDATA 'Arduino15'
foreach ($name in @('package_index.json','library_index.json')) {
    Copy-Item -LiteralPath (Join-Path $installedData $name) -Destination (Join-Path $dataRoot $name) -Force
}
if (!(Test-Path -LiteralPath (Join-Path $dataRoot 'packages/builtin'))) {
    Copy-Item -LiteralPath (Join-Path $installedData 'packages/builtin') -Destination (Join-Path $dataRoot 'packages/builtin') -Recurse
}
$configFile=Join-Path $buildRoot 'arduino-cli.json'
@{directories=@{user=(Join-Path $PSScriptRoot 'source-dependencies/arduino-user');data=$dataRoot;downloads=(Join-Path $buildRoot 'downloads')}} | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $configFile -Encoding utf8NoBOM
& $ArduinoCli --config-file $configFile compile --fqbn lufa:avr:leonardo --build-property "runtime.tools.avr-gcc.path=$CompilerPath" --build-path (Join-Path $buildRoot 'avr') --warnings all (Join-Path $PSScriptRoot 'LUFAHybridFightstick')
if ($LASTEXITCODE -ne 0) { throw 'Firmware compilation failed.' }
Write-Output (Join-Path $buildRoot 'avr/LUFAHybridFightstick.ino.hex')
