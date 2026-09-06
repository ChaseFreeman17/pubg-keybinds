/*
 * keydata.js — static reference data:
 *   - CODE_TO_UEKEY: physical KeyboardEvent.code -> Unreal Engine FKey name,
 *     used when the editor is "listening" for a real key press.
 *   - KEYBOARD_LAYOUT / NAV_LAYOUT / NUMPAD_LAYOUT: visual keyboard rows.
 *   - MOUSE_BUTTONS: visual mouse regions.
 *   - ACTION_REFERENCE: a small, best-effort lookup of friendly label +
 *     category for well-known PUBG action names. This is NOT a source of
 *     truth for default keybinds (PUBG does not store defaults in the ini
 *     file at all — see app.js banner) and unknown action names simply fall
 *     back to a humanized version of the raw name.
 */

const CODE_TO_UEKEY = {
  KeyA: 'A', KeyB: 'B', KeyC: 'C', KeyD: 'D', KeyE: 'E', KeyF: 'F', KeyG: 'G',
  KeyH: 'H', KeyI: 'I', KeyJ: 'J', KeyK: 'K', KeyL: 'L', KeyM: 'M', KeyN: 'N',
  KeyO: 'O', KeyP: 'P', KeyQ: 'Q', KeyR: 'R', KeyS: 'S', KeyT: 'T', KeyU: 'U',
  KeyV: 'V', KeyW: 'W', KeyX: 'X', KeyY: 'Y', KeyZ: 'Z',
  Digit0: 'Zero', Digit1: 'One', Digit2: 'Two', Digit3: 'Three', Digit4: 'Four',
  Digit5: 'Five', Digit6: 'Six', Digit7: 'Seven', Digit8: 'Eight', Digit9: 'Nine',
  Space: 'SpaceBar', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'BackSpace',
  CapsLock: 'CapsLock',
  ShiftLeft: 'LeftShift', ShiftRight: 'RightShift',
  ControlLeft: 'LeftControl', ControlRight: 'RightControl',
  AltLeft: 'LeftAlt', AltRight: 'RightAlt',
  MetaLeft: 'LeftCommand', MetaRight: 'RightCommand',
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
  Minus: 'Hyphen', Equal: 'Equals',
  BracketLeft: 'LeftBracket', BracketRight: 'RightBracket', Backslash: 'Backslash',
  Semicolon: 'Semicolon', Quote: 'Quote', Comma: 'Comma', Period: 'Period', Slash: 'Slash',
  Backquote: 'Tilde',
  F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6',
  F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
  NumLock: 'NumLock', ScrollLock: 'ScrollLock', Pause: 'Pause',
  Numpad0: 'NumPadZero', Numpad1: 'NumPadOne', Numpad2: 'NumPadTwo', Numpad3: 'NumPadThree',
  Numpad4: 'NumPadFour', Numpad5: 'NumPadFive', Numpad6: 'NumPadSix', Numpad7: 'NumPadSeven',
  Numpad8: 'NumPadEight', Numpad9: 'NumPadNine',
  NumpadAdd: 'Add', NumpadSubtract: 'Subtract', NumpadMultiply: 'Multiply',
  NumpadDivide: 'Divide', NumpadDecimal: 'Decimal', NumpadEnter: 'NumPadEnter',
};

// Friendly display labels for keys that don't read well verbatim.
const UEKEY_LABEL = {
  SpaceBar: 'Space', BackSpace: 'Backspace', LeftShift: 'L Shift', RightShift: 'R Shift',
  LeftControl: 'L Ctrl', RightControl: 'R Ctrl', LeftAlt: 'L Alt', RightAlt: 'R Alt',
  LeftCommand: 'Win', RightCommand: 'Win', CapsLock: 'Caps', Escape: 'Esc',
  PageUp: 'PgUp', PageDown: 'PgDn', Hyphen: '-', Equals: '=', LeftBracket: '[',
  RightBracket: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',',
  Period: '.', Slash: '/', Tilde: '`', NumPadEnter: 'Enter',
  Zero: '0', One: '1', Two: '2', Three: '3', Four: '4', Five: '5', Six: '6', Seven: '7', Eight: '8', Nine: '9',
  NumPadZero: '0', NumPadOne: '1', NumPadTwo: '2', NumPadThree: '3', NumPadFour: '4',
  NumPadFive: '5', NumPadSix: '6', NumPadSeven: '7', NumPadEight: '8', NumPadNine: '9',
  Add: '+', Subtract: '-', Multiply: '*', Divide: '/', Decimal: '.', NumLock: 'Num',
  LeftMouseButton: 'LMB', RightMouseButton: 'RMB', MiddleMouseButton: 'MMB',
  ThumbMouseButton: 'M4', ThumbMouseButton2: 'M5',
  MouseScrollUp: 'Scroll Up', MouseScrollDown: 'Scroll Down',
};

