# Pocket Putt

A miniature golf game with 18 original shaped fairways, bank shots, bumpers, and water.
Pull backward from the ball and release to putt. Drag distance controls power; the ball
moves opposite the drag. Tiny drags cancel without counting a stroke. The cup is always
open, but a fast ball can roll over it. Water returns the ball to its last lie; the
stroke still counts, with no additional penalty.

Play solo for a personal best or choose 2 players for local pass-and-play.
Player 1 finishes each hole, then Player 2 plays the same hole from the tee.
Both scores are shown, the lower score wins the hole, and totals accumulate.
There is no online matchmaking or iMessage integration.

Solo records live only in this browser under `pocket-putt-golf-v1`.
Previous star-puzzle records are left untouched but are not imported into these
different courses. Match totals last for the current session. Restarting a hole
resets both players' results for that hole. In-progress strokes are not saved.

## Development

- `npm install`
- `npm run dev` (http://127.0.0.1:5188)
- `npm test`
- `npm run test:browser` with the dev server running
- `npm run test:devices` for the 14-configuration browser/device matrix
- `npm run build` for the static production build in `dist`

Install test browsers with `npx playwright install chromium webkit firefox`.

## GitHub Pages

Repository: https://github.com/TimmyRow/Pocket-Golf

The Pages workflow tests and builds each push to `main`, then deploys only `dist`.
Set GitHub Pages to GitHub Actions. Vite uses relative asset paths so the build
loads under `/Pocket-Golf/` without changing the Poki build.
The device test also accepts `QA_URL` to validate a hosted build.

Phaser renders the course. A separate fixed-step simulation handles rolling and
collisions. A single tile definition drives visual rails and collision boundaries.
Pointer capture keeps drags attached when the pointer leaves the canvas.
Cancel, focus loss, or resizing clears the aim without shooting.
The course camera fits each fairway to the available screen dimensions.

## Poki build

`npm run build:poki` creates a separate upload build in `poki-dist`.
`npm run test:poki` tests that compiled build without a dev server.
The GitHub workflow publishes it as the `Pocket-Golf-Poki` artifact.
See [POKI-SUBMISSION.md](POKI-SUBMISSION.md) for the upload checklist and form text.
The regular preview only enables it with `?poki`.
Automated tests use a simulated SDK, not live advertising.
Poki Inspector and physical iOS testing are still needed before release.
See `QA.md` for coverage. This project is not an approved Poki submission.

Reference: https://developers.poki.com/guide/sdk-html5
