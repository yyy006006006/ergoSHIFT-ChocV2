# nekoko Choc V2版（ergoSHIFT Rev1ベース）

ergoSHIFT Rev1をベースに、Kailh Choc V1 / V2対応基板とChoc V2用ボタンキャップを追加した派生版です。
改変・頒布担当は **nekoko / [yyy006006006](https://github.com/yyy006006006)** です。
元作者による公式販売品や公認品を示すものではありません。

| 公開データ | 内容 |
| --- | --- |
| [基板のKiCadソース](./hardware-rev1/design_data/ergoSHIFT-rev1-ChocV1-V2-Standard-BSocket-kicad/) | Rev1ベースのChoc V1 / V2対応基板（標準右手レイアウト）。スイッチは表面、ホットスワップソケットは裏面に実装します。 |
| [基板製造用Gerber ZIP](./hardware-rev1/ergoSHIFT-rev1-ChocV1-V2-Standard-BSocket-gerber.zip) | 上記基板の製造用データです。元のRev1用Gerberとは別ファイルです。 |
| [Choc V2用ボタンキャップ](./3d-printed-buttoncaps/#choc-v2用ボタンキャップnekokoによる追加) | 小14個、大1個用。STL、編集用STEP、生成スクリプトを公開しています。 |

基板外形、キー中心位置、取付穴、MCU配線は元のRev1から維持しています。
本基板は裏面ソケット専用のため、スイッチの直付けや左右反転組み立てには対応していません。
Choc V1とV2ではキャップの取付部が異なるため、使用するスイッチに合わせてデータを選択してください。
Choc V2用キャップはCAD上で形状確認済みですが、実際の造形品における嵌合やケースとの干渉は未確認です。
基板の検査警告などの詳細は、[Rev1の注意事項](./hardware-rev1/#nekoko版choc-v1--v2対応基板)を参照してください。

**原設計とライセンス：** ergoSHIFT (c) by [mizma](https://github.com/mizma/ergoSHIFT)。
本リポジトリは[Darudado/ergoSHIFT_RGB](https://github.com/Darudado/ergoSHIFT_RGB)のコミット `8f152af28f62ab4e4357ed43b05d77b5a4bff9c2` を複製し、2026-10-18に上記データと説明を追加したものです。
元の設計、作者表示、ライセンス表示を保持した上で、本版の基板およびキャップの改変部分も[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.ja)で公開します。
ライセンス全文は[LICENSE](./LICENSE)を参照してください。ファームウェアや部品ライブラリは、それぞれの既存LICENSEと作者表示に従います。

以下は元リポジトリの説明です。Rev2、RGB版、左右反転組み立てなどの記述は元版の仕様であり、本改変基板には適用されません。

---

ergoSHIFT arcade controller
========================================================================

![logo](./images/ErgoSHIFT-logo-small.svg)

_**Low profile 11 button leverless arcade controller with Acrylic shell**_

This repository contains Acrylic cut design files, PCB design files and code needed to make
an arcade controller that look like this:

![image](./hardware-rev2/images/ergoSHIFT-rev2-bare01.jpg)
![image](./hardware-rev2/images/ergoSHIFT-rev2-bare03.jpg)

Also, you can create custom artwork using the stencil provided in each hardware revision folder.

![ergoSHIFT-rev1_with_artwork1](./images/ergoSHIFT_sample_with_artwork01.jpg)
![ergoSHIFT-rev1_with_artwork2](./images/ergoSHIFT_sample_with_artwork02.jpg)

(*) Above sample Artwork based on an In-Game Screenshot + Official Fan-kit (©Cygames & ARK SYSTEM WORKS)

This controller is designed with the following concept:

* Create a reasonably compact and thin leverless arcade controller
* Layout 11 main buttons + 4 directional buttons to work with the latest 
  Capcom Pro-Tour rule-set
* Shift the home position for the main button one column to the right to better utilize the 
  more dextrous thumb and index finger instead of the little finger.
* Add the three additionally allowed buttons
* Make the button size compatible with Snackbox MICRO from [Junkfood Arcades](https://junkfoodarcades.com/)
    * I could not find good Injection molded options other than this one.
* Make the design reversible for southpaw use.
    * To assemble for left hand use, implement all buttons on the other side.
    * Controller Circuit (Pro Micro or RP2040) must be implemented on the same side
    * to compensate for the Controller Cicuitry being implemented in reverse, Acrylic layers will need to be 
      stacked in a different order and thickness.  Refer to each revision README for details

Resulting button mappings will look like this:

![button-map](hardware-rev1/images/ergoSHIFT-stencil.png)
![button-map-reversed](hardware-rev1/images/ergoSHIFT-stencil-reverse.png)

There are currently two revisions of the ergoSHIFT.  It uses Kailh low profile (choc v1)
mechanical keyboard switches.  The table below lists their main features.
See the README for each version for details on how to make them.

version                                 | [rev1](./hardware-rev1/)            | [rev2](./hardware-rev2/)              | [rgb](./hardware-rgb/)                | 
--------------------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------- | 
Status                                  | Verified                            | Verified                              | Verified                              | 
case dimensions                         | 233.17x147.67x14.6mm (excl. feet)   | 233.17x147.67x14.6mm (excl. feet)     | 233.17x147.67x14.6mm (excl. feet)     | 
compatibility (using provided firmware) | PC, PS3, Xinput, Switch             | PC, PS3, PS4*, PS5*, Xinput, Switch   | PC, PS3, PS4*, PS5*, Xinput, Switch   | 
add-on board                            | Sparkfun Qwiic Pro Micro            | SSD1306, SH1106 or SH1107 128x64 oled | SSD1306, SH1106 or SH1107 128x64 oled | 
onboard chip                            | -                                   | RP2040                                | RP2040                                | 
port                                    | USB-C                               | USB-C                                 | USB-C                                 | 
SMT assembly required                   | no                                  | yes                                   | yes                                   | 
OLED Support                            | no                                  | yes                                   | yes                                   | 
RGB Support                             | no                                  | no                                    | yes                                   | 
South-paw support                       | yes                                 | yes                                   | no                                    | 
firmware                                | [ATmega32U4](firmwares_atmega32u4)  | [GP2040-CE](https://gp2040-ce.info/)**| [GP2040-CE](https://gp2040-ce.info/)**| 

*) for details, see the documentation in the [GP2040-CE Console Compatibility FAQ](https://gp2040-ce.info/faq/faq-console-compatibility/)

**) Firmware is available from the official [GP2040-CE Website](https://gp2040-ce.info/downloads)
See [GP2040 firmware page](./firmware_GP2040-CE/) for firmware with ergoSHIFT specific patches (i.e. OLED display layout patch)

LICENSE
------------------------------------------------------------------------

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>

ergoSHIFT (c) by mizma

ergoSHIFT is licensed under a
Creative Commons Attribution-ShareAlike 4.0 International License.

You should have received a copy of the license along with this
work. If not, see <https://creativecommons.org/licenses/by-sa/4.0/>.

Some portions of the work uses derivative works of other libraries and or implementations.
Firmware and hardware designs are separately licensed depending on the licensing terms of 
the works it uses.  Refer to the LICENSE files or README for the relevant terms for each
component.



