/*
 * ueini.js — a small, generic parser/serializer for the Unreal Engine 4
 * "property list" syntax used inside PUBG's GameUserSettings.ini values,
 * e.g.:
 *   TslPersistantData=(CustomInputSettings=(ActionKeyList=((ActionName="Jump",ActionKey=(Key=SpaceBar))),AxisKeyList=,...),...)
 *
 * This is NOT a full ini parser (sections aren't modeled) — it only needs to:
 *   1. find a single `Key=Value` line in the raw text by key name,
 *   2. parse that one value into a tree (struct / array / string / raw token),
 *   3. let calling code read/mutate specific nested fields,
 *   4. serialize the tree back to text, preserving field order and anything
 *      it doesn't understand, and splice it back into the original line.
 *
 * Node shapes:
 *   { type: 'empty' }                                   // nothing at all, e.g. `Foo=,`
 *   { type: 'string', value: 'Jump' }                    // "Jump"
 *   { type: 'raw', value: 'SpaceBar' }                   // bare enum/number/bool token
 *   { type: 'struct', fields: {...}, order: [...] }      // (A=1,B=2)
 *   { type: 'array', items: [node, node, ...] }          // (item,item,item)
 */

/** Split `str` on top-level commas — ignoring commas inside quotes or nested parens. */
function splitTopLevel(str) {
  const parts = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inQuotes) {
      current += c;
      if (c === '"' && str[i - 1] !== '\\') inQuotes = false;
      continue;
    }
    if (c === '"') { inQuotes = true; current += c; continue; }
    if (c === '(') { depth++; current += c; continue; }
    if (c === ')') { depth--; current += c; continue; }
    if (c === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += c;
  }
  if (current.length) parts.push(current);
  return parts;
}

