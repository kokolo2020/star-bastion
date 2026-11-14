# Star Bastion Co-op

Multiplayer fortress defense for a livestream or big screen. Up to ten players scan the host QR code, join from their phones and claim a defense station.

## Play

- Open `index.html` to choose Host or Join.
- Open `host.html` on the stream/big screen. Players scan the QR code and enter a name on `play.html`.
- Each player builds and upgrades six slots using five turret types: Pulse, Cannon, Laser, Frost and Rail. Ready-up starts a wave; the host can also launch it. Players vote for team upgrades between waves and share the NOVA charge.
- Click **Join QR** (or Q) to enlarge the code. Full screen (or F) maximizes the battlefield. Keys 1–3 change speed; Space launches a prepared wave; N fires a charged NOVA.

## Space regions

Every five-wave block has a different space region, changing after the boss during the next preparation phase: **Aurora Reach** (1–5), **Ember Nebula** (6–10), **Glacial Drift** (11–15), **Shattered Belt** (16–20), **Verdant Rift** (21–25), **Eventide Horizon** (26–30). The cycle repeats from wave 31.

Host and phone battlefield share the same region ID in the host snapshot. The host's **Space region** selector overrides only scenery, with **Auto · every 5 waves** restoring progression. Changes crossfade over 2.4 seconds; reduced-motion mode switches immediately. Planets, crystals and asteroids are decorative, with no collision or gameplay effects. Procedural artwork is cached instead of rebuilt each frame; host and phones use the same cached artwork. No scenery downloads or API keys are required.

## Online multiplayer

Realtime uses Supabase Broadcast, with no tables. On the host press **K** and enter the project's Supabase URL and public anon/publishable key. Only public client credentials belong here—never a service-role key or other secret. The existing QR configuration flow passes the public configuration to joining phones.

Without configuration the game uses a same-origin `BroadcastChannel` preview: host and controller work in tabs of the same browser, not on different devices. The localhost QR in development is not a public join link. Deploy to HTTPS and configure Supabase before testing with viewers. This design update does not provision a Supabase project or change its permissions.

## Premium artwork & arcade audio

- New app icons, landing banner, five transparent turret sprites, upgraded lobby/HUD and phone controller.
- The host has an original procedural Web Audio soundtrack: atmospheric prep music, stronger percussion during combat and a faster boss score, plus firing/build/upgrade/wave/NOVA effects. No third-party music recordings or API calls.
- Use **SOUND → Enable sound** on the host. Browser interaction is required before any audio can play. Music, effects and volume are independent; settings persist in that browser. Hidden host pages mute audio. Phones do not play duplicate music.
- Sound follows the game state at normal musical tempo, independent of simulation speed.

## Verify locally

Serve the directory over HTTP, e.g. `python3 -m http.server 8977`. Open `host.html?room=TEST` and `play.html?room=TEST` on the same origin/browser. A Node install is needed only for checks:

```
node --test tests/*.cjs
```

The automated tests cover shared enemy/turret/effect rendering, focus-camera bounds, rich FX packets, station ownership, five weapons, energy costs, ready-up/NOVA, icon dimensions/transparency, JavaScript parsing and audio activation/scheduling/visibility. Browser QA additionally covers the phone build panel, synchronized gameplay and host sound toggles. Real device/Supabase latency and music listening should be checked before going live.

See `assets/art/ARTWORK.md` for asset sources and prompts.

Android layout regression preview: `tests/phone-layout.html` reproduces a charged NOVA and six max-level turrets at wave 21. Verify at 390×650 and 320×568: the battlefield fills the available screen (at least 180px high), NOVA/Ready stay in the bottom dock, and Build / upgrade opens a scrollable drawer with station/leave controls. The fixture is synthetic and has no real host; its offline status is expected.

### Phone battlefield graphics

Host and controller share `battle-renderer.js`: seven enemy silhouettes, shields, frost, textured aiming turrets, muzzle flashes, beams, explosions and NOVA. The controller defaults to a closer station view; **Show full battlefield** restores the overview. Canvas resolution follows the screen density (capped at 2×), while build/upgrade controls open in a scrollable drawer.

The host sends bounded visual updates at the existing 8 Hz rate; simulation, damage and purchases remain host-authoritative. Older running hosts remain compatible, but need a refresh between games to send the new beam, particle and aiming data. Refresh the phone to load the new renderer. The regression fixture includes synthetic rich effects and is not proof of real-device network latency.

The battle-first controller reserves the remaining viewport for the canvas and keeps upgrades collapsed initially. The station camera adapts to the available screen shape without stretching the artwork. Full overview preserves the complete battlefield aspect ratio; the closer station view fills a portrait screen.
