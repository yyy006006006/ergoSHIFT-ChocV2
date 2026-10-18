#ifndef NEKOKO_MAPPING_H
#define NEKOKO_MAPPING_H
#include <stdbool.h>
#include <stdint.h>

#define NEKOKO_MAP_COUNT 11
#define NEKOKO_ACTION_COUNT 12
#define NEKOKO_PACKET_SIZE 32
#define NEKOKO_NV_SIZE 24
#define NEKOKO_NV_FIRST 32
#define NEKOKO_NV_SECOND 64

#ifdef __cplusplus
extern "C" {
#endif
extern const uint8_t nekoko_source_buttons[NEKOKO_MAP_COUNT];
extern const uint8_t nekoko_default_map[NEKOKO_MAP_COUNT];
extern uint8_t nekoko_mapping[NEKOKO_MAP_COUNT];
uint8_t nekoko_nv_read(uint16_t address);
void nekoko_nv_write(uint16_t address, uint8_t value);
uint16_t nekoko_crc16(const uint8_t* bytes, uint8_t length);
void nekoko_mapping_load(void);
void nekoko_mapping_apply(uint8_t* state);
void nekoko_packet_get(uint8_t* packet);
bool nekoko_packet_set(const uint8_t* packet);
#ifdef __cplusplus
}
#endif
#endif
