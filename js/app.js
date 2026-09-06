/* app.js — wiring: load file, parse, render keyboard/mouse, edit, export. */
(function () {
  const { KEYBOARD_LAYOUT, NAV_LAYOUT, NUMPAD_LAYOUT, MOUSE_BUTTONS,
          ACTION_REFERENCE, CATEGORY_COLORS, describeAction, ueKeyLabel } = window.keydata;
  const ueini = window.ueini;
  const COLS_PER_UNIT = 4;

  const state = {
    rawText: null, filename: null, lineStart: 0, lineEnd: 0,
    exportKey: null, rootNode: null, cisNode: null, items: [], keyToBindings: {},
    listening: null, dirty: false,
  };
  let nextId = 1;

  // ---------- DOM refs ----------
  const el = (id) => document.getElementById(id);
  const bannerEl = el('banner');
  const exportBtn = el('exportBtn');
  const fileInput = el('fileInput');
  const detailPanel = el('detailPanel');
  const detailBody = el('detailBody');
  const actionListEl = el('actionList');
  const searchBox = el('searchBox');
  const newKind = el('newKind');
  const newKnownAction = el('newKnownAction');
  const newCustomName = el('newCustomName');
  const newBindBtn = el('newBindBtn');
  let listeningBannerEl = null;

  // ---------- banner ----------
  function showBanner(type, msg) {
    bannerEl.hidden = false;
    bannerEl.className = 'banner ' + type;
    bannerEl.textContent = msg;
  }
  function hideBanner() { bannerEl.hidden = true; }

  // ---------- static layout build ----------
  function buildStatic(containerId, rows) {
    const container = el(containerId);
    container.innerHTML = '';
    for (const row of rows) {
      for (const def of row) {
        const div = document.createElement('div');
        const span = Math.round(def.u * COLS_PER_UNIT);
        div.style.gridColumn = 'span ' + span;
        if (!def.key) {
          div.className = 'key spacer';
        } else {
          div.className = 'key';
          div.dataset.key = def.key;
          div.textContent = def.label || '';
          div.title = def.key;
        }
        container.appendChild(div);
      }
    }
  }

  function buildMouseStatic() {
    const container = el('mouseDiagram');
    container.innerHTML = '';
    for (const btn of MOUSE_BUTTONS) {
      const div = document.createElement('div');
      div.className = 'mouse-btn';
      div.dataset.key = btn.id;
      div.textContent = btn.label;
      div.title = btn.id;
      container.appendChild(div);
    }
  }

  buildStatic('kbMain', KEYBOARD_LAYOUT);
  buildStatic('kbNav', NAV_LAYOUT);
  buildStatic('kbNumpad', NUMPAD_LAYOUT);
  buildMouseStatic();

  // ---------- click delegation on keyboard + mouse ----------
  function onDiagramClick(e) {
    const target = e.target.closest('[data-key]');
    if (!target) return;
    const ueKey = target.dataset.key;
    if (state.listening) {
      commitBinding(ueKey);
    } else {
      showDetail(ueKey);
    }
  }
  el('keyboardRow').addEventListener('click', onDiagramClick);
  el('mouseDiagram').addEventListener('click', onDiagramClick);
  el('detailClose').addEventListener('click', () => { detailPanel.hidden = true; });

  // ---------- indexing / highlighting ----------
  function rebuildIndex() {
    state.keyToBindings = {};
    for (const item of state.items) {
      (state.keyToBindings[item.ueKey] = state.keyToBindings[item.ueKey] || []).push(item);
    }
  }

  function updateHighlights() {
    document.querySelectorAll('[data-key]').forEach((elm) => {
      const key = elm.dataset.key;
      const bound = state.keyToBindings[key] && state.keyToBindings[key].length > 0;
      elm.classList.toggle('bound', !!bound);
      elm.classList.toggle('listening-target', !!state.listening);
      if (bound) {
        elm.title = key + ': ' + state.keyToBindings[key].map((b) => describeAction(b.name).label).join(', ');
      } else {
        elm.title = key;
      }
    });
  }

  function showDetail(ueKey) {
    const bindings = state.keyToBindings[ueKey] || [];
    detailPanel.hidden = false;
    if (bindings.length === 0) {
      detailBody.innerHTML = `<h3>${ueKeyLabel(ueKey)}</h3><p class="muted" style="font-size:0.85rem;">Nothing bound here. Use "Add binding" in the sidebar to bind an action to this key.</p>`;
      return;
    }
    detailBody.innerHTML = `<h3>${ueKeyLabel(ueKey)}</h3>` + bindings.map((b) => {
      const d = describeAction(b.name);
      return `<div class="detail-binding"><span>${d.label}${b.kind === 'axis' ? ' <span class="muted">(axis)</span>' : ''}${b.slotIndex === 1 ? ' <span class="muted">(2nd)</span>' : ''}</span>
        <button data-remove="${b.id}" class="btn" style="padding:2px 8px;font-size:0.72rem;">Remove</button></div>`;
    }).join('');
    detailBody.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeItem(Number(btn.dataset.remove)));
    });
  }

  // ---------- sidebar ----------
  function renderSidebar() {
    const filter = searchBox.value.trim().toLowerCase();
    actionListEl.innerHTML = '';
    el('bindingCount').textContent = state.items.length ? `(${state.items.length})` : '';

    const grouped = {};
    for (const item of state.items) {
      const d = describeAction(item.name);
      if (filter && !d.label.toLowerCase().includes(filter) && !item.name.toLowerCase().includes(filter)) continue;
      (grouped[d.category] = grouped[d.category] || []).push({ item, d });
    }
    const categories = Object.keys(grouped).sort((a, b) => (a === 'Other') - (b === 'Other') || a.localeCompare(b));
    if (categories.length === 0) {
      actionListEl.innerHTML = `<p class="muted" style="font-size:0.85rem;">${state.items.length ? 'No bindings match your filter.' : 'No bindings yet.'}</p>`;
      return;
    }
    for (const cat of categories) {
      const title = document.createElement('div');
      title.className = 'action-group-title';
      title.textContent = cat;
      actionListEl.appendChild(title);
      for (const { item, d } of grouped[cat]) {
        actionListEl.appendChild(renderActionRow(item, d));
      }
    }
  }

  function renderActionRow(item, d) {
    const row = document.createElement('div');
    row.className = 'action-row';
    const color = CATEGORY_COLORS[d.category] || CATEGORY_COLORS.Other;
    const mods = getMods(item.holder);
    row.innerHTML = `
      <div class="action-row-top">
        <span class="action-cat-dot" style="background:${color}"></span>
        <span class="action-name" title="${item.name}">${d.label}${item.kind === 'axis' ? ' <span class="muted">(axis)</span>' : ''}${item.slotIndex === 1 ? ' <span class="muted">(2nd)</span>' : ''}</span>
        <span class="key-pill">${ueKeyLabel(item.ueKey)}</span>
      </div>
      <div class="mods-row">
        <label><input type="checkbox" data-mod="bShift" ${mods.shift ? 'checked' : ''}> Shift</label>
        <label><input type="checkbox" data-mod="bCtrl" ${mods.ctrl ? 'checked' : ''}> Ctrl</label>
        <label><input type="checkbox" data-mod="bAlt" ${mods.alt ? 'checked' : ''}> Alt</label>
      </div>
      <div class="action-row-buttons">
        <button data-act="rebind">Rebind</button>
        <button data-act="remove" class="danger">Remove</button>
      </div>`;
    row.querySelector('[data-act="rebind"]').addEventListener('click', () => startListening({ mode: 'existing', item }));
    row.querySelector('[data-act="remove"]').addEventListener('click', () => removeItem(item.id));
    row.querySelectorAll('[data-mod]').forEach((cb) => {
      cb.addEventListener('change', () => { setMod(item.holder, cb.dataset.mod, cb.checked); markDirty(); });
    });
    return row;
  }

  function getMods(holder) {
    return {
      shift: !!(holder.fields.bShift && holder.fields.bShift.value === 'True'),
      ctrl: !!(holder.fields.bCtrl && holder.fields.bCtrl.value === 'True'),
      alt: !!(holder.fields.bAlt && holder.fields.bAlt.value === 'True'),
    };
  }
  function setMod(holder, field, value) {
    if (value) {
      holder.fields[field] = { type: 'raw', value: 'True' };
      if (!holder.order.includes(field)) holder.order.push(field);
    } else {
      delete holder.fields[field];
      holder.order = holder.order.filter((k) => k !== field);
    }
  }

  // ---------- listening / editing ----------
  function startListening(payload) {
    state.listening = payload;
    if (!listeningBannerEl) {
      listeningBannerEl = document.createElement('div');
      listeningBannerEl.className = 'listening-banner';
      document.querySelector('.layout').before(listeningBannerEl);
    }
    const label = payload.mode === 'existing' ? describeAction(payload.item.name).label : describeAction(payload.name).label;
    listeningBannerEl.innerHTML = `<span>Press a key, or click a key/mouse button below, to bind "<strong>${label}</strong>". Esc cancels.</span><button id="cancelListenBtn">Cancel</button>`;
    listeningBannerEl.hidden = false;
    el('cancelListenBtn').addEventListener('click', cancelListening);
    updateHighlights();
  }

  function cancelListening() {
    state.listening = null;
    if (listeningBannerEl) listeningBannerEl.hidden = true;
    updateHighlights();
  }

  window.addEventListener('keydown', (e) => {
    if (!state.listening) return;
    if (e.code === 'Escape') { e.preventDefault(); cancelListening(); return; }
    const ueKey = window.keydata.CODE_TO_UEKEY[e.code];
    if (!ueKey) return; // unmapped key: ignore, let it pass through
    e.preventDefault();
    commitBinding(ueKey);
  }, true);

  function ensureListNode(kind) {
    const fieldName = kind === 'action' ? 'ActionKeyList' : 'AxisKeyList';
    let node = state.cisNode.fields[fieldName];
    if (!node || node.type !== 'array') {
      node = { type: 'array', items: [] };
      state.cisNode.fields[fieldName] = node;
      if (!state.cisNode.order.includes(fieldName)) state.cisNode.order.push(fieldName);
    }
    return node;
  }

  function commitBinding(ueKey) {
    if (!state.listening) return;
    if (state.listening.mode === 'existing') {
      const item = state.listening.item;
      item.holder.fields.Key = { type: 'raw', value: ueKey };
      if (!item.holder.order.includes('Key')) item.holder.order.unshift('Key');
      item.ueKey = ueKey;
    } else {
      // New bindings always use PUBG's real Keys-slots shape (confirmed against
      // a live config), regardless of which container the file's existing
      // entries happened to use.
      const { kind, name } = state.listening;
      const nameField = kind === 'action' ? 'ActionName' : 'AxisName';
      const listNode = ensureListNode(kind);
      const extra = kind === 'axis' ? { Scale: { type: 'raw', value: '1.000000' } } : null;
      const newNode = ueini.makeSlotsBindingItem(nameField, name, ueKey, extra);
      listNode.items.push(newNode);
      const slots = ueini.getKeySlots(newNode);
      const holder = slots.items[0];
      state.items.push({ id: nextId++, kind, nameField, format: 'slots', slotsNode: slots, slotIndex: 0, node: newNode, name, ueKey, holder });
    }
    state.listening = null;
    if (listeningBannerEl) listeningBannerEl.hidden = true;
    markDirty();
    renderAll();
  }

  function removeItem(id) {
    const idx = state.items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const item = state.items[idx];
    if (item.format === 'slots') {
      // Clear just this slot — the action entry itself stays (it may have a
      // second keyboard/mouse slot or a gamepad slot still bound).
      ueini.clearSlot(item.slotsNode, item.slotIndex);
    } else {
      // Legacy single-key shape: remove the whole entry from its list.
      const fieldName = item.kind === 'action' ? 'ActionKeyList' : 'AxisKeyList';
      const listNode = state.cisNode.fields[fieldName];
      if (listNode && listNode.type === 'array') {
        const nodeIdx = listNode.items.indexOf(item.node);
        if (nodeIdx !== -1) listNode.items.splice(nodeIdx, 1);
      }
    }
    state.items.splice(idx, 1);
    markDirty();
    detailPanel.hidden = true;
    renderAll();
  }

  function markDirty() { state.dirty = true; exportBtn.disabled = false; }

  function renderAll() {
    rebuildIndex();
    updateHighlights();
    renderSidebar();
  }

  // ---------- add-binding form ----------
  function populateKnownActions() {
    newKnownAction.innerHTML = '<option value="">— choose —</option>';
    const byCat = {};
    for (const [name, ref] of Object.entries(ACTION_REFERENCE)) {
      (byCat[ref.category] = byCat[ref.category] || []).push({ name, label: ref.label });
    }
    for (const cat of Object.keys(byCat).sort()) {
      const group = document.createElement('optgroup');
      group.label = cat;
      for (const { name, label } of byCat[cat].sort((a, b) => a.label.localeCompare(b.label))) {
        const opt = document.createElement('option');
        opt.value = name; opt.textContent = label;
        group.appendChild(opt);
      }
      newKnownAction.appendChild(group);
    }
  }
  populateKnownActions();

  function refreshAddBtnState() {
    const has = newKnownAction.value || newCustomName.value.trim();
    newBindBtn.disabled = !has || !state.cisNode;
  }
  newKnownAction.addEventListener('change', () => { if (newKnownAction.value) newCustomName.value = ''; refreshAddBtnState(); });
  newCustomName.addEventListener('input', () => { if (newCustomName.value.trim()) newKnownAction.value = ''; refreshAddBtnState(); });
  searchBox.addEventListener('input', renderSidebar);

  newBindBtn.addEventListener('click', () => {
    const name = newCustomName.value.trim() || newKnownAction.value;
    if (!name) return;
    const kind = newKind.value;
    if (state.items.some((it) => it.kind === kind && it.name === name)) {
      showBanner('error', `"${name}" already has a binding — remove it first or use Rebind on the existing entry.`);
      return;
    }
    startListening({ mode: 'new', kind, name });
  });

  // ---------- file loading ----------
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseConfig(reader.result, file.name);
    reader.onerror = () => showBanner('error', 'Could not read that file.');
    reader.readAsText(file);
  });

  // PUBG's real, populated binding data lives in a top-level `CustomInputSettins`
  // entry (PUBG itself misspells "Settings" — no "g") that sits alongside
  // TslPersistantData, not inside it. Each ActionKeyList/AxisKeyList item uses a
  // 3-slot `Keys=(slot0,slot1,slot2)` array: [0] primary keyboard/mouse,
  // [1] secondary keyboard/mouse, [2] gamepad. We only ever read/write slots 0-1.
  // A separate, apparently-unused `TslPersistantData.CustomInputSettings`
  // struct with the older single-Key wrapper shape also exists in every file
  // observed so far and was always empty — kept here only as a defensive
  // fallback in case some build/version relies on it instead.
  function collectItems(kind, listField, nameField) {
    const listNode = state.cisNode.fields[listField];
    if (!listNode || listNode.type !== 'array') return;
    for (const itemNode of listNode.items) {
      if (itemNode.type !== 'struct') continue;
      const nameNode = itemNode.fields[nameField];
      if (!nameNode) continue;
      const name = nameNode.type === 'string' ? nameNode.value : String(nameNode.value || '');
      const slots = ueini.getKeySlots(itemNode);
      if (slots) {
        for (const slotIndex of ueini.KB_SLOT_INDEXES) {
          const slotNode = slots.items[slotIndex];
          if (slotNode && slotNode.type === 'struct' && slotNode.fields.Key && slotNode.fields.Key.type === 'raw') {
            state.items.push({
              id: nextId++, kind, nameField, format: 'slots', slotsNode: slots, slotIndex,
              node: itemNode, name, ueKey: slotNode.fields.Key.value, holder: slotNode,
            });
          }
        }
      } else {
        const found = ueini.findKeyHolder(itemNode, kind === 'action' ? 'ActionKey' : 'AxisKey');
        if (found && found.holder.fields.Key && found.holder.fields.Key.type === 'raw') {
          state.items.push({
            id: nextId++, kind, nameField, format: 'legacy', wrapperField: found.wrapperFieldName,
            node: itemNode, name, ueKey: found.holder.fields.Key.value, holder: found.holder,
          });
        }
      }
    }
  }

  function parseConfig(text, filename) {
    let line = ueini.findLine(text, 'CustomInputSettins');
    let exportKey = 'CustomInputSettins';
    if (!line) { line = ueini.findLine(text, 'CustomInputSettings'); exportKey = 'CustomInputSettings'; }

    let rootNode, cisNode;
    if (line) {
      rootNode = ueini.parseUEValue(line.valueRaw);
      if (rootNode.type !== 'struct') {
        showBanner('error', `Found a top-level "${exportKey}" entry but it wasn't in the expected format — this may be from a different game version.`);
        return;
      }
      cisNode = rootNode;
    } else {
      // Fallback: legacy nested TslPersistantData.CustomInputSettings (seen empty on every real file so far).
      const tline = ueini.findLine(text, 'TslPersistantData');
      if (!tline) {
        showBanner('error', "Couldn't find PUBG's keybind data (looked for \"CustomInputSettins\" and \"TslPersistantData\") — is this PUBG's GameUserSettings.ini (usually under %LOCALAPPDATA%\\TslGame\\Saved\\Config\\WindowsNoEditor\\)?");
        return;
      }
      const tslNode = ueini.parseUEValue(tline.valueRaw);
      if (tslNode.type !== 'struct' || !tslNode.fields.CustomInputSettings || tslNode.fields.CustomInputSettings.type !== 'struct') {
        showBanner('error', 'Could not locate keybind data in this file.');
        return;
      }
      line = tline; exportKey = 'TslPersistantData';
      rootNode = tslNode; cisNode = tslNode.fields.CustomInputSettings;
    }

    state.rawText = text; state.filename = filename;
    state.lineStart = line.start; state.lineEnd = line.end;
    state.exportKey = exportKey; state.rootNode = rootNode; state.cisNode = cisNode;
    state.items = []; nextId = 1; state.dirty = false;
    if (state.listening) cancelListening();
    detailPanel.hidden = true;

    collectItems('action', 'ActionKeyList', 'ActionName');
    collectItems('axis', 'AxisKeyList', 'AxisName');

    if (state.items.length === 0) {
      showBanner('info', `Loaded "${exportKey}", but it had no populated keyboard/mouse bindings. Use "Add binding" below to create bindings from scratch.`);
    } else {
      showBanner('info', `Loaded ${state.items.length} keyboard/mouse binding(s) from ${filename} (field: ${exportKey}).`);
    }
    exportBtn.disabled = false;
    refreshAddBtnState();
    renderAll();
  }

  // ---------- export ----------
  exportBtn.addEventListener('click', () => {
    if (!state.rawText || !state.rootNode) return;
    const newValue = ueini.stringifyUEValue(state.rootNode);
    const newLine = state.exportKey + '=' + newValue;
    const newText = state.rawText.slice(0, state.lineStart) + newLine + state.rawText.slice(state.lineEnd);
    const blob = new Blob([newText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const base = (state.filename || 'GameUserSettings.ini').replace(/\.ini$/i, '');
    a.href = url; a.download = base + '.edited.ini';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
})();
