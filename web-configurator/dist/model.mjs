export const BOARD = "ergoSHIFT-Rev1-Standard-BSocket";
export const ACTIONS = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "L3", "R3", "BACK", "NONE"];
export const LABELS = { A:"A", B:"B", X:"X", Y:"Y", LB:"LB", RB:"RB", LT:"LT", RT:"RT", L3:"L3", R3:"R3", BACK:"BACK", NONE:"無効" };
// 下段はXbox系の配置。L3/R3はスティック押込み、LT/RTは左右のトリガー。
export const CONTROLLER_TARGETS = [
  { action:"LT", x:145, y:24, shape:"trigger" },
  { action:"RT", x:475, y:24, shape:"trigger" },
  { action:"LB", x:145, y:61, shape:"shoulder" },
  { action:"RB", x:475, y:61, shape:"shoulder" },
  { action:"L3", x:157, y:130, shape:"stick", caption:"左スティック押込み" },
  { action:"R3", x:397, y:190, shape:"stick", caption:"右スティック押込み" },
  { action:"BACK", x:279, y:114, shape:"menu" },
  { action:"Y", x:476, y:93, shape:"face" },
  { action:"X", x:442, y:127, shape:"face" },
  { action:"B", x:510, y:127, shape:"face" },
  { action:"A", x:476, y:161, shape:"face" },
];
// 実際のStandard-BSocket基板から読み取った中心座標。USB側を上に表示する。
export const BUTTONS = [
  { id:"SW14", x:182.54, y:71.75, r:13, name:"上側の大ボタン", initial:"BACK" },
  { id:"SW9", x:153.05, y:113.7, name:"右手・左端", initial:"R3" },
  { id:"SW10", x:179.4, y:102.29, name:"右手・上段左", initial:"X" },
  { id:"SW11", x:205.75, y:90.88, name:"右手・上段中央", initial:"Y" },
  { id:"SW12", x:234.85, y:86.94, name:"右手・上段右", initial:"RB" },
  { id:"SW13", x:262.42, y:101.11, name:"右手・右端", initial:"LB" },
  { id:"SW15", x:150.89, y:143.81, name:"右手・下段左", initial:"LT" },
  { id:"SW16", x:177.87, y:132.37, name:"右手・下段中央左", initial:"A" },
  { id:"SW17", x:204.85, y:120.93, name:"右手・下段中央右", initial:"B" },
  { id:"SW18", x:236.22, y:116.39, name:"右手・下段右", initial:"RT" },
  { id:"SW7", x:107.22, y:170.47, name:"左手の親指ボタン", initial:"L3" },
];
export const FIXED = [
  { id:"SW8", x:138.79, y:178.67, r:13, label:"↑", bit:11 },
  { id:"SW5", x:100.37, y:112.75, label:"↓", bit:12 },
  { id:"SW4", x:71.75, y:112.75, label:"←", bit:13 },
  { id:"SW6", x:125.82, y:126.26, label:"→", bit:14 },
  { id:"SW3", x:90, y:63, r:3, label:"START", bit:15 },
  { id:"SW1", x:70, y:63, r:3, label:"HOME", bit:16 },
  { id:"SW2", x:80, y:63, r:3, label:"設定" },
];
export const defaults = () => BUTTONS.map(b => b.initial);

export function validateMap(map) {
  if (!Array.isArray(map) || map.length !== BUTTONS.length || map.some(v => !ACTIONS.includes(v)))
    throw new Error("この機種のボタン設定として読み込めません。");
  return [...map];
}

export function assign(map, index, action, swap = true) {
  const result = validateMap(map);
  if (!Number.isInteger(index) || !BUTTONS[index] || !ACTIONS.includes(action)) throw new Error("割り当てが不正です。");
  const other = result.indexOf(action);
  if (swap && action !== "NONE" && other >= 0 && other !== index) result[other] = result[index];
  result[index] = action;
  return result;
}

export function encodeLayout(map) {
  validateMap(map);
  return { format:"nekoko-ergoshift-layout", version:1, board:BOARD,
    mapping:Object.fromEntries(BUTTONS.map((b, i) => [b.id, map[i]])) };
}

export function decodeLayout(value) {
  if (!value || value.format !== "nekoko-ergoshift-layout" || value.version !== 1 || value.board !== BOARD ||
      !value.mapping || typeof value.mapping !== "object" || Array.isArray(value.mapping) ||
      Object.keys(value.mapping).length !== BUTTONS.length || Object.keys(value.mapping).some(k => !BUTTONS.some(b => b.id === k)))
    throw new Error("ergoSHIFT Rev1用の設定JSONを選んでください。");
  return validateMap(BUTTONS.map(b => value.mapping[b.id]));
}

export function crc16(bytes) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc;
}

export function encodePacket(map) {
  const packet = new Uint8Array(32);
  packet.set([69,83,67,70,1,1,0,11]);
  packet.set(validateMap(map).map(v => ACTIONS.indexOf(v)), 8);
  const crc = crc16(packet.subarray(0, 30));
  packet[30] = crc & 255; packet[31] = crc >> 8;
  return packet;
}

export function decodePacket(data) {
  let packet = data instanceof DataView ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
  // Windows等のHID APIが付けるReport ID 0は、32バイトの本体データと区別して除く。
  if (packet.length === 33 && packet[0] === 0) packet = packet.subarray(1);
  if (packet.length !== 32 || ![69,83,67,70,1,1].every((v,i) => packet[i] === v) || packet[7] !== 11 ||
      crc16(packet.subarray(0,30)) !== (packet[30] | packet[31] << 8) || packet.slice(19,30).some(v => v !== 0))
    throw new Error("対応する本体から正しい設定を受信できませんでした。");
  if (packet[6] === 1) throw new Error("本体が設定データを拒否しました。保存は完了していません。");
  if (packet[6] === 2) throw new Error("本体の保存内容を照合できませんでした。接続し直して読み直してください。");
  if (packet[6] !== 0) throw new Error("本体がエラーを返しました。");
  return validateMap([...packet.slice(8,19)].map(v => ACTIONS[v]));
}
