#include "NekokoMapping.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

static uint8_t storage[1024];
static int write_limit = -1, writes;
uint8_t nekoko_nv_read(uint16_t address) { assert(address < 1024); return storage[address]; }
void nekoko_nv_write(uint16_t address, uint8_t value) {
    assert(address >= 32 && address < 88);
    if (write_limit < 0 || writes < write_limit) storage[address] = value;
    ++writes;
}
static void reseal(uint8_t* p) {
    uint16_t crc = nekoko_crc16(p, 30);
    p[30] = crc & 255; p[31] = crc >> 8;
}
int main(void) {
    uint8_t packet[32], result[32], state[22], old_storage[1024];
    assert(nekoko_crc16((const uint8_t*)"123456789", 9) == 0x29b1);
    memset(storage, 0xff, sizeof(storage));
    memset(storage, 0x5a, 10);
    nekoko_mapping_load();
    assert(memcmp(nekoko_mapping, nekoko_default_map, 11) == 0);
    // 初期配置は、全ボタンの単独押下と同時押しで既存動作と一致する。
    for (int i = 0; i < 22; ++i) {
        memset(state, 0, sizeof(state)); state[i] = 1;
        nekoko_mapping_apply(state);
        for (int j = 0; j < 22; ++j) assert(state[j] == (i == j));
    }
    nekoko_packet_get(packet);
    // SW14をR3へ、従来R3をBACKへ入替える。
    packet[8] = 9; packet[9] = 10; reseal(packet);
    assert(nekoko_packet_set(packet));
    nekoko_mapping_load();
    assert(nekoko_mapping[0] == 9 && nekoko_mapping[1] == 10);
    memset(state, 0, sizeof(state)); state[13] = 1; state[0] = 1; state[12] = 1;
    nekoko_mapping_apply(state);
    assert(state[19] == 1 && state[13] == 0 && state[0] == 1 && state[12] == 1);
    // CRC・機種・長さ情報・値域・予約領域の不正を拒否する。
    const int bad_offsets[] = {0,4,5,6,7,8,19,30};
    for (unsigned int n = 0; n < sizeof(bad_offsets)/sizeof(bad_offsets[0]); ++n) {
        uint8_t bad[32]; memcpy(bad, packet, 32); bad[bad_offsets[n]] = 255;
        if (bad_offsets[n] != 30) reseal(bad);
        assert(!nekoko_packet_set(bad));
        assert(nekoko_mapping[0] == 9);
    }
    assert(nekoko_packet_set(packet));
    // 次の保存が途中で止まっても、再起動後に最後の正常な配置を使える。
    memcpy(old_storage, storage, sizeof(storage));
    for (int cut = 0; cut < 25; ++cut) {
        memcpy(storage, old_storage, sizeof(storage)); nekoko_mapping_load();
        memcpy(packet + 8, nekoko_default_map, 11); reseal(packet);
        write_limit = cut; writes = 0;
        assert(!nekoko_packet_set(packet));
        write_limit = -1; nekoko_mapping_load();
        assert(nekoko_mapping[0] == 9 && nekoko_mapping[1] == 10);
    }
    memcpy(storage, old_storage, sizeof(storage)); nekoko_mapping_load();
    assert(nekoko_packet_set(packet)); nekoko_mapping_load();
    assert(memcmp(nekoko_mapping, nekoko_default_map, 11) == 0);
    for (int i = 0; i < 10; ++i) assert(storage[i] == 0x5a);
    // 無効化と同じ出力の複数指定も、押下のORとして扱う。
    packet[8] = 0; packet[9] = 0; packet[10] = 11; reseal(packet);
    assert(nekoko_packet_set(packet));
    memset(state, 0, sizeof(state)); state[13] = 1; state[19] = 1; state[7] = 1;
    nekoko_mapping_apply(state);
    assert(state[5] == 1 && state[7] == 0 && state[19] == 0);
    nekoko_packet_get(result);
    assert(result[6] == 0 && memcmp(result + 8, packet + 8, 11) == 0);
    puts("mapping tests passed: defaults, swaps, validation, persistence, 25 power-loss points, fixed directions");
    return 0;
}
