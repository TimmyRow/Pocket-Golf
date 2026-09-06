# Pocket Bankshot

A compact 18-room ricochet puzzle. Drag from the white puck toward a target, then release. Drag farther for more power. Collect three sparks to open the green pocket. Gold: par or better; silver: within two shots of par; bronze: any finish. Bumpers bounce, red holes return the puck to its previous position, and retries are unlimited.

Mouse and touch; R retries; P or Escape pauses. Progress stays in browser storage. All rooms are available immediately.

## Development

`npm install`, then `npm run dev`. `npm test` checks physics and proves every room can be completed with collision-safe routes executed through the real simulation. `npm run build` creates the standalone static site in `dist`.

`npx vite build --outDir poki-dist --mode poki` creates the Poki build with the SDK enabled by default. Package the contents of that folder with index.html at the archive root. The regular private preview avoids loading the SDK unless `?poki` is present.

Phaser 3 handles the table renderer and input. The fixed 120 Hz simulation is separate in src/physics.js. All visuals are functional game geometry; no external art, font, music, or paid asset dependencies. Audio is synthesized after user interaction.

## Validation and release scope

Automated physics, reachability, and production build checks are included. Browser/device visual QA and Poki Inspector validation remain release checks; this is a playable prototype, not an approved Poki submission. WebMCP read/start tools are feature-detected; no supported WebMCP validation context was available during this build.

Poki integration reference: https://developers.poki.com/guide/sdk-html5
