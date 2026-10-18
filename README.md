# nekoko Choc V2 Edition (based on ergoSHIFT Rev1)

This derivative of ergoSHIFT Rev1 adds a PCB designed for Kailh Choc V1 / V2 switches and Choc V2 button caps.
Modified and distributed by **nekoko / [yyy006006006](https://github.com/yyy006006006)**.
This does not imply an official product or endorsement by the original author.

| Files | Description |
| --- | --- |
| [KiCad PCB source](./hardware-rev1/design_data/ergoSHIFT-rev1-ChocV1-V2-Standard-BSocket-kicad/) | Rev1-based Choc V1 / V2 PCB with the standard right-handed layout. Mount switches on the front and hot-swap sockets on the back. |
| [PCB manufacturing Gerber ZIP](./hardware-rev1/ergoSHIFT-rev1-ChocV1-V2-Standard-BSocket-gerber.zip) | Manufacturing files for this modified PCB, separate from the original Rev1 Gerbers. |
| [Choc V2 button caps](./3d-printed-buttoncaps/#choc-v2-button-caps-added-by-nekoko) | Use 14 small caps and 1 large cap. STL files, editable STEP files, and the generation script are provided. |
| [Web button configurator](https://yyy006006006.github.io/ergoSHIFT-ChocV2/) | Visual USB remapping for 11 large buttons. Requires the [nekoko configuration firmware](./firmwares_atmega32u4/LUFA/#nekoko-web-configuration-firmware-experimental) on an ATmega32U4 controller. [Web source](./web-configurator/); firmware and web app: GPL v3. |

The original Rev1 board outline, key centers, mounting holes, and MCU connections are unchanged.
This PCB is for back-mounted sockets only; direct switch soldering and reversed/left-handed assembly are not supported.
Choc V1 and V2 use different cap mounts, so choose cap files that match your switches.
The Choc V2 caps have been checked in CAD; physical printed fit and case clearance have not been tested.
See the [Rev1 notes](./hardware-rev1/#nekoko-edition-choc-v1--v2-pcb) for remaining PCB validation findings.

**Original design and license:** ergoSHIFT (c) by [mizma](https://github.com/mizma/ergoSHIFT).
This repository copies [Darudado/ergoSHIFT_RGB](https://github.com/Darudado/ergoSHIFT_RGB) at commit `8f152af28f62ab4e4357ed43b05d77b5a4bff9c2`, with the files and documentation above added on 2026-10-18.
The original designs, attribution, and license notices are retained. The PCB and cap modifications are also released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
See [LICENSE](./LICENSE) for the full terms. Firmware and component libraries retain their respective licenses and attribution notices.

The original repository documentation follows. Its Rev2, RGB, and reversed-assembly descriptions apply to the upstream versions, not this modified PCB.

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



