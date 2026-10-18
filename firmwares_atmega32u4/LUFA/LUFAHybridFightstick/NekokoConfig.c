#include "Descriptors.h"
#include "NekokoConfig.h"
#include "NekokoMapping.h"
#include <avr/eeprom.h>

bool nekoko_config_mode = false;
static uint8_t idle_rate;

uint8_t nekoko_nv_read(uint16_t address) { return eeprom_read_byte((const uint8_t*)(uintptr_t)address); }
void nekoko_nv_write(uint16_t address, uint8_t value) { eeprom_update_byte((uint8_t*)(uintptr_t)address, value); }

// 設定中だけベンダー定義HIDとして列挙する。ゲーム用USB記述子は変更しない。
static const uint8_t PROGMEM ConfigReport[] = {
    0x06,0x60,0xff, 0x09,0x61, 0xa1,0x01,
    0x15,0x00, 0x26,0xff,0x00, 0x75,0x08,
    0x95,NEKOKO_PACKET_SIZE, 0x09,0x62, 0xb1,0x02,
    0x95,0x04, 0x09,0x63, 0x81,0x02, 0xc0
};
static const USB_Descriptor_Device_t PROGMEM ConfigDevice = {
    .Header = {.Size=sizeof(USB_Descriptor_Device_t), .Type=DTYPE_Device},
    .USBSpecification=VERSION_BCD(2,0,0),
    .Class=USB_CSCP_NoDeviceClass, .SubClass=USB_CSCP_NoDeviceSubclass, .Protocol=USB_CSCP_NoDeviceProtocol,
    .Endpoint0Size=FIXED_CONTROL_ENDPOINT_SIZE,
    .VendorID=0x0f0d, .ProductID=0x0092, .ReleaseNumber=VERSION_BCD(2,0,0),
    .ManufacturerStrIndex=STRING_ID_Manufacturer, .ProductStrIndex=STRING_ID_Product,
    .SerialNumStrIndex=NO_DESCRIPTOR, .NumberOfConfigurations=1
};
typedef struct {
    USB_Descriptor_Configuration_Header_t config;
    USB_Descriptor_Interface_t interface;
    USB_HID_Descriptor_HID_t hid;
    USB_Descriptor_Endpoint_t in;
} ConfigDescriptor_t;
static const ConfigDescriptor_t PROGMEM ConfigDescriptor = {
    .config={.Header={.Size=sizeof(USB_Descriptor_Configuration_Header_t), .Type=DTYPE_Configuration},
        .TotalConfigurationSize=sizeof(ConfigDescriptor_t), .TotalInterfaces=1,
        .ConfigurationNumber=1, .ConfigurationStrIndex=NO_DESCRIPTOR,
        .ConfigAttributes=USB_CONFIG_ATTR_RESERVED, .MaxPowerConsumption=USB_CONFIG_POWER_MA(100)},
    .interface={.Header={.Size=sizeof(USB_Descriptor_Interface_t), .Type=DTYPE_Interface},
        .InterfaceNumber=0, .AlternateSetting=0, .TotalEndpoints=1,
        .Class=HID_CSCP_HIDClass, .SubClass=HID_CSCP_NonBootSubclass,
        .Protocol=HID_CSCP_NonBootProtocol, .InterfaceStrIndex=NO_DESCRIPTOR},
    .hid={.Header={.Size=sizeof(USB_HID_Descriptor_HID_t), .Type=HID_DTYPE_HID},
        .HIDSpec=VERSION_BCD(1,1,1), .CountryCode=0, .TotalReportDescriptors=1,
        .HIDReportType=HID_DTYPE_Report, .HIDReportLength=sizeof(ConfigReport)},
    .in={.Header={.Size=sizeof(USB_Descriptor_Endpoint_t), .Type=DTYPE_Endpoint},
        .EndpointAddress=JOYSTICK_IN_EPADDR, .Attributes=EP_TYPE_INTERRUPT,
        .EndpointSize=8, .PollingIntervalMS=4}
};
static const USB_Descriptor_String_t PROGMEM ConfigLanguage = USB_STRING_DESCRIPTOR_ARRAY(LANGUAGE_ID_ENG);
static const USB_Descriptor_String_t PROGMEM ConfigManufacturer = USB_STRING_DESCRIPTOR(L"nekoko");
static const USB_Descriptor_String_t PROGMEM ConfigProduct = USB_STRING_DESCRIPTOR(L"ergoSHIFT Configuration");

