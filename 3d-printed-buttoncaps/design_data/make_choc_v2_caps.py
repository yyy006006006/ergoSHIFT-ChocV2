"""元のFreeCAD形状から裏側ステムのみ変更し、Choc V2用STEP/STLを別名で作る。

要cadquery、trimesh。元FCStd/STLは読取専用。
PG135301D03公式図面の十字4.00±0.05 / 1.30±0.03 mmを基準とし、
片側0.05 mmの公称隙間を設ける。印刷収縮による嵌合は試作で確認する。
"""
from pathlib import Path
import hashlib
import json
import tempfile
import xml.etree.ElementTree as ET
import zipfile

import cadquery as cq
import trimesh
from OCP.Bnd import Bnd_Box
from OCP.BRepBndLib import BRepBndLib

HERE = Path(__file__).resolve().parent
CAPS = HERE.parent
CHECKS = CAPS / 'ChocV2-validation'
CROSS_LENGTH = 4.10
CROSS_WIDTH = 1.40
SLEEVE_DIAMETER = 5.30
CAVITY_DEPTH = 3.30
LEAD_IN = 0.15


def box(x, y, z, bottom):
    return cq.Workplane('XY').box(x, y, z, centered=(True, True, False)).translate((0, 0, bottom)).val()


def cross(length, width, height, bottom):
    return box(length, width, height, bottom).fuse(box(width, length, height, bottom)).clean()


def bounds(shape):
    # STL出力後の三角形近似の余裕値を含めず、BREPの厳密な外接寸法を測る。
    b = Bnd_Box()
    BRepBndLib.AddOptimal_s(shape.wrapped, b, False, False)
    return list(b.Get())


def read_body(path):
    # 保存済みBREPを直接再利用し、外面を寸法から作り直さない。
    with zipfile.ZipFile(path) as archive:
        xml = ET.fromstring(archive.read('Document.xml'))
        body = xml.find("ObjectData/Object[@name='Body']/Properties/Property[@name='Shape']/Part")
        assert body is not None
        with tempfile.TemporaryDirectory() as temporary:
            brep = Path(temporary) / 'body.brep'
            brep.write_bytes(archive.read(body.attrib['file']))
            return cq.Shape.importBrep(str(brep))


def make_cap(name):
    original_path = HERE / f'{name}.FCStd'
    original = read_body(original_path)
    before_hash = hashlib.sha256(original_path.read_bytes()).hexdigest()
    # 既存二本脚と中央の補強リブだけを、内側底面の高さ1 mmで除く。
    stem_removal = box(9.2, 3.2, 4.2, 1.0)
    shell = original.cut(stem_removal).clean()
    sleeve = cq.Workplane('XY').circle(SLEEVE_DIAMETER / 2).extrude(4.0).translate((0, 0, 1.0)).val()
    cap = shell.fuse(sleeve).clean()
    cap = cap.cut(cross(CROSS_LENGTH, CROSS_WIDTH, CAVITY_DEPTH + 0.1, 5.0 - CAVITY_DEPTH)).clean()
    # 開口の面取りは挿入の補助。底面を貫通させず、元の全高5 mmを保つ。
    for length, width in [(CROSS_LENGTH, CROSS_WIDTH), (CROSS_WIDTH, CROSS_LENGTH)]:
        chamfer_tool = (cq.Workplane('XY').workplane(offset=5.0 - LEAD_IN)
                        .rect(length, width).workplane(offset=LEAD_IN)
                        .rect(length + 2 * LEAD_IN, width + 2 * LEAD_IN).loft().val())
        cap = cap.cut(chamfer_tool).clean()
    assert cap.isValid() and len(cap.Solids()) == 1

    # 変更領域外の体積差ゼロを、外径・全高の比較と併せて確認する。
    allowed = box(9.2, 5.3, 4.1, 1.0)
    removed = original.cut(cap)
    added = cap.cut(original)
    outside_change = removed.cut(allowed).Volume() + added.cut(allowed).Volume()
    assert outside_change < 1e-7
    assert max(abs(a - b) for a, b in zip(bounds(original), bounds(cap))) < 1e-6
    # 公式最大寸法の十字が公称CAD穴に干渉しないことを確認する。
    male_gauge = cross(4.05, 1.33, 3.1, 1.9)
    interference = cap.intersect(male_gauge).Volume()
    assert interference < 1e-7

    step = HERE / f'{name}-ChocV2-MX.step'
    stl = CAPS / f'{name}-ChocV2-MX.stl'
    cq.exporters.export(cap, str(step))
    cq.exporters.export(cap, str(stl), tolerance=0.005, angularTolerance=0.05)
    # 出力を再読込し、単一の閉じたソリッドであることを確かめる。
    reread = cq.importers.importStep(str(step)).val()
    mesh = trimesh.load_mesh(stl)
    assert reread.isValid() and len(reread.Solids()) == 1
    assert mesh.is_watertight and mesh.is_winding_consistent and len(mesh.split()) == 1
    assert abs(reread.Volume() - cap.Volume()) < 1e-6
    assert max(abs(a - b) for a, b in zip(bounds(original), bounds(reread))) < 1e-6
    assert max(abs(a - b) for a, b in zip(bounds(original), mesh.bounds.flatten())) < 1e-5
    assert hashlib.sha256(original_path.read_bytes()).hexdigest() == before_hash
    return {'name': name, 'source_fcstd_sha256': before_hash, 'original_bounds_mm': bounds(original),
            'new_bounds_mm': bounds(cap), 'original_volume_mm3': original.Volume(),
            'new_volume_mm3': cap.Volume(), 'outside_stem_region_change_mm3': outside_change,
            'maximum_official_cross_gauge_interference_mm3': interference,
            'step_valid': True, 'stl_watertight': mesh.is_watertight,
            'stl_components': len(mesh.split()), 'stl_faces': len(mesh.faces),
            'stl_bounds_mm': mesh.bounds.tolist(),
            'stl_sha256': hashlib.sha256(stl.read_bytes()).hexdigest(),
            'step_sha256': hashlib.sha256(step.read_bytes()).hexdigest()}


if __name__ == '__main__':
    CHECKS.mkdir(exist_ok=True)
    report = {'dimensions_mm': {'cross_length': CROSS_LENGTH, 'cross_width': CROSS_WIDTH,
              'sleeve_diameter': SLEEVE_DIAMETER, 'cavity_depth': CAVITY_DEPTH, 'lead_in': LEAD_IN},
              'source': 'https://www.kailhswitch.com/Content/upload/pdf/202015927/PG135301D03.pdf',
              'source_drawing': 'CPG135301D03, 2019-10-25, A0 (temporary drawing), page 1',
              'physical_print_fit_tested': False,
              'caps': [make_cap(name) for name in ['ergoSHIFT-ButtonCap', 'ergoSHIFT-ButtonCapBig']]}
    (CHECKS / 'geometry-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)
