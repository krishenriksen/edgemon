#!/bin/bash
set -e

# Find the built executable in the release directory
BIN_PATH=$(find ./src-tauri/target -type f -path "*/release/edgemon.exe" | head -n 1)

if [ -z "$BIN_PATH" ]; then
  echo "Executable not found!"
  exit 1
fi

# Copy the DLL to the same directory as the executable
DLL_SRC="./LibreHardwareMonitorLib.dll"
DLL_DST="$(dirname "$BIN_PATH")/LibreHardwareMonitorLib.dll"

if [ -f "$DLL_SRC" ]; then
  cp "$DLL_SRC" "$DLL_DST"
  echo "Copied LibreHardwareMonitorLib.dll to $(dirname "$BIN_PATH")"
else
  echo "LibreHardwareMonitorLib.dll not found!"
  exit 1
fi

# Copy the PowerShell script to the same directory as the executable
PS1_SRC="./LibreHardwareMonitor.ps1"
PS1_DST="$(dirname "$BIN_PATH")/LibreHardwareMonitor.ps1"

if [ -f "$PS1_SRC" ]; then
  cp "$PS1_SRC" "$PS1_DST"
  echo "Copied LibreHardwareMonitor.ps1 to $(dirname "$BIN_PATH")"
else
  echo "LibreHardwareMonitor.ps1 not found!"
  exit 1
fi

echo "Compressing $BIN_PATH with UPX..."
upx --best --lzma "$BIN_PATH"