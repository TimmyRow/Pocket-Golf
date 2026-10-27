# Pocket Putt: Poki preparation

## Form details

- Game title: Pocket Putt
- Engine: Phaser 3 / HTML5 / JavaScript
- Playable web version: https://timmyrow.github.io/Pocket-Golf/
- Source repository: https://github.com/TimmyRow/Pocket-Golf
- Players: solo or two-player local pass-and-play on the same device
- Controls: mouse or touch; drag backward from the ball and release to putt
- Content: 18 original miniature-golf courses, bank shots, bumpers, and water
- Saving: solo best scores stay in the player's browser. No account or server sync.
- Release status: publicly playable on GitHub Pages; not released or approved on Poki.

Description:

Pocket Putt is a pull-back-and-release mini-golf game across 18 shaped courses.
Judge your power, bounce off the rails, and navigate bumpers and water to reach
the cup in fewer strokes. Chase personal bests alone or take turns with a friend
in same-device two-player matches.

## Build and upload

1. Run `npm ci` and `npm run build:poki`.
2. Run `npm test` and `npm run test:poki` (install Playwright browsers first).
3. Upload the contents of `poki-dist`, not the source repository or `dist`.
   A ZIP must contain `index.html` at its root alongside `assets/`.
4. Each successful GitHub build also provides a `Pocket-Golf-Poki` artifact.
5. Use Poki Inspector before submitting the version for review.

The normal GitHub Pages build remains separate. It does not enable the SDK
unless explicitly opened with `?poki`. The Poki distribution enables the SDK
by default, strips the automation tools, and contains no source maps.
The SDK is its only application-requested external resource. There are no
external fonts, analytics, logins, or links in the game.

## SDK behavior

- Loading completion fires once after the playable scene is ready.
- Gameplay starts on player intent and stops on menus, completion, or focus loss.
- Commercial breaks are requested between holes, on replay/resume, and between
  players. Poki controls whether an ad is actually shown.
- Gameplay, input, and sound pause while waiting for a commercial break.
- Failed SDK initialization or ad requests do not prevent play.
- No rewarded ads: the game does not have a rewarded-ad mechanic.

## Verification and remaining checks

On October 27, 2026, all 49 local automated checks passed. A live Poki Inspector
smoke test completed a hole, advanced, and paused with the expected SDK events
and no warnings detected. This does not cover every Inspector checklist item
or a full displayed-ad test.

Automated coverage includes all 18 solvable holes, saved best scores, blocked
storage, cancel/outside-canvas dragging, rotation, two-player scoring, and
Chromium/WebKit/Firefox layouts. Compiled Poki tests cover 640x360, 836x470,
1031x580, 320x568, 375x667, 1024x768, and 1366x1024, ad lifecycle sequencing,
blocked SDK fallback, and scroll isolation inside an iframe.

The automated ad tests simulate the SDK; they are not proof that real ads pass
Poki review. Before requesting review:

- Review Inspector's event log and warnings while completing/replaying a hole,
  pausing/resuming, switching players, and backgrounding the tab during an ad.
- Test the Inspector QR preview on a physical iPhone and iPad, plus Android.
  Browser emulation does not replace physical-device testing.
- Confirm Poki's navigation pill does not overlap controls.
- Provide a square game thumbnail and any additional media requested by Poki.
- Have a parent/guardian handle account eligibility, agreements, and payment details.

Preparing this package does not submit an application or guarantee acceptance.

## Prepared media

Local deliverables are in `release/` (not included inside the game ZIP):

- `Pocket-Golf-Poki.zip`: game upload, with root `index.html` and bundled assets
- `Pocket-Putt-thumbnail.png`: 800x800 image from the actual game renderer
- `Pocket-Putt-gameplay.png`: gameplay screenshot
- `Pocket-Putt-gameplay.webm`: short gameplay reference clip, not a final
  animated thumbnail; follow Poki's requested video format when that is needed

To recapture these media files, start `npm run dev` then run
`node scripts/capture-submission.mjs`.

## Official references

- https://developers.poki.com/guide/requirements-quality
- https://developers.poki.com/guide/sdk-html5
- https://developers.poki.com/guide/inspector
- https://developers.poki.com/guide/adding-your-game
- https://developers.poki.com/guide/game-thumbnail
