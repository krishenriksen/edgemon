/* @refresh reload */
import { render } from 'solid-js/web';
import { createSignal, onMount, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import './index.css';

const root = document.getElementById('root');

function App() {
  const [cpuUsage, setCpuUsage] = createSignal(42);
  const [cpuTemp, setCpuTemp] = createSignal(0);
  const [cpuFrequency, setCpuFrequency] = createSignal(0);
  const [cpuPower, setCpuPower] = createSignal(0);

  const [gpuUsage, setGpuUsage] = createSignal(42)
  const [gpuMemUsed, setGpuMemUsed] = createSignal(0);
  const [gpuMemFree, setGpuMemFree] = createSignal(0);  
  const [gpuTemp, setGpuTemp] = createSignal(0);
  const [gpuFrequency, setGpuFrequency] = createSignal(0);
  const [gpuPower, setGpuPower] = createSignal(0);

  const [ramUsage, setRamUsage] = createSignal(42);
  const [ramUsedGB, setRamUsedGB] = createSignal(0);
  const [ramFreeGB, setRamFreeGB] = createSignal(0);
  const [ramTemp, setRamTemp] = createSignal(0);
  const [ramFrequency, setRamFrequency] = createSignal(0);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fps, setFps] = createSignal(0);

  const fetchHardwareInfo = async () => {
    try {
      const hw: any = await invoke('get_hardware_info');
      
      // Update CPU info
      if (hw.cpu) {
        setCpuUsage(hw.cpu.usage ?? cpuUsage());
        setCpuTemp(hw.cpu.temperature ?? cpuTemp());
        setCpuFrequency(hw.cpu.frequency ?? cpuFrequency());
        setCpuPower(hw.cpu.power ?? cpuPower());
      }
      
      // Update GPU info if available
      if (hw.gpu) {
        setGpuUsage(hw.gpu.usage ?? gpuUsage());
        setGpuMemUsed(hw.gpu.memory_used ?? gpuMemUsed());
        setGpuMemFree(hw.gpu.memory_free ?? gpuMemFree());
        setGpuTemp(hw.gpu.temperature ?? gpuTemp());        
        setGpuFrequency(hw.gpu.frequency ?? gpuFrequency());
        setGpuPower(hw.gpu.power ?? gpuPower());
      }
      
      // Update RAM info
      if (hw.ram) {
        setRamUsage(hw.ram.usage ?? ramUsage());
        setRamUsedGB(hw.ram.used ?? ramUsedGB());
        setRamFreeGB(hw.ram.free ?? ramFreeGB());
      }
    } catch (e) {
      console.error('Failed to get hardware info:', e);
    }
  };

  onMount(async () => {
    // Initial fetch
    await fetchHardwareInfo();
    
    // Set up polling interval
    const intervalId = setInterval(fetchHardwareInfo, 5000);
    
    // Clean up the interval on component unmount
    onCleanup(() => clearInterval(intervalId));
  });
  
  return (
    <div class="monitor-container">
      <div class="gauges-wrapper">
        <div class="gauge-section cpu">
          <div class="gauge-container">
            <div class="gauge-value">{cpuTemp()}</div>
            <div class="gauge-subtext">{cpuFrequency()} <span>MHz</span></div>
            <div class="gauge" data-percentage={cpuUsage()}>
              <svg viewBox="0 0 120 120">
                <circle class="gauge-background" cx="60" cy="60" r="54" />
                <circle class="gauge-outer-ring" cx="60" cy="60" r="57" />
                <circle class="gauge-inner-ring" cx="60" cy="60" r="46" />

                <path id="cpu-label-curve" d="M 100,40 A 80,80 0 0,1 100,80" fill="none" />
                <text class="gauge-label">
                  <textPath href="#cpu-label-curve" startOffset="50%" text-anchor="middle">
                    CPU
                  </textPath>
                </text>

                {Array.from({ length: 14 }).map((_, i) => {
                  // Map indices so that 0 corresponds to the top segment (12 o'clock position)
                  // and segments fill clockwise (to the right, toward bottom)
                  const topStartIndex = 3; // Index that corresponds to the top segment (12 o'clock)
                  const adjustedIndex = (i - topStartIndex + 14) % 14; // Rotate indices so top segment is first
                  
                  const isActive = adjustedIndex < Math.floor(cpuUsage() / (100 / 14));
                  const segmentAngle = 360 / 14;
                  const startAngle = -90 + (i * segmentAngle); // Keep original positioning of segments
                  const endAngle = startAngle + segmentAngle - 0.5;
                  
                  // Convert angles to radians for calculations
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  // Calculate arc coordinates
                  const x1 = 60 + 54 * Math.cos(startRad);
                  const y1 = 60 + 54 * Math.sin(startRad);
                  const x2 = 60 + 54 * Math.cos(endRad);
                  const y2 = 60 + 54 * Math.sin(endRad);
                  
                  // Arc flag needs to be different for segments spanning more than 180 degrees
                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                  
                  return (
                    <path 
                      class={`gauge-progress-segment ${isActive ? 'active cpu' : ''}`}
                      d={`M ${x1},${y1} A 54,54 0 ${largeArcFlag},1 ${x2},${y2}`}
                    />
                  );
                })}

                <path id="cpu-text-curve" d="M 20,40 A 40,40 0 0,0 20,80" fill="none" />
                <text class="gauge-utilization">
                  <textPath href="#cpu-text-curve" startOffset="50%" text-anchor="middle">
                    UTILIZATION
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div class="power-indicator cpu">
          <div class="power-value">{cpuPower().toFixed(2)}</div>
          <div class="power-unit">W</div>
          <div class="gauge" data-percentage={cpuPower() / 300 * 100}>
            <svg viewBox="0 0 120 120">
              <circle class="gauge-background" cx="60" cy="60" r="54" />
              <circle class="gauge-outer-ring" cx="60" cy="60" r="57" />
              <circle class="gauge-inner-ring" cx="60" cy="60" r="46" />                
              
              {Array.from({ length: 10 }).map((_, i) => {
                // Map indices so that 0 corresponds to the top segment (12 o'clock position)
                // and segments fill clockwise (to the right, toward bottom)
                const topStartIndex = 2; // Index that corresponds to the top segment (12 o'clock)
                const adjustedIndex = (i - topStartIndex + 10) % 10; // Rotate indices so top segment is first
                
                // Assuming max power is around 300W, adjust as needed
                const isActive = adjustedIndex < Math.floor((cpuPower() / 300) * 10);
                const segmentAngle = 360 / 10;
                const startAngle = -90 + (i * segmentAngle); // Keep original positioning of segments
                const endAngle = startAngle + segmentAngle - 0.5;
                
                // Convert angles to radians for calculations
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                // Calculate arc coordinates
                const x1 = 60 + 54 * Math.cos(startRad);
                const y1 = 60 + 54 * Math.sin(startRad);
                const x2 = 60 + 54 * Math.cos(endRad);
                const y2 = 60 + 54 * Math.sin(endRad);
                
                // Arc flag needs to be different for segments spanning more than 180 degrees
                const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                
                return (
                  <path 
                    class={`gauge-progress-segment ${isActive ? 'active cpu-power' : ''}`}
                    d={`M ${x1},${y1} A 54,54 0 ${largeArcFlag},1 ${x2},${y2}`}
                  />
                );
              })}
              
              <path id="power-text-curve" d="M 20,40 A 40,40 0 0,0 20,80" fill="none" />
              <text class="gauge-utilization">
                <textPath href="#power-text-curve" startOffset="50%" text-anchor="middle">
                  POWER
                </textPath>
              </text>
            </svg>
          </div>
        </div>
        
        <div class="gauge-section gpu">
          <div class="gauge-container">
            <div class="gauge-memory">
              <div><span>USED</span> {gpuMemUsed()} <span>MB</span></div>
              <div><span>FREE</span> {gpuMemFree()} <span>MB</span></div>
            </div>
            <div class="gauge-value">{gpuTemp()}</div>
            <div class="gauge-subtext">{gpuFrequency()} <span>MHz</span></div>
            <div class="gauge" data-percentage={gpuUsage()}>
              <svg viewBox="0 0 120 120">
                <circle class="gauge-background" cx="60" cy="60" r="54" />
                <circle class="gauge-outer-ring" cx="60" cy="60" r="57" />
                <circle class="gauge-inner-ring" cx="60" cy="60" r="46" />                

                <path id="gpu-label-curve" d="M 100,40 A 80,80 0 0,1 100,80" fill="none" />
                <text class="gauge-label">
                  <textPath href="#gpu-label-curve" startOffset="50%" text-anchor="middle">
                    GPU
                  </textPath>
                </text>

                {Array.from({ length: 14 }).map((_, i) => {
                  // Map indices so that 0 corresponds to the top segment (12 o'clock position)
                  // and segments fill clockwise (to the right, toward bottom)
                  const topStartIndex = 3; // Index that corresponds to the top segment (12 o'clock)
                  const adjustedIndex = (i - topStartIndex + 14) % 14; // Rotate indices so top segment is first
                  
                  const isActive = adjustedIndex < Math.floor(gpuUsage() / (100 / 14));
                  const segmentAngle = 360 / 14;
                  const startAngle = -90 + (i * segmentAngle); // Keep original positioning of segments
                  const endAngle = startAngle + segmentAngle - 0.5;
                  
                  // Convert angles to radians for calculations
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  
                  // Calculate arc coordinates
                  const x1 = 60 + 54 * Math.cos(startRad);
                  const y1 = 60 + 54 * Math.sin(startRad);
                  const x2 = 60 + 54 * Math.cos(endRad);
                  const y2 = 60 + 54 * Math.sin(endRad);
                  
                  // Arc flag needs to be different for segments spanning more than 180 degrees
                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                  
                  return (
                    <path 
                      class={`gauge-progress-segment ${isActive ? 'active gpu' : ''}`}
                      d={`M ${x1},${y1} A 54,54 0 ${largeArcFlag},1 ${x2},${y2}`}
                    />
                  );
                })}

                <path id="gpu-text-curve" d="M 20,40 A 40,40 0 0,0 20,80" fill="none" />
                <text class="gauge-utilization">
                  <textPath href="#gpu-text-curve" startOffset="50%" text-anchor="middle">
                    UTILIZATION
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div class="power-indicator gpu">
          <div class="power-value">{gpuPower().toFixed(2)}</div>
          <div class="power-unit">W</div>
          <div class="gauge" data-percentage={gpuPower() / 300 * 100}>
            <svg viewBox="0 0 120 120">
              <circle class="gauge-background" cx="60" cy="60" r="54" />
              <circle class="gauge-outer-ring" cx="60" cy="60" r="57" />
              <circle class="gauge-inner-ring" cx="60" cy="60" r="46" />                
              
              {Array.from({ length: 10 }).map((_, i) => {
                // Map indices so that 0 corresponds to the top segment (12 o'clock position)
                // and segments fill clockwise (to the right, toward bottom)
                const topStartIndex = 2; // Index that corresponds to the top segment (12 o'clock)
                const adjustedIndex = (i - topStartIndex + 10) % 10; // Rotate indices so top segment is first
                
                // Assuming max power is around 300W, adjust as needed
                const isActive = adjustedIndex < Math.floor((gpuPower() / 300) * 10);
                const segmentAngle = 360 / 10;
                const startAngle = -90 + (i * segmentAngle); // Keep original positioning of segments
                const endAngle = startAngle + segmentAngle - 0.5;
                
                // Convert angles to radians for calculations
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                // Calculate arc coordinates
                const x1 = 60 + 54 * Math.cos(startRad);
                const y1 = 60 + 54 * Math.sin(startRad);
                const x2 = 60 + 54 * Math.cos(endRad);
                const y2 = 60 + 54 * Math.sin(endRad);
                
                // Arc flag needs to be different for segments spanning more than 180 degrees
                const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                
                return (
                  <path 
                    class={`gauge-progress-segment ${isActive ? 'active gpu-power' : ''}`}
                    d={`M ${x1},${y1} A 54,54 0 ${largeArcFlag},1 ${x2},${y2}`}
                  />
                );
              })}
              
              <path id="power-text-curve" d="M 20,40 A 40,40 0 0,0 20,80" fill="none" />
              <text class="gauge-utilization">
                <textPath href="#power-text-curve" startOffset="50%" text-anchor="middle">
                  POWER
                </textPath>
              </text>
            </svg>
          </div>
        </div>

        <div class="gauge-section ram">
          <div class="gauge-container">
            <div class="gauge-memory">
              <div><span>USED</span> {ramUsedGB()} <span>GB</span></div>
              <div><span>FREE</span> {ramFreeGB()} <span>GB</span></div>
            </div>
            <div class="gauge-value">{ramTemp()}</div>
            <div class="gauge-subtext">{ramFrequency()} <span>MHz</span></div>
            <div class="gauge" data-percentage={ramUsage()}>
              <svg viewBox="0 0 120 120">
                <circle class="gauge-background" cx="60" cy="60" r="54" />
                <circle class="gauge-outer-ring" cx="60" cy="60" r="57" />
                <circle class="gauge-inner-ring" cx="60" cy="60" r="46" />                

                <path id="ram-label-curve" d="M 100,40 A 80,80 0 0,1 100,80" fill="none" />
                <text class="gauge-label">
                  <textPath href="#ram-label-curve" startOffset="50%" text-anchor="middle">
                    RAM
                  </textPath>
                </text>

                {Array.from({ length: 14 }).map((_, i) => {
                  // Map indices so that 0 corresponds to the top segment (12 o'clock position)
                  // and segments fill clockwise (to the right, toward bottom)
                  const topStartIndex = 3; // Index that corresponds to the top segment (12 o'clock)
                  const adjustedIndex = (i - topStartIndex + 14) % 14; // Rotate indices so top segment is first

                  const isActive = adjustedIndex < Math.floor(ramUsage() / (100 / 14));
                  const segmentAngle = 360 / 14;
                  const startAngle = -90 + (i * segmentAngle); // Keep original positioning of segments
                  const endAngle = startAngle + segmentAngle - 0.5;

                  // Convert angles to radians for calculations
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  // Calculate arc coordinates
                  const x1 = 60 + 54 * Math.cos(startRad);
                  const y1 = 60 + 54 * Math.sin(startRad);
                  const x2 = 60 + 54 * Math.cos(endRad);
                  const y2 = 60 + 54 * Math.sin(endRad);

                  // Arc flag needs to be different for segments spanning more than 180 degrees
                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                  return (
                    <path 
                      class={`gauge-progress-segment ${isActive ? 'active ram' : ''}`}
                      d={`M ${x1},${y1} A 54,54 0 ${largeArcFlag},1 ${x2},${y2}`}
                    />
                  );
                })}

                <path id="ram-text-curve" d="M 20,40 A 40,40 0 0,0 20,80" fill="none" />
                <text class="gauge-utilization">
                  <textPath href="#ram-text-curve" startOffset="50%" text-anchor="middle">
                    UTILIZATION
                  </textPath>
                </text>
              </svg>
            </div>
          </div>        
        </div>
      </div>
      
      <div class="bottom-panel">  
        <div class="fps-display">{fps()}</div>
        <div class="fps-label">FPS</div>
        <div class="upload">UP <span>00KB/s</span></div>
        <div class="download">DL <span>00KB/s</span></div>        
      </div>
    </div>
  );
}

if (root) {
  render(() => <App />, root);
}