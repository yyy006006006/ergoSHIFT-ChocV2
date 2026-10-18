import { LABELS, BUTTONS, FIXED, CONTROLLER_TARGETS, defaults, validateMap, assign, encodeLayout, decodeLayout } from "./model.mjs";
import { HID_FILTER, readMapping, saveMapping } from "./usb.mjs";

const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const DRAFT_KEY = "nekoko.ergoshift.rev1.draft.v1";
let mapping = defaults(), selected = 0, device = null, savedMap = null, busy = false, hasDraft = false;
let storageAvailable = true;
let busyAction = "";
const groups = new Map();

function message(text, error = false) {
  const target = device?.opened ? $("message") : $("connection-message");
  for (const node of [$("message"), $("connection-message")]) { node.hidden = true; node.textContent = ""; }
  target.textContent = text;
  target.className = `message${error ? " error" : ""}`;
  target.hidden = !text;
}

// 下書きはこのブラウザー内だけに保存する。本体への保存とは区別して表示する。
try {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) { mapping = decodeLayout(JSON.parse(draft)); hasDraft = true; }
} catch (error) {
  storageAvailable = false;
  message("下書きを読み込めませんでした。", true);
}

function rememberDraft() {
  if (!storageAvailable) return;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(encodeLayout(mapping))); }
  catch (error) {
    storageAvailable = false;
    message("下書きを保持できません。必要ならファイルに保存してください。", true);
  }
}

function element(tag, attributes, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildBoard() {
  for (const [index, button] of BUTTONS.entries()) {
    const r = button.r ?? 10.75;
    const group = element("g", { class:"key editable", transform:`translate(${button.x},${button.y})`, role:"button", tabindex:"0", "data-switch":button.id });
    group.append(element("circle", { r }), element("text", { y:"0.5", class:"key-name" }), element("text", { y:"5.1", class:"key-ref" }, button.id));
    group.append(element("circle", { r:r + 2.5, class:"selection-ring" }));
    const select = () => { selected = index; render(); };
    group.addEventListener("click", select);
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
    });
    $("editable-buttons").append(group);
    groups.set(button.id, group);
  }
  for (const button of FIXED) {
    const small = (button.r ?? 10.75) < 5;
    const group = element("g", { class:`key fixed${small ? " utility" : ""}${button.id === "SW2" ? " config" : ""}`, transform:`translate(${button.x},${button.y})` });
    group.append(element("circle", { r:button.r ?? 10.75 }), element("text", { y:small ? "-6.2" : "1.2" }, button.label));
    const title = element("title", {}, `${button.id} ${button.label}：固定`);
    group.append(title);
    $("fixed-buttons").append(group);
    groups.set(button.id, group);
  }
}

function chooseAction(action) {
  if (busy) return;
  mapping = assign(mapping, selected, action, $("swap").checked);
  hasDraft = true; $("preset").value = ""; rememberDraft(); render();
  message("");
}

function buildController() {
  // 下段のコントローラー上に、実際の位置に対応したクリック領域を作る。
  for (const target of CONTROLLER_TARGETS) {
    const { action, x, y, shape } = target;
    const group = element("g", { class:`controller-action face-${action}`, transform:`translate(${x},${y})`,
      role:"button", tabindex:"0", "data-action":action, "aria-label":`${action} を割り当てる`, "aria-pressed":"false" });
    if (shape === "face" || shape === "stick") {
      group.append(element("circle", { r:shape === "stick" ? 31 : 17, class:"target-shape" }));
      if (shape === "stick") group.append(element("circle", { r:23, class:"stick-inner" }));
      group.append(element("text", { y:0 }, action));
      if (target.caption) group.append(element("text", { y:43, class:"target-caption" }, target.caption));
    } else if (shape === "menu") {
      group.append(element("rect", { x:-14.5, y:-9.5, width:29, height:19, rx:7, class:"target-shape" }));
      group.append(element("path", { d:"M-5 -4 H2 V2 H-5Z M-1 -1 H6 V5 H-1", class:"menu-icon" }));
      group.append(element("text", { y:22, class:"target-caption" }, action));
    } else {
      const trigger = shape === "trigger", width = trigger ? 84 : 72, height = trigger ? 28 : 22;
      group.append(element("rect", { x:-width / 2, y:-height / 2, width, height, rx:trigger ? 8 : 5, class:"target-shape" }));
      group.append(element("text", { y:0 }, action));
    }
    group.append(element("title", {}, target.caption ? `${action}：${target.caption}` : action));
    group.addEventListener("click", () => chooseAction(action));
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseAction(action); }
    });
    $("action-grid").append(group);
  }
  $("disable").addEventListener("click", () => chooseAction("NONE"));
}

