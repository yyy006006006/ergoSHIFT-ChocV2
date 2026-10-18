import assert from "node:assert/strict";
import { ACTIONS, BUTTONS, CONTROLLER_TARGETS, defaults, assign, encodeLayout, decodeLayout, encodePacket, decodePacket, crc16 } from "../dist/model.mjs";
import { readMapping, saveMapping } from "../dist/usb.mjs";

const initial = defaults();
assert.equal(BUTTONS.length, 11);
assert.equal(new Set(BUTTONS.map(b => b.id)).size, 11);
// 一般的なゲームパッド上で、利用可能な出力を漏れなく一度ずつ選べる。
assert.deepEqual(CONTROLLER_TARGETS.map(b => b.action).sort(), ACTIONS.filter(a => a !== "NONE").sort());
assert(CONTROLLER_TARGETS.find(b => b.action === "L3").x < CONTROLLER_TARGETS.find(b => b.action === "R3").x);
assert(CONTROLLER_TARGETS.find(b => b.action === "Y").y < CONTROLLER_TARGETS.find(b => b.action === "A").y);
assert(CONTROLLER_TARGETS.find(b => b.action === "LT").y < CONTROLLER_TARGETS.find(b => b.action === "LB").y);
assert.equal(crc16(new TextEncoder().encode("123456789")), 0x29b1);
const swapped = assign(initial, 0, "R3");
assert.equal(swapped[0], "R3"); assert.equal(swapped[1], "BACK");
assert.deepEqual(initial, defaults());
assert.deepEqual(decodeLayout(encodeLayout(swapped)), swapped);
assert.equal(assign(initial, 0, "R3", false)[1], "R3");
assert.equal(assign(initial, 0, "NONE")[0], "NONE");
assert.throws(() => assign(initial, 99, "A"));
assert.throws(() => assign(initial, 0, "PUNCH"));
assert.throws(() => decodeLayout({ ...encodeLayout(initial), board:"Corne" }));
assert.throws(() => decodeLayout({ ...encodeLayout(initial), mapping:{ SW14:"A" } }));
const broken = encodeLayout(initial); broken.mapping.SW14 = "<script>";
assert.throws(() => decodeLayout(broken));
assert.deepEqual(decodePacket(encodePacket(swapped)), swapped);
const prefixed = new Uint8Array(33); prefixed.set(encodePacket(swapped), 1);
assert.deepEqual(decodePacket(new DataView(prefixed.buffer)), swapped);
const corrupt = encodePacket(initial); corrupt[8] ^= 1;
assert.throws(() => decodePacket(corrupt));
const wrongHardware = encodePacket(initial); wrongHardware[5] = 2;
assert.throws(() => decodePacket(wrongHardware));
assert.throws(() => decodePacket(new Uint8Array(31)));
// USBが成功しても照合が不一致なら、保存済みとは扱わない。
const mock = { report:encodePacket(initial), async receiveFeatureReport(id) { assert.equal(id, 0); return new DataView(this.report.buffer); },
  async sendFeatureReport(id, packet) { assert.equal(id, 0); this.report = packet; } };
assert.deepEqual(await readMapping(mock), initial);
assert.deepEqual(await saveMapping(mock, swapped), swapped);
mock.sendFeatureReport = async () => {};
await assert.rejects(() => saveMapping(mock, initial), /一致しません/);
mock.receiveFeatureReport = async () => { throw new Error("USB disconnected"); };
await assert.rejects(() => readMapping(mock), /disconnected/);
console.log("web tests passed: layout, swaps, imports, CRC, HID framing, device readback and disconnect failures");
