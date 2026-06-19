#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

// Composition identifier. HyperFrames registers timelines by composition id
// (window.__timelines[<id>]) and matches it against the root's data-composition-id.
const COMPOSITION_ID = 'main';

// Map the output extension to a HyperFrames render format so non-mp4 filenames
// (.webm/.mov/.gif) are encoded correctly instead of defaulting to mp4.
const EXT_FORMAT = { '.mp4': 'mp4', '.webm': 'webm', '.mov': 'mov', '.gif': 'gif' };
const OUTPUT_FORMAT = EXT_FORMAT[path.extname(OUTPUT_FILE).toLowerCase()] || 'mp4';

// Dynamic Structure injection (Allows Manus to create any layout)
const CUSTOM_CSS = inputArgs.css_styles || `
  body, html { margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px; background: linear-gradient(145deg, #0b0813, #020105); font-family: sans-serif; display: flex; justify-content: center; align-items: center; overflow: hidden; color: #fff; }
  h1 { font-size: 4.5rem; font-weight: 900; margin: 0; opacity: 0; transform: translateY(40px); }
`;
const CUSTOM_HTML = inputArgs.html_body || `<h1 id="render-target">${TEXT}</h1>`;
const CUSTOM_GSAP = inputArgs.gsap_logic || `
  window.timeline.to("#render-target", { opacity: 1, y: 0, duration: 1.2, ease: "power4.out" });
  window.timeline.to("#render-target", { opacity: 0, y: -30, duration: 0.8, ease: "power2.in" }, "+=${Math.max(DURATION - 2.2, 0)}");
`;

// 3. Establish strict workspace paths
let exitCode = 1;
const targetDir = path.join(os.tmpdir(), `hf_engine_${Date.now()}`);
fs.mkdirSync(targetDir, { recursive: true });

const outputDir = process.env.MANUS_OUTPUT_DIR || path.join(os.homedir(), 'downloads');
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

  // 5. Scaffold the dynamic HTML composition.
  //
  // HyperFrames derives the canvas size and clip duration from the root
  // element's data-* attributes (not from a config file), and drives the
  // animation from the paused timeline registered on window.__timelines.
  const htmlBoilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    /* The composition root is a transparent passthrough so layout written
       against <body> (as in the docs/examples) still applies to the content. */
    #root { display: contents; }
    ${CUSTOM_CSS}
  </style>
</head>
<body>
  <div id="root"
       data-composition-id="${COMPOSITION_ID}"
       data-start="0"
       data-duration="${DURATION}"
       data-width="${WIDTH}"
       data-height="${HEIGHT}">
    ${CUSTOM_HTML}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Expose window.timeline as an alias so injected gsap_logic that targets it keeps working.
    window.timeline = tl;
    ${CUSTOM_GSAP}
    window.__timelines = window.__timelines || {};
    window.__timelines["${COMPOSITION_ID}"] = tl;
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlBoilerplate);

  // 6. Execution Stack
  console.log("[INSTALL] Fetching core dependencies in sandbox...");
  execSync('npm install --silent', { cwd: targetDir, stdio: 'ignore' });
  
  console.log(`[RENDER] Compiling video. This may take a moment...`);
  // Using npx --yes ensures no interactive prompts block the agent
  execSync(`npx --yes hyperframes render --output ${exportPath} --format ${OUTPUT_FORMAT}`, { cwd: targetDir, stdio: 'inherit' });
  
  console.log(`\n[SUCCESS] Render complete! File saved to: ${exportPath}`);
  exitCode = 0;

} catch (error) {
  console.error("\n[ERROR] The compilation pipeline failed.");
  console.error(error.message);
  exitCode = 1;

} finally {
  // Always remove the transient sandbox so repeated renders don't leak ~700MB
  // of node_modules into /tmp (which is frequently a small tmpfs).
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
  } catch (cleanupError) {
    console.error(`[WARN] Failed to clean up workspace ${targetDir}: ${cleanupError.message}`);
  }
}

process.exit(exitCode);