function isDirty() { return savedMap === null || mapping.some((action, i) => action !== savedMap[i]); }

function render() {
  for (const [index, button] of BUTTONS.entries()) {
    const group = groups.get(button.id), active = index === selected;
    group.classList.toggle("selected", active);
    group.setAttribute("aria-pressed", String(active));
    group.setAttribute("aria-label", `${button.name} ${button.id}、割り当て ${LABELS[mapping[index]]}`);
    group.querySelector(".key-name").textContent = LABELS[mapping[index]];
    group.querySelector(".selection-ring").style.display = active ? "" : "none";
  }
  for (const button of document.querySelectorAll("[data-action]")) {
    const action = button.dataset.action;
    button.setAttribute("aria-pressed", String(mapping[selected] === action));
    button.setAttribute("aria-disabled", String(busy));
    if (button instanceof HTMLButtonElement) button.disabled = busy;
    else button.setAttribute("tabindex", busy ? "-1" : "0");
  }
  // 読み取りまで成功した機器だけを接続済みとし、画面を切り替える。
  const connected = Boolean(device?.opened);
  $("connection-screen").hidden = connected;
  $("keymap-screen").hidden = !connected;
  $("editor-connection").hidden = !connected;
  $("connect").disabled = busy;
  $("connect-start").disabled = busy;
  $("connect-start").textContent = busyAction === "connect" ? "接続中…" : "接続";
  $("read").disabled = !connected || busy;
  $("save").disabled = !connected || busy || !isDirty();
  $("reset").disabled = busy; $("preset").disabled = busy; $("import").disabled = busy;
  $("save").textContent = busyAction === "save" ? "保存中…" : connected && !isDirty() ? "保存済み" : "保存";
  $("save-help").textContent = connected && isDirty() ? "未保存" : "";
}

function markPhysical(mask) {
  BUTTONS.forEach((button, i) => groups.get(button.id).classList.toggle("pressed", Boolean(mask & (1 << i))));
  FIXED.forEach(button => groups.get(button.id).classList.toggle("pressed", button.bit !== undefined && Boolean(mask & (1 << button.bit))));
}

function inputReport(event) {
  if (event.device !== device || event.reportId !== 0 || event.data.byteLength !== 4) return;
  markPhysical(event.data.getUint32(0, true));
}

async function detach() {
  const previous = device;
  device = null; savedMap = null;
  if (previous) { previous.removeEventListener("inputreport", inputReport); if (previous.opened) await previous.close(); }
  markPhysical(0);
}

// 接続操作はブラウザーの機器選択を開くクリックから開始する。
$("connect").addEventListener("click", connectDevice);
$("connect-start").addEventListener("click", connectDevice);

