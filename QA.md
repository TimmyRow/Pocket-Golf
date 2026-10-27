# Pocket Putt QA

## Current scope

The star-collection prototype has been replaced by open-cup miniature golf.
All 18 courses use shaped fairways. The input is now pull-back-and-release,
not forward flicking. Old puzzle scores are not reused.

## Physics checks

- Putts stop, cannot be repeated while rolling, and stay within the course.
- Predictions do not mutate live state.
- Cups accept gentle putts immediately; fast putts can roll past.
- Water restores the previous lie without losing the counted stroke.
- All 18 holes are completed by routes executed through the real physics.
- Pull-back direction, offset grabs, tiny drags, and already-sunk balls are checked.
- Full-power shots at sampled angles stay inside every shaped fairway.
- Every course fits portrait phone, landscape phone, tablet, and desktop dimensions.

## Browser checks

- Chromium desktop 1440x900, phone 390x844 and 844x390.
- WebKit 375x667, 768x1024 and 1024x768.
- Chromium uses browser touch events; WebKit uses browser mouse/pointer drags.
- Menus, gameplay, and wins are screenshot-reviewed.
- Dragging, pause/resume, open-cup wins, next-hole flow, and rotation.
- Best scores survive reload and closing/reopening the same browser profile.
- Worse scores do not replace records; malformed or blocked storage is handled.
- Two-player handoff, independent stroke counts, winner, and totals.
- Canceling a drag, grabbing off-center, and releasing outside the canvas.
- SDK start/stop lifecycle, pending-ad input/audio freeze, recovery and failures.

These are desktop-browser/emulated-device checks, not physical iPhone/iPad testing.
Live advertising and a real Poki iframe still require Poki Inspector validation.
Pass-and-play has no network or iMessage component. Only solo records persist;
in-progress holes and match totals are session-only.

## Extended device matrix

`npm run test:devices` covers 14 configurations, each with an additional rotation:
320x568 and 568x320 small phones, 430x932 large phones, Android-sized 360x800
and 800x360, iPad split-screen 507x768, iPad 768x1024 and 1024x768,
iPad Pro 1366x1024, Chrome laptop 1366x768, Firefox 1440x900 and 360x640,
desktop WebKit 1440x900, and compact desktop 640x450 with reduced motion.

The matrix checks a completed hole, stroke count, UI clipping, canvas bounds,
last-hole selection, pause/resume, rotation, and browser errors. Chromium mobile
cases use actual browser touch input; WebKit and Firefox use mouse/pointer input.
Screenshots and results are in `qa/device-*.png` and `qa/device-results.json`.
Hardware-specific Safari, stylus, and mobile-browser chrome behavior remain
physical-device checks. There is no claim of support for every legacy browser.

GitHub Actions runs the physics, browser, and device suites before deployment.

## Reproduce

Run `npm run dev`, then `npm run test:browser`.
Run `npm test` for physics and course-frame checks.
Local screenshots and the latest result report are in `qa/` (gitignored).
Run `npm run build` to check the production bundle.
