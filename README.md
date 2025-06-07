## Usage

```bash
$ pnpm install
```

## Available Scripts

In the project directory, you can run:

### `pnpm run dev`

## Issues

Could not load file or assembly ...LibreHardwareMonitorLib.dll... Operation is not supported. (Exception from HRESULT: 0x80131515)

This error is caused by Windows blocking DLLs downloaded from the internet for security reasons.
The error message means the DLL is blocked by Windows.

How to Fix
Right-click on LibreHardwareMonitorLib.dll in File Explorer.
Select Properties.
At the bottom, if you see an "Unblock" checkbox, check it.
Click Apply and OK.

Tip:
You must unblock the DLL on every machine you copy it to, unless you unblock it before distributing.

## CPU Temperature Not Showing

If you are not seeing CPU temperature readings in Edgemon, this is often due to insufficient permissions. On Windows, accessing certain hardware sensors (such as CPU temperature) requires administrator privileges.

### Solution

**Run Edgemon as Administrator:**

1. Right-click on your Edgemon executable or shortcut.
2. Select **"Run as administrator"**.
3. Confirm any prompts from Windows User Account Control (UAC).

This should allow Edgemon to access all necessary hardware sensors and display CPU temperature correctly.