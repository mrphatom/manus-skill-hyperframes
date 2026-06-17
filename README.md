# HyperFrames Render Engine Skill for Manus AI

An advanced, fully dynamic media automation skill that packages HeyGen's open-source HTML-to-video rendering framework (HyperFrames) into a headless cloud utility for Manus AI.

## Repository Structure

manus-skill-hyperframes/
├── .gitignore
├── README.md
├── SKILL.md
├── package.json
└── scripts/
    └── render.js

## Features

- Fully Dynamic Canvas: Overrides default settings seamlessly. Pass custom HTML layouts, embedded CSS styles, and GSAP timeline scripts directly from the Manus agent prompt.
- Dynamic Aspect Ratios: Supports flexible viewport switching (e.g., vertical 1080x1920 for TikTok/Shorts, landscape 1920x1080 for YouTube, or square 1080x1080 for Instagram).
- Sandboxed Compilation: Isolates rendering instances inside transient folders to ensure execution reliability and zero caching bugs.

## Skill Invocation Examples

When logged into Manus AI, you can run this skill by triggering its manifest boundaries.

Example 1: Default State (Text Only)
/hyperframes --text "Solana Breakpoint 2026" --duration 5 --output_filename solana.mp4

Example 2: Custom Landscape Component layout (Fully Dynamic Override)
/hyperframes --width 1920 --height 1080 --duration 6 --output_filename promo.mp4 --html_body "<div class='badge'>Live Now</div><h2 id='main-title'>AI Agents Are Here</h2>" --css_styles "body { background: #000; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; } .badge { background: red; padding: 10px 20px; font-weight: bold; border-radius: 20px; opacity: 0; } #main-title { font-size: 4rem; margin-top: 20px; opacity: 0; }" --gsap_logic "window.timeline.to('.badge', { opacity: 1, scale: 1.1, duration: 0.5 }).to('#main-title', { opacity: 1, y: 0, duration: 0.8 }, '-=0.2');"

## License
MIT
