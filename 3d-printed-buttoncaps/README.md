## Choc V2 button caps (added by nekoko)

The original cap outline and 5 mm height are unchanged; the two-prong underside has been replaced with a mount for Choc V2 cross stems.
Use 14 small caps and 1 large cap. The original Choc V1 files are unchanged.

| Size | Print files | Editable files |
| --- | --- | --- |
| Small, 21.5 mm outer diameter | [STL](./ergoSHIFT-ButtonCap-ChocV2-MX.stl) | [STEP](./design_data/ergoSHIFT-ButtonCap-ChocV2-MX.step) |
| Large, 26 mm outer diameter | [STL](./ergoSHIFT-ButtonCapBig-ChocV2-MX.stl) | [STEP](./design_data/ergoSHIFT-ButtonCapBig-ChocV2-MX.step) |

The nominal cross-shaped hole is 4.10 mm long, 1.40 mm wide, and 3.30 mm deep, based on the [Kailh CPG135301D03 drawing](https://www.kailhswitch.com/Content/upload/pdf/202015927/PG135301D03.pdf).
The unchanged outer geometry, STEP re-import, and watertight STL meshes have been checked in CAD. Physical printed fit, retention, durability, and case clearance have not been tested. Test one small cap before printing a full set.
`ChocV2-MX` identifies these cross-stem files; it does not imply compatibility with every MX-style switch.

The [generation script](./design_data/make_choc_v2_caps.py) reads the original FreeCAD files and exports STEP and STL files. It requires CadQuery and trimesh.
[Saved geometry checks](./ChocV2-validation/geometry-check.json) are also available.

Original design: ergoSHIFT (c) by [mizma](https://github.com/mizma/ergoSHIFT).
Cap mount modified by nekoko / [yyy006006006](https://github.com/yyy006006006); prepared for publication on 2026-10-18.
These modified files are also released under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The original Choc V1 cap documentation follows. The original Full Set STL does not contain Choc V2 caps.

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