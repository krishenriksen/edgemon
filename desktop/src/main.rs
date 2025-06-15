// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::{Value, json};
use shell_util::{CommandOptions, Shell};
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, PhysicalPosition};

fn get_config_path(filename: &str) -> PathBuf {
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));
    exe_dir.join("resources").join(filename)
}

fn save_monitor_info(monitor_position: (i32, i32)) {
    let path = get_config_path("window_monitor.json");
    let data = json!({ "x": monitor_position.0, "y": monitor_position.1 });
    let _ = fs::write(path, serde_json::to_string(&data).unwrap());
}

fn load_monitor_info() -> Option<(i32, i32)> {
    let path = get_config_path("window_monitor.json");
    if let Ok(data) = fs::read_to_string(path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&data) {
            let x = json.get("x")?.as_i64()? as i32;
            let y = json.get("y")?.as_i64()? as i32;
            return Some((x, y));
        }
    }
    None
}

#[tauri::command]
async fn get_hardware_info() -> serde_json::Value {
    let script_path = get_config_path("LibreHardwareMonitor.ps1");
    let script_path_str = script_path.to_str().unwrap_or("LibreHardwareMonitor.ps1");

    // Build PowerShell command to run the script
    let args = [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        script_path_str,
    ];

    let output = Shell::exec("powershell", &args, &CommandOptions::default()).await;

    if let Ok(output) = output {
        if let Some(stdout) = output.stdout.as_str() {
            if let Ok(json) = serde_json::from_str::<Value>(stdout) {
                let cpu = json!({
                    "usage": json.get("CpuTotalLoad").cloned(),
                    "temperature": json.get("CpuPackageTemp").cloned(),
                    "frequency": json.get("CpuFrequency").cloned(),
                    "power": json.get("CpuPackagePower").cloned()
                });
                let gpu = json!({
                    "usage": json.get("GpuTotalLoad").cloned(),
                    "memory_used": json.get("GpuMemoryUsed").cloned(),
                    "memory_free": json.get("GpuMemoryFree").cloned(),
                    "memory_total": json.get("GpuMemoryTotal").cloned(),
                    "temperature": json.get("GpuTemperature").cloned(),
                    "frequency": json.get("GpuFrequency").cloned(),
                    "power": json.get("GpuPackagePower").cloned()
                });
                let ram = json!({
                    "usage": json.get("RamLoad").cloned(),
                    "used": json.get("RamUsed").cloned(),
                    "free": json.get("RamFree").cloned()
                });
                // Add network up/down in MB/s
                let net_up = json.get("NetUp").cloned();
                let net_dl = json.get("NetDl").cloned();

                return json!({
                    "cpu": cpu,
                    "gpu": gpu,
                    "ram": ram,
                    "NetUp": net_up,
                    "NetDl": net_dl
                });
            }
        }
    }
    // Fallback if error
    json!({
        "cpu": {
            "usage": null,
            "temperature": null,
            "frequency": null,
            "power": null
        },
        "gpu": {
            "usage": null,
            "memory_used": null,
            "memory_free": null,
            "memory_total": null,
            "temperature": null,
            "frequency": null,
            "power": null
        },
        "ram": {
            "usage": null,
            "used": null,
            "free": null
        },
        "NetUp": null,
        "NetDl": null
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_hardware_info])
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            // Make the window a "tool window"
            let _ = main_window.set_always_on_top(true);
            let _ = main_window.set_skip_taskbar(true);

            if let Some((x, y)) = load_monitor_info() {
                let _ = main_window.set_position(PhysicalPosition::new(x, y));
                let _ = main_window.set_fullscreen(true);
            }

            let main_window_for_event = main_window.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::Resized(_) = event {
                    if let Ok(is_maximized) = main_window_for_event.is_maximized() {
                        let _ = main_window_for_event.set_fullscreen(is_maximized);

                        if let Ok(monitor) = main_window_for_event.current_monitor() {
                            if let Some(monitor) = monitor {
                                let pos = monitor.position();
                                save_monitor_info((pos.x, pos.y));
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
