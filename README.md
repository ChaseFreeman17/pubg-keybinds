# PUBG Keybind Visualizer & Editor

A static, client-side tool for viewing and editing PUBG (PC) keyboard/mouse
keybindings from `GameUserSettings.ini` — visually, on a keyboard and mouse
diagram. Runs entirely in the browser; your config file never leaves your
machine (there's no server component at all).

Try it: upload your `GameUserSettings.ini`, found by default at
`%LOCALAPPDATA%\TslGame\Saved\Config\WindowsNoEditor\GameUserSettings.ini`.

## What it does

1. **Parse** — finds PUBG's real keybind data and reads its
   `ActionKeyList` / `AxisKeyList` arrays (see "Where the data actually
   lives" below).
2. **Visualize** — highlights every bound key on a keyboard + mouse diagram;
   click a key to see what's bound there.
3. **Edit** — pick an action from the sidebar (or add a brand-new one), then
   press a physical key or click a key/mouse-button in the diagram to bind it.
   Shift/Ctrl/Alt modifiers are supported per binding.
4. **Export** — downloads an edited copy of the ini with only the relevant
   field changed; everything else in the file (graphics settings, crosshair
   colors, gamepad binds, etc.) is preserved byte-for-byte via a full
   round-trip through a generic UE4 property-list parser (`js/ueini.js`),
   not a blind find/replace. Verified against a real, populated config: a
   rebind + a removal + two brand-new bindings all survived a full
   parse → edit → export → re-parse cycle with the rest of the 70KB file
   untouched.

## Where the data actually lives (read this if numbers look off)

PUBG stores the **real, currently-in-effect** keybinds in a top-level ini
entry called:

```
CustomInputSettins=(...)
```

Yes — **PUBG itself misspells "Settings"** (missing the "g"). This sits
**alongside** `TslPersistantData` as its own top-level key, not nested inside
it. Confirmed against a real, actively-used profile: it held 47 action
bindings and 11 axis bindings, fully populated with the actual live keymap.

There is *also* a `CustomInputSettings` (correctly spelled) struct nested
inside `TslPersistantData.CustomInputSettings.ActionKeyList` — every real
profile inspected so far had this one completely empty
(`bHasKeySettingsChanged=False`), so it appears vestigial or used by a
different/older subsystem. This tool checks the real
(`CustomInputSettins`) field first and only falls back to the nested one if
the first isn't found — the loaded-file banner tells you which one it used.

**Binding shape:** each action/axis entry carries up to 3 key slots:
```
(ActionName="Fire",Keys=((Key=LeftMouseButton),(),()))
(AxisName="MoveUp",Scale=1.000000,Keys=((Key=SpaceBar),(),(Key=Gamepad_FaceButton_Bottom)))
```
`Keys=(slot0, slot1, slot2)` → slot 0 = primary keyboard/mouse, slot 1 =
secondary keyboard/mouse, slot 2 = gamepad. An empty slot is a literal `()`;
a bound one is a struct with a `Key` field and optional `bShift`/`bCtrl`/
`bAlt` modifiers. This tool only ever reads/writes slots 0 and 1 — the
gamepad slot is left completely alone.

Removing a binding here clears just that slot rather than deleting the whole
action entry, since the entry commonly still has other slots in use.

## Some bindings never appear no matter what (and that's expected)

PUBG only writes a binding to `GameUserSettings.ini` once you've changed it
from default **in that specific category**. Confirmed by direct comparison
against a real PUBG client's in-game Key Bindings screen: an entire category
("Basic Combat" — Primary/Secondary Weapon, Melee, Throwables, Cycle Firing
Mode, Holster Weapons) was completely absent from every field in a real
70KB config file, even though the in-game screen showed full default values
(1, 2, 3, 4, 5, B, X) for all of them. This isn't a parser bug — those
strings simply don't exist anywhere in the file under any name.

To at least show these, `js/keydata.js` includes a small `KNOWN_DEFAULTS`
list transcribed directly from a real client's screenshot (not guessed).
These render on the diagrams with a **dashed border** instead of a solid
fill, get their own "Known defaults" sidebar section, and are clearly
labeled as unconfirmed-in-file — they have no backing ini node, so they can
never be edited or exported here. The only way to make one of these real
(editable, exportable) is to rebind it once in-game — even to the same key —
which forces PUBG to finally write it to the file; then re-upload.

## Action name reference

The sidebar's friendly labels (e.g. "Aim (ADS)") come from `ACTION_REFERENCE`
in `js/keydata.js` — a list built from names **actually observed** with
populated keyboard/mouse slots in a real file, not guessed. Unknown action
names (there are hundreds of gamepad-only/system ones) just get their raw
name humanized (e.g. `ToggleFreeCameraLag` → "Toggle Free Camera Lag").
Contributions to extend this list from other confirmed configs are welcome.

**Recommendations before trusting an exported file:**
- Back up your original `GameUserSettings.ini` before overwriting it with an
  exported one.
- After importing an edited file, open PUBG's Key Binding screen and confirm
  the new/changed bindings show up correctly before playing a match.

## Running locally

No build step. Either open `index.html` directly, or serve the folder with
any static server, e.g.:

```
python -m http.server 8000
```

## Deploying to GitHub Pages

Push this repo to GitHub, then in Settings → Pages, set the source to the
`main` branch, root folder. No build step required.

## Files

- `index.html` / `style.css` — page structure and styling.
- `js/ueini.js` — generic parser/serializer for Unreal Engine's ini
  property-list syntax (structs, arrays, strings, raw tokens), plus helpers
  for reading/writing PUBG's 3-slot `Keys=(...)` binding shape (and a
  fallback path for the older single-`Key` wrapper shape, unused so far).
- `js/keydata.js` — physical-key-press → Unreal `FKey` name table, the visual
  keyboard/mouse layout data, and the action-name reference/humanizer.
- `js/app.js` — application state, rendering, editing, and export.