function ueKeyLabel(key) {
  return UEKEY_LABEL[key] || key;
}

// Each row entry: { label, key, u } — key is null for a blank spacer.
// `u` is width in "units" (1u = one standard key width); the renderer
// converts units to a 4-subcolumns-per-unit CSS grid so fractional widths
// (1.25u, 1.5u, 2.25u, 6.25u ...) line up exactly, matching a real ANSI layout.
const KEYBOARD_LAYOUT = [
  [ { label: 'Esc', key: 'Escape', u: 1 }, { key: null, u: 1 },
    { label: 'F1', key: 'F1', u: 1 }, { label: 'F2', key: 'F2', u: 1 }, { label: 'F3', key: 'F3', u: 1 }, { label: 'F4', key: 'F4', u: 1 },
    { key: null, u: 0.5 },
    { label: 'F5', key: 'F5', u: 1 }, { label: 'F6', key: 'F6', u: 1 }, { label: 'F7', key: 'F7', u: 1 }, { label: 'F8', key: 'F8', u: 1 },
    { key: null, u: 0.5 },
    { label: 'F9', key: 'F9', u: 1 }, { label: 'F10', key: 'F10', u: 1 }, { label: 'F11', key: 'F11', u: 1 }, { label: 'F12', key: 'F12', u: 1 } ],
  [ { label: '`', key: 'Tilde', u: 1 },
    { label: '1', key: 'One', u: 1 }, { label: '2', key: 'Two', u: 1 }, { label: '3', key: 'Three', u: 1 }, { label: '4', key: 'Four', u: 1 },
    { label: '5', key: 'Five', u: 1 }, { label: '6', key: 'Six', u: 1 }, { label: '7', key: 'Seven', u: 1 }, { label: '8', key: 'Eight', u: 1 },
    { label: '9', key: 'Nine', u: 1 }, { label: '0', key: 'Zero', u: 1 }, { label: '-', key: 'Hyphen', u: 1 }, { label: '=', key: 'Equals', u: 1 },
    { label: 'Backspace', key: 'BackSpace', u: 2 } ],
  [ { label: 'Tab', key: 'Tab', u: 1.5 },
    { label: 'Q', key: 'Q', u: 1 }, { label: 'W', key: 'W', u: 1 }, { label: 'E', key: 'E', u: 1 }, { label: 'R', key: 'R', u: 1 },
    { label: 'T', key: 'T', u: 1 }, { label: 'Y', key: 'Y', u: 1 }, { label: 'U', key: 'U', u: 1 }, { label: 'I', key: 'I', u: 1 },
    { label: 'O', key: 'O', u: 1 }, { label: 'P', key: 'P', u: 1 }, { label: '[', key: 'LeftBracket', u: 1 }, { label: ']', key: 'RightBracket', u: 1 },
    { label: '\\', key: 'Backslash', u: 1.5 } ],
  [ { label: 'Caps', key: 'CapsLock', u: 1.75 },
    { label: 'A', key: 'A', u: 1 }, { label: 'S', key: 'S', u: 1 }, { label: 'D', key: 'D', u: 1 }, { label: 'F', key: 'F', u: 1 },
    { label: 'G', key: 'G', u: 1 }, { label: 'H', key: 'H', u: 1 }, { label: 'J', key: 'J', u: 1 }, { label: 'K', key: 'K', u: 1 },
    { label: 'L', key: 'L', u: 1 }, { label: ';', key: 'Semicolon', u: 1 }, { label: "'", key: 'Quote', u: 1 },
    { label: 'Enter', key: 'Enter', u: 2.25 } ],
  [ { label: 'Shift', key: 'LeftShift', u: 2.25 },
    { label: 'Z', key: 'Z', u: 1 }, { label: 'X', key: 'X', u: 1 }, { label: 'C', key: 'C', u: 1 }, { label: 'V', key: 'V', u: 1 },
    { label: 'B', key: 'B', u: 1 }, { label: 'N', key: 'N', u: 1 }, { label: 'M', key: 'M', u: 1 },
    { label: ',', key: 'Comma', u: 1 }, { label: '.', key: 'Period', u: 1 }, { label: '/', key: 'Slash', u: 1 },
    { label: 'Shift', key: 'RightShift', u: 2.75 } ],
  [ { label: 'Ctrl', key: 'LeftControl', u: 1.25 }, { label: 'Win', key: 'LeftCommand', u: 1.25 }, { label: 'Alt', key: 'LeftAlt', u: 1.25 },
    { label: 'Space', key: 'SpaceBar', u: 6.25 },
    { label: 'Alt', key: 'RightAlt', u: 1.25 }, { label: 'Win', key: 'RightCommand', u: 1.25 }, { key: null, u: 1.25 },
    { label: 'Ctrl', key: 'RightControl', u: 1.25 } ],
];

