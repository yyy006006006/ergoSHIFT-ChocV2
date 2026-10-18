#ifndef NEKOKO_CONFIG_H
#define NEKOKO_CONFIG_H
#include <stdbool.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
extern bool nekoko_config_mode;
uint16_t nekoko_config_descriptor(uint16_t value, uint16_t index, const void** address);
void nekoko_config_request(void);
void nekoko_config_task(uint32_t physical_buttons);
#ifdef __cplusplus
}
#endif
#endif