async function connectDevice() {
  if (busy) return;
  if (device) {
    try { await detach(); message(""); }
    catch (error) { message(`接続解除を確認できませんでした：${error.message}`, true); }
    render(); $("connection-title").focus(); return;
  }
  if (!window.isSecureContext || !("hid" in navigator)) {
    message("PCのChrome / EdgeでHTTPSのページを開いてください。", true); return;
  }
  busy = true; busyAction = "connect"; render();
  message("接続一覧で「ergoSHIFT Configuration」を選び、「接続」を押してください。");
  let candidate;
  try {
    // 選択はユーザーのクリックからだけ開始し、対象のベンダーHIDに限定する。
    [candidate] = await navigator.hid.requestDevice({ filters:[HID_FILTER] });
    if (!candidate) { message(""); return; }
    if (!candidate.opened) await candidate.open();
    const actual = await readMapping(candidate);
    device = candidate; savedMap = actual;
    if (!hasDraft) mapping = [...actual];
    device.addEventListener("inputreport", inputReport);
    render();
    $("layout-title").focus();
    message(hasDraft ? "未保存の編集を復元しました。" : "");
  } catch (error) {
    if (candidate?.opened && candidate !== device) {
      try { await candidate.close(); } catch (closeError) { console.warn("接続失敗後のUSBクローズ失敗", closeError); }
    }
    message(`接続できませんでした：${error.message} 中央の小ボタンを押しながらUSBを挿し直してください。`, true);
  } finally { busy = false; busyAction = ""; render(); }
}

$("save").addEventListener("click", async () => {
  if (!device?.opened || busy) return;
  const target = device, requested = validateMap(mapping);
  busy = true; busyAction = "save"; render(); message("");
  try {
    const actual = await saveMapping(target, requested);
    if (device !== target || !target.opened) throw new Error("保存確認中に接続が切れました。");
    savedMap = actual; hasDraft = false;
    if (storageAvailable) {
      try { localStorage.removeItem(DRAFT_KEY); } catch (error) { storageAvailable = false; }
    }
    message("保存しました。USBを抜き、何も押さずに挿し直してください。");
  } catch (error) {
    // 送信後の切断では保存されている可能性もあるため、成功・未保存を断定しない。
    savedMap = null;
    message(`保存完了を確認できませんでした：${error.message} 再接続して本体の配置を読み直してください。`, true);
  } finally { busy = false; busyAction = ""; render(); }
});

$("read").addEventListener("click", async () => {
  if (!device?.opened || busy) return;
  if (isDirty() && !window.confirm("未保存の編集を破棄して読み直しますか？")) return;
  const target = device;
  busy = true; render();
  try {
    const actual = await readMapping(target);
    if (device !== target || !target.opened) throw new Error("読込み中に接続が切れました。");
    mapping = [...actual]; savedMap = actual; hasDraft = false;
    if (storageAvailable) {
      try { localStorage.removeItem(DRAFT_KEY); } catch (error) { storageAvailable = false; }
    }
    message("");
  } catch (error) { message(`読み込めませんでした：${error.message}`, true); }
  finally { busy = false; render(); }
});

if ("hid" in navigator) navigator.hid.addEventListener("disconnect", event => {
  if (event.device !== device) return;
  device.removeEventListener("inputreport", inputReport);
  device = null; savedMap = null; markPhysical(0); render();
  $("connection-title").focus();
  message("接続が切れました。");
});

function preset(name) {
  mapping = defaults();
  if (name === "top-r3") mapping = assign(mapping, 0, "R3", true);
  selected = 0; hasDraft = true; rememberDraft(); render();
  message("");
}
$("preset").addEventListener("change", event => { if (event.target.value) preset(event.target.value); });
$("reset").addEventListener("click", () => { $("preset").value = "default"; preset("default"); });

$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(encodeLayout(mapping), null, 2) + "\n"], { type:"application/json" });
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = "ergoSHIFT-button-layout.json";
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message("ファイルに保存しました。");
});
$("import").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", async event => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    if (file.size > 16384) throw new Error("ファイルが大きすぎます。設定JSONを選んでください。");
    const imported = decodeLayout(JSON.parse(await file.text()));
    if (busy) throw new Error("本体との通信が終わってから読み込んでください。");
    mapping = imported; hasDraft = true; $("preset").value = ""; rememberDraft(); render();
    message("ファイルを読み込みました。本体への反映は「保存」。");
  } catch (error) { message(`読み込めませんでした：${error.message}`, true); }
  finally { event.target.value = ""; }
});

buildBoard(); buildController(); render();