const NAV_LAYOUT = [
  [ { label: 'Ins', key: 'Insert', u: 1 }, { label: 'Home', key: 'Home', u: 1 }, { label: 'PgUp', key: 'PageUp', u: 1 } ],
  [ { label: 'Del', key: 'Delete', u: 1 }, { label: 'End', key: 'End', u: 1 }, { label: 'PgDn', key: 'PageDown', u: 1 } ],
  [ { key: null, u: 1 }, { key: null, u: 1 }, { key: null, u: 1 } ],
  [ { key: null, u: 1 }, { label: '↑', key: 'Up', u: 1 }, { key: null, u: 1 } ],
  [ { label: '←', key: 'Left', u: 1 }, { label: '↓', key: 'Down', u: 1 }, { label: '→', key: 'Right', u: 1 } ],
];

const NUMPAD_LAYOUT = [
  [ { label: 'Num', key: 'NumLock', u: 1 }, { label: '/', key: 'Divide', u: 1 }, { label: '*', key: 'Multiply', u: 1 }, { label: '-', key: 'Subtract', u: 1 } ],
  [ { label: '7', key: 'NumPadSeven', u: 1 }, { label: '8', key: 'NumPadEight', u: 1 }, { label: '9', key: 'NumPadNine', u: 1 }, { label: '+', key: 'Add', u: 1 } ],
  [ { label: '4', key: 'NumPadFour', u: 1 }, { label: '5', key: 'NumPadFive', u: 1 }, { label: '6', key: 'NumPadSix', u: 1 }, { label: 'Enter', key: 'NumPadEnter', u: 1 } ],
  [ { label: '1', key: 'NumPadOne', u: 1 }, { label: '2', key: 'NumPadTwo', u: 1 }, { label: '3', key: 'NumPadThree', u: 1 }, { key: null, u: 1 } ],
  [ { label: '0', key: 'NumPadZero', u: 2 }, { label: '.', key: 'Decimal', u: 1 }, { key: null, u: 1 } ],
];

const MOUSE_BUTTONS = [
  { id: 'LeftMouseButton', label: 'LMB' },
  { id: 'RightMouseButton', label: 'RMB' },
  { id: 'MiddleMouseButton', label: 'MMB' },
  { id: 'MouseScrollUp', label: 'Scroll ↑' },
  { id: 'MouseScrollDown', label: 'Scroll ↓' },
  { id: 'ThumbMouseButton', label: 'M4' },
  { id: 'ThumbMouseButton2', label: 'M5' },
];