uint16_t nekoko_config_descriptor(uint16_t value, uint16_t index, const void** address) {
    uint8_t type = value >> 8, number = value & 255;
    *address = NULL;
    switch (type) {
        case DTYPE_Device: *address=&ConfigDevice; return sizeof(ConfigDevice);
        case DTYPE_Configuration: *address=&ConfigDescriptor; return sizeof(ConfigDescriptor);
        case DTYPE_HID:
            if (index == 0) { *address=&ConfigDescriptor.hid; return sizeof(ConfigDescriptor.hid); }
            break;
        case DTYPE_Report:
            if (index == 0) { *address=&ConfigReport; return sizeof(ConfigReport); }
            break;
        case DTYPE_String:
            if (number == 0) *address=&ConfigLanguage;
            if (number == STRING_ID_Manufacturer) *address=&ConfigManufacturer;
            if (number == STRING_ID_Product) *address=&ConfigProduct;
            if (*address) return pgm_read_byte(*address);
            break;
    }
    return NO_DESCRIPTOR;
}

void nekoko_config_request(void) {
    // 機種・版・CRCの検査と保存後の照合は共通コアが行う。
    uint8_t packet[NEKOKO_PACKET_SIZE];
    if (USB_ControlRequest.wIndex != 0) return;
    if (USB_ControlRequest.bRequest == HID_REQ_GetReport && USB_ControlRequest.bmRequestType == 0xa1 &&
        USB_ControlRequest.wValue == 0x0300 && USB_ControlRequest.wLength == NEKOKO_PACKET_SIZE) {
        nekoko_packet_get(packet);
        Endpoint_ClearSETUP();
        Endpoint_Write_Control_Stream_LE(packet, sizeof(packet));
        Endpoint_ClearOUT();
    } else if (USB_ControlRequest.bRequest == HID_REQ_SetReport && USB_ControlRequest.bmRequestType == 0x21 &&
        USB_ControlRequest.wValue == 0x0300 && USB_ControlRequest.wLength == NEKOKO_PACKET_SIZE) {
        Endpoint_ClearSETUP();
        if (Endpoint_Read_Control_Stream_LE(packet, sizeof(packet)) != ENDPOINT_RWCSTREAM_NoError) return;
        nekoko_packet_set(packet);
        Endpoint_ClearIN();
    } else if (USB_ControlRequest.bRequest == HID_REQ_SetIdle && USB_ControlRequest.bmRequestType == 0x21 &&
        USB_ControlRequest.wLength == 0) {
        idle_rate = USB_ControlRequest.wValue >> 8;
        Endpoint_ClearSETUP(); Endpoint_ClearStatusStage();
    } else if (USB_ControlRequest.bRequest == HID_REQ_GetIdle && USB_ControlRequest.bmRequestType == 0xa1 &&
        USB_ControlRequest.wLength == 1) {
        Endpoint_ClearSETUP(); Endpoint_Write_Control_Stream_LE(&idle_rate, 1); Endpoint_ClearOUT();
    }
}

void nekoko_config_task(uint32_t physical_buttons) {
    if (USB_DeviceState != DEVICE_STATE_Configured) return;
    Endpoint_SelectEndpoint(JOYSTICK_IN_EPADDR);
    if (Endpoint_IsINReady()) {
        Endpoint_Write_Stream_LE(&physical_buttons, 4, NULL);
        Endpoint_ClearIN();
    }
}
