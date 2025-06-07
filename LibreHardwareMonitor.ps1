# Load the LibreHardwareMonitorLib.dll
$dllPath = "LibreHardwareMonitorLib.dll"
Unblock-File -LiteralPath $dllPath
Add-Type -LiteralPath $dllPath

# Create and configure the Computer object
$monitor = New-Object LibreHardwareMonitor.Hardware.Computer
$monitor.IsCpuEnabled = $true
$monitor.IsGpuEnabled = $true
$monitor.IsMemoryEnabled = $true
$monitor.Open()

# Initialize variables for each metric
$cpuTotalLoad = $null
$cpuPackageTemp = $null
$cpuFrequency = $null
$cpuPackagePower = $null

$gpuTotalLoad = $null
$gpuTemperature = $null
$gpuFrequency = $null
$gpuPackagePower = $null

$ramLoad = $null
$ramUsed = $null
$ramFree = $null

foreach ($hardware in $monitor.Hardware) {
    $hardware.Update()

    # Gather CPU metrics
    if ($hardware.HardwareType -eq "Cpu") {
        foreach ($sensor in $hardware.Sensors) {
            switch ($sensor.SensorType) {
                "Load" {
                    if ($sensor.Name -like "CPU Total") {
                        $cpuTotalLoad = [math]::Round($sensor.Value)
                    }
                }

                "Temperature" {
                    if ($sensor.Name -like "CPU Package") {
                        $cpuPackageTemp = $sensor.Value
                    }
                }

                "Clock" {
                    if ($sensor.Name -like "CPU Core*" -and $cpuFrequency -eq $null) {
                        $cpuFrequency = [math]::Round($sensor.Value)
                    }
                }

                "Power" {
                    if ($sensor.Name -like "*Package*") {
                        $cpuPackagePower = [math]::Round($sensor.Value)
                    }
                }                
            }
        }
    }

    # Gather GPU metrics
    if ($hardware.HardwareType -like "Gpu*") {
        foreach ($sensor in $hardware.Sensors) {
            if ($sensor.SensorType -eq "Load" -and $sensor.Name -like "GPU Core") {
                $gpuTotalLoad = [math]::Round($sensor.Value)
            }

            if ($sensor.SensorType -eq "SmallData" -and $sensor.Name -like "*Memory Used*") {
                $gpuMemUsed = [math]::Round($sensor.Value)
            }
            if ($sensor.SensorType -eq "SmallData" -and $sensor.Name -like "*Memory Free*") {
                $gpuMemFree = [math]::Round($sensor.Value)
            }
            if ($sensor.SensorType -eq "SmallData" -and $sensor.Name -like "*Memory Total*") {
                $gpuMemTotal = [math]::Round($sensor.Value)
            }            

            if ($sensor.SensorType -eq "Temperature" -and $gpuTemperature -eq $null) {
                $gpuTemperature = [math]::Round($sensor.Value)
            }
            
            if ($sensor.SensorType -eq "Clock" -and $sensor.Name -like "GPU Core*" -and $gpuFrequency -eq $null) {
                $gpuFrequency = [math]::Round($sensor.Value)
            }
            
            if ($sensor.SensorType -eq "Power") {
                $gpuPackagePower = [math]::Round($sensor.Value)
            }
        }
    }

    # Gather RAM metrics
    if ($hardware.HardwareType -like "*Memory*") {
        foreach ($sensor in $hardware.Sensors) {
            if ($sensor.SensorType -eq "Load" -and $sensor.Name -eq "Memory") {
                $ramLoad = [math]::Round($sensor.Value)
            }

            if ($sensor.SensorType -eq "Data" -and $sensor.Name -like "Memory Used") {
                $ramUsed = [math]::Round($sensor.Value)
            }
            if ($sensor.SensorType -eq "Data" -and $sensor.Name -like "Memory Available") {
                $ramFree = [math]::Round($sensor.Value)
            }
        }
    }    
}

# Output results as JSON key-value object
$outputObject = [PSCustomObject]@{
    CpuTotalLoad    = $cpuTotalLoad
    CpuPackageTemp  = $cpuPackageTemp
    CpuFrequency    = $cpuFrequency
    CpuPackagePower = $cpuPackagePower

    GpuTotalLoad    = $GpuTotalLoad
    GpuMemoryUsed   = $gpuMemUsed
    GpuMemoryFree   = $gpuMemFree
    GpuMemoryTotal  = $gpuMemTotal    
    GpuTemperature  = $gpuTemperature
    GpuFrequency    = $gpuFrequency
    GpuPackagePower = $gpuPackagePower

    RamLoad         = $ramLoad
    RamUsed         = $ramUsed
    RamFree         = $ramFree 
}
$outputJson = $outputObject | ConvertTo-Json -Compress
Write-Output $outputJson

# Close the hardware monitoring
#$monitor.Close()