// Friendly labels/categories for action names CONFIRMED present (with real,
// non-empty keyboard/mouse slots) in an actual PUBG `CustomInputSettins`
// dump — not guesses. Anything not listed here just gets its raw name
// humanized instead of a made-up label. Hundreds of other entries in a real
// file are gamepad-only ("...Pad" suffixed) or otherwise KB/M-empty and
// intentionally aren't included here.
const ACTION_REFERENCE = {
  Fire: { label: 'Fire', category: 'Combat' },
  ADS: { label: 'Aim (ADS)', category: 'Combat' },
  Targeting: { label: 'Targeting', category: 'Combat' },
  Jump: { label: 'Jump', category: 'Movement' },
  JumpOnly: { label: 'Jump (no vault)', category: 'Movement' },
  VaultOnly: { label: 'Vault (no jump)', category: 'Movement' },
  Walk: { label: 'Walk (Toggle)', category: 'Movement' },
  PeekLeft: { label: 'Peek Left', category: 'Combat' },
  PeekRight: { label: 'Peek Right', category: 'Combat' },
  ToggleCamera: { label: 'Toggle Camera (1st/3rd Person)', category: 'Camera' },
  ToggleFreeCameraLag: { label: 'Toggle Free Camera Lag', category: 'Camera' },
  SwitchCameraFollow: { label: 'Switch Camera (Follow)', category: 'Camera' },
  SwitchCameraSpectator: { label: 'Switch Camera (Spectator)', category: 'Camera' },
  AddWayPoint: { label: 'Add Waypoint', category: 'UI' },
  ShowCarePackageItemList: { label: 'Show Care Package Item List', category: 'UI' },
  ShowPackageItemList: { label: 'Show Package Item List', category: 'UI' },
  ToVehicleSeat_1: { label: 'Enter Vehicle Seat 1', category: 'Vehicle' },
  ToVehicleSeat_2: { label: 'Enter Vehicle Seat 2', category: 'Vehicle' },
  ToggleVehicleRadio: { label: 'Toggle Vehicle Radio', category: 'Vehicle' },
  EmoteHK1: { label: 'Emote Hotkey 1', category: 'Communication' },
  ObserverSetFree: { label: 'Observer: Free Camera', category: 'Observer' },
  ObserverSaveCharacter1: { label: 'Observer: Save Character Slot 1', category: 'Observer' },
  ObserverSaveCharacter2: { label: 'Observer: Save Character Slot 2', category: 'Observer' },
  ObserverSaveCharacter3: { label: 'Observer: Save Character Slot 3', category: 'Observer' },
  ObserverSaveCharacter4: { label: 'Observer: Save Character Slot 4', category: 'Observer' },
  ObserverSaveLocation1: { label: 'Observer: Save Location 1', category: 'Observer' },
  ObserverSaveLocation2: { label: 'Observer: Save Location 2', category: 'Observer' },
  ObserverSaveLocation3: { label: 'Observer: Save Location 3', category: 'Observer' },
  ObserverSaveLocation4: { label: 'Observer: Save Location 4', category: 'Observer' },
  ObserverSetCharacterSpec1: { label: 'Observer: Go To Character 1', category: 'Observer' },
  ObserverSetCharacterSpec2: { label: 'Observer: Go To Character 2', category: 'Observer' },
  ObserverSetCharacterSpec3: { label: 'Observer: Go To Character 3', category: 'Observer' },
  ObserverSetCharacterSpec4: { label: 'Observer: Go To Character 4', category: 'Observer' },
  ObserverSetLocation1: { label: 'Observer: Go To Location 1', category: 'Observer' },
  ObserverSetLocation2: { label: 'Observer: Go To Location 2', category: 'Observer' },
  ObserverSetLocation3: { label: 'Observer: Go To Location 3', category: 'Observer' },
  ObserverSetLocation4: { label: 'Observer: Go To Location 4', category: 'Observer' },
  // Axis actions
  MoveUp: { label: 'Swim/Climb Up-Down', category: 'Movement' },
  VehicleMoveRight: { label: 'Vehicle Steer', category: 'Vehicle' },
  ObserverMoveUp: { label: 'Observer: Move Up-Down', category: 'Observer' },
  UI_MapMoveX: { label: 'Map Pan (X)', category: 'UI' },
  AirControlPitch: { label: 'Air Control: Pitch', category: 'Movement' },
  AirControlRoll: { label: 'Air Control: Roll', category: 'Movement' },
  ParachuteVehicleMoveForward: { label: 'Parachute: Move Forward', category: 'Movement' },
  ParachuteVehicleMoveRight: { label: 'Parachute: Move Right', category: 'Movement' },
};

const CATEGORY_COLORS = {
  Movement: '#4f8ff7', Combat: '#f75c5c', UI: '#a86bf7', Interaction: '#3ec98d',
  Vehicle: '#f7a94f', Communication: '#4fd0f7', Camera: '#c9c34f', Observer: '#e07bce',
  Other: '#8a8f98',
};

function humanizeActionName(name) {
  // e.g. "ToggleCrouch" -> "Toggle Crouch", "StartFirePad" -> "Start Fire Pad"
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function describeAction(name) {
  const ref = ACTION_REFERENCE[name];
  if (ref) return ref;
  return { label: humanizeActionName(name), category: 'Other' };
}

window.keydata = {
  CODE_TO_UEKEY, UEKEY_LABEL, ueKeyLabel,
  KEYBOARD_LAYOUT, NAV_LAYOUT, NUMPAD_LAYOUT, MOUSE_BUTTONS,
  ACTION_REFERENCE, CATEGORY_COLORS, describeAction,
};