function parseUEValue(raw) {
  const str = raw.trim();
  if (str === '') return { type: 'empty' };

  if (str[0] === '"' && str[str.length - 1] === '"') {
    return { type: 'string', value: str.slice(1, -1).replace(/\\"/g, '"') };
  }

  if (str[0] === '(' && str[str.length - 1] === ')') {
    const inner = str.slice(1, -1);
    if (inner.trim() === '') return { type: 'array', items: [] };
    const parts = splitTopLevel(inner);
    const looksLikeStruct = /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(parts[0].trim());
    if (looksLikeStruct) {
      const fields = {};
      const order = [];
      for (const part of parts) {
        const eq = part.indexOf('=');
        if (eq === -1) continue; // malformed field, skip defensively
        const key = part.slice(0, eq).trim();
        const valueRaw = part.slice(eq + 1);
        fields[key] = parseUEValue(valueRaw);
        order.push(key);
      }
      return { type: 'struct', fields, order };
    }
    return { type: 'array', items: parts.map(parseUEValue) };
  }

  return { type: 'raw', value: str };
}

function stringifyUEValue(node) {
  if (!node) return '';
  switch (node.type) {
    case 'empty': return '';
    case 'string': return '"' + String(node.value).replace(/"/g, '\\"') + '"';
    case 'raw': return node.value;
    case 'struct':
      return '(' + node.order.map((k) => k + '=' + stringifyUEValue(node.fields[k])).join(',') + ')';
    case 'array':
      return '(' + node.items.map(stringifyUEValue).join(',') + ')';
    default: return '';
  }
}

/** Find a top-level `KeyName=...` line in raw ini text (single physical line, any section). */
function findLine(text, keyName) {
  const re = new RegExp('^' + keyName + '=(.*)$', 'm');
  const m = re.exec(text);
  if (!m) return null;
  return { match: m, valueRaw: m[1], start: m.index, end: m.index + m[0].length };
}

/**
 * Given a struct node representing one ActionKeyList/AxisKeyList *item*,
 * locate the sub-node that actually holds the physical key, whether it's
 * a stock UE `Key=...` field directly, or a wrapped field like
 * `ActionKey=(Key=...)` / `GamepadActionKey=(Key=...)` (PUBG's own extension).
 * Returns { holder, wrapperFieldName } where holder.fields.Key is the key node,
 * or null if nothing recognizable was found.
 */
function findKeyHolder(itemStruct, preferredWrapper) {
  if (itemStruct.fields && itemStruct.fields.Key) {
    return { holder: itemStruct, wrapperFieldName: null };
  }
  if (preferredWrapper && itemStruct.fields && itemStruct.fields[preferredWrapper] &&
      itemStruct.fields[preferredWrapper].type === 'struct') {
    const w = itemStruct.fields[preferredWrapper];
    if (w.fields.Key) return { holder: w, wrapperFieldName: preferredWrapper };
  }
  for (const [fname, fval] of Object.entries(itemStruct.fields || {})) {
    if (fval.type === 'struct' && fval.fields.Key) {
      return { holder: fval, wrapperFieldName: fname };
    }
  }
  return null;
}

/** Build a brand-new ActionKeyList/AxisKeyList item struct (legacy single-key wrapper shape). */
function makeBindingItem(nameField, name, wrapperFieldName, keyName) {
  const keyStruct = { type: 'struct', fields: { Key: { type: 'raw', value: keyName } }, order: ['Key'] };
  const fields = {};
  const order = [];
  fields[nameField] = { type: 'string', value: name };
  order.push(nameField);
  fields[wrapperFieldName] = keyStruct;
  order.push(wrapperFieldName);
  return { type: 'struct', fields, order };
}

/*
 * PUBG's real, actually-populated binding format (confirmed against a live
 * GameUserSettings.ini) is a top-level `CustomInputSettins=(...)` entry
 * (note: PUBG itself misspells "Settings" here — sibling to TslPersistantData,
 * NOT nested inside it) whose ActionKeyList/AxisKeyList items look like:
 *   (ActionName="Fire",Keys=((Key=LeftMouseButton),(),()))
 *   (AxisName="MoveUp",Scale=1.000000,Keys=((Key=SpaceBar),(),(Key=Gamepad_FaceButton_Bottom)))
 * `Keys` is a 3-slot array: [0] primary keyboard/mouse, [1] secondary
 * keyboard/mouse, [2] gamepad. An empty slot parses as `{type:'array',items:[]}`
 * (from the literal `()`); a bound slot is a struct with a `Key` field and
 * optional bShift/bCtrl/bAlt modifier fields.
 */
const KB_SLOT_INDEXES = [0, 1]; // slot 2 is always gamepad; never read/written here

function getKeySlots(itemStruct) {
  const slots = itemStruct.fields && itemStruct.fields.Keys;
  return slots && slots.type === 'array' ? slots : null;
}

function ensureSlotsPadded(slotsNode, minLength) {
  while (slotsNode.items.length < minLength) slotsNode.items.push({ type: 'array', items: [] });
}

/** Set (or create) the keyboard/mouse binding in a given slot index (0 or 1). */
function setSlotKey(slotsNode, slotIndex, keyName) {
  ensureSlotsPadded(slotsNode, slotIndex + 1);
  slotsNode.items[slotIndex] = { type: 'struct', fields: { Key: { type: 'raw', value: keyName } }, order: ['Key'] };
  return slotsNode.items[slotIndex];
}

/** Clear a slot back to empty (`()`), preserving other slots untouched. */
function clearSlot(slotsNode, slotIndex) {
  if (slotsNode.items[slotIndex]) slotsNode.items[slotIndex] = { type: 'array', items: [] };
}

/** Build a brand-new ActionKeyList/AxisKeyList item using the real Keys-slots shape. */
function makeSlotsBindingItem(nameField, name, keyName, extraFieldsBeforeKeys) {
  const fields = {};
  const order = [];
  fields[nameField] = { type: 'string', value: name };
  order.push(nameField);
  if (extraFieldsBeforeKeys) {
    for (const [k, v] of Object.entries(extraFieldsBeforeKeys)) { fields[k] = v; order.push(k); }
  }
  const slot0 = { type: 'struct', fields: { Key: { type: 'raw', value: keyName } }, order: ['Key'] };
  fields.Keys = { type: 'array', items: [slot0, { type: 'array', items: [] }, { type: 'array', items: [] }] };
  order.push('Keys');
  return { type: 'struct', fields, order };
}

window.ueini = {
  splitTopLevel, parseUEValue, stringifyUEValue, findLine, findKeyHolder, makeBindingItem,
  KB_SLOT_INDEXES, getKeySlots, ensureSlotsPadded, setSlotKey, clearSlot, makeSlotsBindingItem,
};
