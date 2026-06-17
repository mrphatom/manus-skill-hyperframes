# Skill: Dynamic HyperFrames Render Engine

## Description
A fully dynamic programmatic video creation skill leveraging HeyGen's HTML-to-video framework (HyperFrames), GSAP, and headless Chromium.

## Capabilities & Inputs
This skill accepts dynamic parameters via the `MANUS_SKILL_ARGS` environment variable. The agent can inject custom HTML layouts, styles, and animation logic on the fly.

- `duration`: Length of the video in seconds (default: 5).
- `width`: Canvas width in pixels (e.g., 1080 for vertical, 1920 for landscape).
- `height`: Canvas height in pixels (e.g., 1920 for vertical, 1080 for landscape).
- `output_filename`: The final MP4 filename.
- `html_body`: Dynamic HTML structure (text, images, shapes).
- `css_styles`: Embedded CSS to style the structure.
- `gsap_logic`: The GreenSock (GSAP) timeline javascript logic.

## Execution Workflow
1. The agent will execute `node scripts/render.js`.
2. The script isolates a build environment in `/tmp/`.
3. It generates the valid `hyperframes.config.json` and `index.html` using the injected parameters.
4. It installs the necessary packages and executes `npx hyperframes render`.
