# Arduino and HM10 Bluetooth Module - Template

This Arduino sketch is intended to be used as a template for creating your own code for controlling Arduino-connected devices with the Bitty Controller application. 

More specifically, there are two ways in which an Arduino might have Bluetooth LE capabilities. Either it is "on board" in an integrated chip in the Arduino board itself (e.g. the no longer available Genuino 101) or it is provided via an outboard peripheral. Outboard peripherals may be in the form of "shields" which connect to the Arduino pins in the style of a full daughter board. Other, simpler Bluetooth modules have a serial communications interface and are connected to the Arduino via a few of the GPIO pins. This sketch template is for the latter type of situation.

An example product is the HM-10. See http://jnhuamao.cn/bluetooth.asp?id=1 for the manufacturer web site and see http://www.martyncurrey.com/hm-10-bluetooth-4ble-modules/ for some useful information.

Devices like the HM-10 provide a simple Bluetooth interface in the form of a single GATT service containing two characteristics. The characteristics are used for reading data and writing data. All data is exchanged via these characteristics, regardless of its type or purpose. In this way, the Bluetooth interface resembles that of a simple, serial cable in that any message formats and types must be defined and applied at the application layer.

The message formats which may be received from Bitty Controller can be deduced from the code, but for ease of use they are summarised here:

## General Format

[single byte message opcode, variable length data.....]

## Opcode 1 - Dual Dpad Controller Events

format: [0x01, 0x00] - opcode, dpad event ID

dpad event IDs:
  01 - left pad, top button - pressed
  02 - left pad, top button - released
  03 - left pad, bottom button - pressed
  04 - left pad, bottom button - released
  05 - left pad, left button - pressed
  06 - left pad, left button - released
  07 - left pad, right button - pressed
  08 - left pad, right button - released
  09 - right pad, top button - pressed
  10 - right pad, top button - released
  11 - right pad, bottom button - pressed
  12 - right pad, bottom button - released
  13 - right pad, left button - pressed
  14 - right pad, left button - released
  15 - right pad, right button - pressed
  16 - right pad, right button - released

## Opcode 2 - Touchpad Motion Events

format: [0x02, 0x00, 0x00] - opcode, fwd / bwd magnitude (-10 to +10), left / right magnitude (-10 to +10)

Note: consider the trackball to be centred at the origin with coordinates (0,0). Fwd / bwd and left / right displacements are measured from -10 to +10 with negative values if the trackball is to the left of centre (x-axis) or below the y-axis.

## Opcode 3 - Touchpad Control Events

format: [0x03, 0x00, 0x00] - opcode, RFU, 1=touchpad touched, 0=touchpad released

Examples:
        [0x03, 0x00, 0x01] - touchpad touched
        [0x03, 0x00, 0x00] - touchpad released

## Opcode 4 - Miscellaneous Control Events

format: [0x04, 0x00] - opcode, enhanced touchpad button 1=pressed, 2=released

Examples:
        [0x04, 0x01] - enhanced touchpad button pressed
        [0x04, 0x02] - enhanced touchpad button released

## Opcode 6 - Sampling Control Events

 format: [0x06, 0x00] - opcode, 1=start sampling, 2=stop sampling

## Opcode 7 - Multipad Buttons

format: [0x07, 0x00] - opcode, pad/button ID pressed
Examples:
        [0x07, 0x03] - button 3 on the touchpad with buttons UI was pressed

## Opcode 8 - Switch Events

format: [0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] - opcode, pin #1 number, pin #1 state, pin #2 number, pin #2 state, pin #3 number, pin #3 state

Examples:
        [0x08, 0x0B, 0x01, 0x0C, 0x00, 0x0D, 0x01] - pin 11 on, pin 12 off, pin 13 on
        [0x08, 0x0B, 0x00, 0x0C, 0x00, 0x0D, 0x00] - pin 11 off, pin 12 off, pin 13 off
        [0x08, 0x0B, 0x01, 0x0C, 0x01, 0x0D, 0x01] - pin 11 on, pin 12 on, pin 13 on

## Sending data to Bitty Controller for the enhanced touchpad sensor value cells

Data must be written to the serial port as a 16-bit value. Bits 0-9 contain the sensor value. Bits 10-12 contain a data ID no (1-5), which controls which cell in the enhanced touchpad screen, the data is displayed in.

This function may be used to transmit a value:

```
void transmitSensorReading(unsigned char data_id, short value)
{
  short ev = (data_id << 10) + value;
  // little endian format required
  sensor_msg[1] = ev;
  sensor_msg[2] = ev >> 8;
  writeHm10(sensor_msg, 3);
}
```