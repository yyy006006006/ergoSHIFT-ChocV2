#include "NekokoMapping.h"
#include <string.h>

// 順番は実基板のSW14,9,10,11,12,13,15,16,17,18,7。値は既存LUFAのボタン番号。
const uint8_t nekoko_source_buttons[NEKOKO_MAP_COUNT] = {13,19,7,6,9,8,10,5,4,11,18};
static const uint8_t action_buttons[11] = {5,4,7,6,8,9,10,11,18,19,13};
const uint8_t nekoko_default_map[NEKOKO_MAP_COUNT] = {10,9,2,3,5,4,6,0,1,7,8};
uint8_t nekoko_mapping[NEKOKO_MAP_COUNT];
static int8_t active_bank = -1;
static uint16_t generation;
static uint8_t last_status;

uint16_t nekoko_crc16(const uint8_t* bytes, uint8_t length) {
    uint16_t crc = 0xffff;
    for (uint8_t i = 0; i < length; ++i) {
        crc ^= (uint16_t)bytes[i] << 8;
        for (uint8_t bit = 0; bit < 8; ++bit)
            crc = (crc & 0x8000) ? (uint16_t)((crc << 1) ^ 0x1021) : (uint16_t)(crc << 1);
    }
    return crc;
}

static void seal(uint8_t* bytes, uint8_t size) {
    uint16_t crc = nekoko_crc16(bytes, size - 2);
    bytes[size - 2] = (uint8_t)crc;
    bytes[size - 1] = (uint8_t)(crc >> 8);
}

static bool valid_crc(const uint8_t* bytes, uint8_t size) {
    return nekoko_crc16(bytes, size - 2) == ((uint16_t)bytes[size - 2] | ((uint16_t)bytes[size - 1] << 8));
}

static bool valid_map(const uint8_t* map) {
    for (uint8_t i = 0; i < NEKOKO_MAP_COUNT; ++i)
        if (map[i] >= NEKOKO_ACTION_COUNT) return false;
    return true;
}

static bool read_bank(uint16_t address, uint8_t* record) {
    for (uint8_t i = 0; i < NEKOKO_NV_SIZE; ++i) record[i] = nekoko_nv_read(address + i);
    return memcmp(record, "ESNV", 4) == 0 && record[4] == 1 && record[5] == NEKOKO_MAP_COUNT &&
        valid_map(record + 8) && valid_crc(record, NEKOKO_NV_SIZE);
}

void nekoko_mapping_load(void) {
    uint8_t first[NEKOKO_NV_SIZE], second[NEKOKO_NV_SIZE];
    bool has_first = read_bank(NEKOKO_NV_FIRST, first);
    bool has_second = read_bank(NEKOKO_NV_SECOND, second);
    uint16_t gen_first = first[6] | ((uint16_t)first[7] << 8);
    uint16_t gen_second = second[6] | ((uint16_t)second[7] << 8);
    active_bank = -1;
    generation = 0;
    last_status = 0;
    memcpy(nekoko_mapping, nekoko_default_map, NEKOKO_MAP_COUNT);
    if (has_first || has_second) {
        active_bank = has_second && (!has_first || (int16_t)(gen_second - gen_first) > 0) ? 1 : 0;
        generation = active_bank == 1 ? gen_second : gen_first;
        memcpy(nekoko_mapping, (active_bank == 1 ? second : first) + 8, NEKOKO_MAP_COUNT);
    }
}

static bool save_map(const uint8_t* map) {
    // 既存設定の0〜9番地は触らず、2面交互保存で書込み中の電源断に備える。
    if (memcmp(map, nekoko_mapping, NEKOKO_MAP_COUNT) == 0) return true;
    uint8_t record[NEKOKO_NV_SIZE] = {0}, verify[NEKOKO_NV_SIZE];
    uint16_t next_generation = generation + 1;
    int8_t next_bank = active_bank == 0 ? 1 : 0;
    uint16_t address = next_bank == 1 ? NEKOKO_NV_SECOND : NEKOKO_NV_FIRST;
    memcpy(record, "ESNV", 4);
    record[4] = 1;
    record[5] = NEKOKO_MAP_COUNT;
    record[6] = (uint8_t)next_generation;
    record[7] = (uint8_t)(next_generation >> 8);
    memcpy(record + 8, map, NEKOKO_MAP_COUNT);
    seal(record, NEKOKO_NV_SIZE);
    nekoko_nv_write(address, 0);
    for (uint8_t i = 1; i < NEKOKO_NV_SIZE; ++i) nekoko_nv_write(address + i, record[i]);
    nekoko_nv_write(address, record[0]); // 完成してから有効印を書き込む。
    if (!read_bank(address, verify) || memcmp(record, verify, NEKOKO_NV_SIZE) != 0) return false;
    memcpy(nekoko_mapping, map, NEKOKO_MAP_COUNT);
    generation = next_generation;
    active_bank = next_bank;
    return true;
}

void nekoko_packet_get(uint8_t* packet) {
    memset(packet, 0, NEKOKO_PACKET_SIZE);
    memcpy(packet, "ESCF", 4);
    packet[4] = 1; // 通信仕様の版。
    packet[5] = 1; // 対象はergoSHIFT Rev1 Standard-BSocket。
    packet[6] = last_status;
    packet[7] = NEKOKO_MAP_COUNT;
    memcpy(packet + 8, nekoko_mapping, NEKOKO_MAP_COUNT);
    seal(packet, NEKOKO_PACKET_SIZE);
}

bool nekoko_packet_set(const uint8_t* packet) {
    // 他機種、壊れたデータ、将来版は保存せず、GETで失敗理由を返す。
    bool valid = memcmp(packet, "ESCF", 4) == 0 && packet[4] == 1 && packet[5] == 1 &&
        packet[6] == 0 && packet[7] == NEKOKO_MAP_COUNT && valid_map(packet + 8) &&
        valid_crc(packet, NEKOKO_PACKET_SIZE);
    for (uint8_t i = 19; i < NEKOKO_PACKET_SIZE - 2; ++i) if (packet[i] != 0) valid = false;
    if (!valid) { last_status = 1; return false; }
    if (!save_map(packet + 8)) { last_status = 2; return false; }
    last_status = 0;
    return true;
}

void nekoko_mapping_apply(uint8_t* state) {
    // 元の押下状態を先に退避し、入替えや同じ出力の重複指定でも循環しないようにする。
    uint8_t physical[NEKOKO_MAP_COUNT];
    for (uint8_t i = 0; i < NEKOKO_MAP_COUNT; ++i) {
        physical[i] = state[nekoko_source_buttons[i]];
        state[nekoko_source_buttons[i]] = 0;
    }
    for (uint8_t i = 0; i < NEKOKO_MAP_COUNT; ++i)
        if (nekoko_mapping[i] < 11) state[action_buttons[nekoko_mapping[i]]] |= physical[i];
}
