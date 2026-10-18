import { decodePacket, encodePacket, validateMap } from "./model.mjs";

export const HID_FILTER = { vendorId:0x0f0d, productId:0x0092, usagePage:0xff60, usage:0x61 };

export async function readMapping(device) {
  return decodePacket(await device.receiveFeatureReport(0));
}

export async function saveMapping(device, map) {
  validateMap(map);
  await device.sendFeatureReport(0, encodePacket(map));
  const actual = await readMapping(device);
  // 送信成功だけを保存完了とせず、本体が返す配置との完全一致を確認する。
  if (actual.some((value, i) => value !== map[i])) throw new Error("本体から読み直した配置が一致しません。接続し直して確認してください。");
  return actual;
}
