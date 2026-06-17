#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Safely parse dynamic arguments from Manus
let inputArgs = {};
if (process.env.MANUS_SKILL_ARGS) {
  try {
    inputArgs = JSON.parse(process.env.MANUS_SKILL_ARGS);
  } catch (e) {
    console.error("Warning: Failed to parse MANUS_SKILL_ARGS. Using defaults.");
  }
}

// 2. Set dynamic parameters with strict fallbacks
const TEXT = inputArgs.text || 'Built via Manus';
const DURATION = parseInt(inputArgs.duration, 10) || 5;
const WIDTH = parseInt(inputArgs.width, 10) || 1080;
const HEIGHT = parseInt(inputArgs.height, 10) || 1920;
const OUTPUT_FILE = inputArgs.output_filename || `render_${Date.now()}.mp4`;

// Dynamic Structure injection (Allows Manus to create any layout)
const CUSTOM_CSS = inputArgs.css_styles || `
  body, html { margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px; background: linear-gradient(145deg, #0b0813, #020105); font-family: sans-serif; display: flex; justify-content: center; align-items: center; overflow: hidden; color: #fff; }
  h1 { font-size: 4.5rem; font-weight: 900; margin: 0; opacity: 0; transform: translateY(40px); }
`;
const CUSTOM_HTML = inputArgs.html_body || `<h1 id="render-target">${TEXT}</h1>`;
const CUSTOM_GSAP = inputArgs.gsap_logic || `
  window.timeline.to("#render-target", { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" });
  window.timeline.to("#render-target", { opacity: 0, y: -30, duration: 0.8, ease: "power2.in" }, "+=${DURATION - 2.2}");
`;

// 3. Establish strict workspace paths
const targetDir = path.join('/tmp', `hf_engine_${Date.now()}`);
fs.mkdirSync(targetDir, { recursive: true });

const outputDir = '/home/ubuntu/downloads';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const exportPath = path.join(outputDir, OUTPUT_FILE);

console.log(`[INIT] Setting up workspace: ${targetDir}`);
console.log(`[CONFIG] Resolution: ${WIDTH}x${HEIGHT} | Duration: ${DURATION}s`);

try {
  // 4. Generate local package.json to ensure clean module resolution for npx
  const tempPackage = {
    name: "hyperframes-temp-render",
    dependencies: { "hyperframes": "latest", "gsap": "^3.12.5" }
  };
  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(tempPackage, null, 2));

  // 5. Generate HyperFrames config
  const hfConfig = {
    width: WIDTH,
    height: HEIGHT,
    fps: 30,
    duration: DURATION,
    timeline: "window.timeline" 
  };
  fs.writeFileSync(path.join(targetDir, 'hyperframes.config.json'), JSON.stringify(hfConfig, null, 2));

  // 6. Scaffold the dynamic HTML
  const htmlBoilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    ${CUSTOM_CSS}
  </style>
</head>
<body>
  ${CUSTOM_HTML}
  <script>
    window.timeline = gsap.timeline({ paused: true });
    ${CUSTOM_GSAP}
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlBoilerplate);

  // 7. Execution Stack
  console.log("[INSTALL] Fetching core dependencies in sandbox...");
  execSync('npm install --silent', { cwd: targetDir, stdio: 'ignore' });
  
  console.log(`[RENDER] Compiling video. This may take a moment...`);
  // Using npx --yes ensures no interactive prompts block the agent
  execSync(`npx --yes hyperframes render --output ${exportPath}`, { cwd: targetDir, stdio: 'inherit' });
  
  console.log(`\n[SUCCESS] Render complete! File saved to: ${exportPath}`);
  process.exit(0);

} catch (error) {
  console.error("\n[ERROR] The compilation pipeline failed.");
  console.error(error.message);
  process.exit(1);
}
