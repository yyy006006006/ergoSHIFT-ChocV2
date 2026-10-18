## Choc V2用ボタンキャップ（nekokoによる追加）

元のキャップ外形と高さ5 mmを維持し、裏側の二本脚をChoc V2の十字ステム用取付部に変更しました。
小14個、大1個を使用します。元のChoc V1用データは変更していません。

| サイズ | 印刷用 | 編集用 |
| --- | --- | --- |
| 小・外径21.5 mm | [STL](./ergoSHIFT-ButtonCap-ChocV2-MX.stl) | [STEP](./design_data/ergoSHIFT-ButtonCap-ChocV2-MX.step) |
| 大・外径26 mm | [STL](./ergoSHIFT-ButtonCapBig-ChocV2-MX.stl) | [STEP](./design_data/ergoSHIFT-ButtonCapBig-ChocV2-MX.step) |

十字穴の公称寸法は長さ4.10 mm、幅1.40 mm、深さ3.30 mmで、[Kailh CPG135301D03の図面](https://www.kailhswitch.com/Content/upload/pdf/202015927/PG135301D03.pdf)を基準にしています。
CAD上での外形維持、STEPの再読み込み、STLの閉じた形状は確認していますが、造形品の嵌合、保持力、耐久性、ケースとの干渉は未確認です。まずは小キャップ1個で適合を確認してください。
なお、`ChocV2-MX`は十字ステム用データの識別名であり、すべてのMX互換スイッチとの適合を示すものではありません。

[生成スクリプト](./design_data/make_choc_v2_caps.py)は元のFreeCADデータを読み込み、STEPとSTLを出力します。動作にはCadQueryとtrimeshが必要です。
[保存済み形状検査結果](./ChocV2-validation/geometry-check.json)も参照できます。

原設計：ergoSHIFT (c) by [mizma](https://github.com/mizma/ergoSHIFT)。
取付部の改変：nekoko / [yyy006006006](https://github.com/yyy006006006)、2026-10-18公開用整理。
この改変データも[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)で公開します。

以下は元のChoc V1用キャップの説明です。元のFull Set STLにはChoc V2用キャップは含まれません。

---

3D Printed Button Cap data
========================================================================

This directory hosts the 3D printable STL files and their original
design data for the ergoSHIFT compatible button caps.

You may use the [Full Set](./ergoSHIFT-FullSetButtonCaps.stl) to order
a full set of key-caps from third parties with SLS or MJF print capabilities,
or you may use other printing solutions using the individual stl files.

You will need 14 of the [small caps](./ergoSHIFT-ButtonCap.stl) and one
[big cap](./ergoSHIFT-ButtonCapBig.stl) for an ergoSHIFT build.

The button caps printed using PA12W MJF print looks something like this on
the ergoSHIFT rev1.

![printedCaps](./ergoSHIFT_PA12W_Sample01.jpg)
![printedCaps](./ergoSHIFT_PA12W_Sample02.jpg)