# Pocket Bankshot QA — 2026-09-06

12 browser scenarios and 5 physics checks passed. Production build checked separately.

## Saves
- A real completed room persists across reload and closing/reopening Chromium with the same browser profile.
- A worse replay does not overwrite the best score.
- All 18 room records load correctly.
- Malformed JSON, invalid record types and out-of-range keys are handled safely.
- Blocked storage does not prevent completing a room. Persistence naturally cannot survive reload if browser storage is unavailable.
- Saves are local to the browser and site origin. They do not sync between devices or transfer from the private preview to Poki. In-progress shots are not saved.

## Phone and tablet
- Chromium phone: 390×844 and 844×390, using browser touch input.
- WebKit small phone: 375×667; iPad sizes: 768×1024 and 1024×768. Tap controls and synthetic touch drags exercise the WebKit event path.
- Verified menu/table/footer bounds, touch shots, three-spark collection, wins, next room, pause/resume and console errors.
- Rotating portrait → landscape → portrait preserves room state and allows continued touch play.
- Reviewed screenshots of phone menus, phone landscape table and iPad landscape table.
- Fixed clipped phone menus and off-screen tables in landscape. Added safe-area padding and larger controls.
- This is emulation on desktop Chromium/WebKit, not validation on physical iOS hardware or the exact shipped Mobile Safari build.

## Poki lifecycle
- Routed a deterministic SDK substitute through the actual SDK loader; did not serve live advertising.
- Loading-finished now fires when the Phaser scene is ready. Controls remain disabled until then.
- First player input starts gameplay. Start/stop events alternate without duplicates.
- Pause/resume and next-room transitions request commercial breaks at the return to gameplay.
- While an ad is pending: simulation position and shot count remain fixed, game buttons/keyboard/touch cannot alter the room, and the AudioContext is suspended.
- Ad completion restores gameplay and enabled sound. Rejected ad promises recover safely.
- Focus loss during an ad leaves the game paused until explicit resume.
- SDK script blocking and initialization failures still allow play.
- Fixed returning from the room selector after a win so it restores the result screen.
- Live ad playback, ad inventory, platform cookies and integration within a real Poki iframe still require Poki Inspector testing.

## Reproduce
Run `npm run dev`, then `npm run test:browser`. Browser binaries: `npx playwright install chromium webkit`. Run `npm test` for physics/reachability.

Local evidence is saved to `qa/` (ignored in source control). Browser harness: `tests/browser-qa.mjs`.

Reference: https://developers.poki.com/guide/sdk-html5
