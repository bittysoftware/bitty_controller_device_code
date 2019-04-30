/*
The MIT License (MIT)

This software is provided by Bitty Software - https://www.bittysoftware.com

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/

/*
About this code
---------------
A template Arduino sketch for use with Bluetooth modules such as the HM-10, which connect to the Arduino GPIO pins and provide serial access to data received by or transmitted from the module over Bluetooth.

*/

#include <SoftwareSerial.h>

#define rxPin 11
#define txPin 10

#define BUFLEN 80
unsigned char buf[BUFLEN];
int rx_count = 0;
int expected = 0;
char opcode = 0;
int msg_lens[9] = {0, 2, 3, 3, 2, 3, 2, 2, 7};
unsigned char sensor_msg[4] = {5, 0, 0, 0}; // Message length is 3. Buffer is zero delimited.
int pos = 0;

unsigned long sample_timestamp;

SoftwareSerial mySerial(rxPin, txPin);

void storeInBuffer(int readch, char *buffer)
{
  if (pos < BUFLEN - 1)
  {
    buffer[pos++] = readch;
    buffer[pos] = 0;
  }
}

int readMessage(int readch, char *buffer)
{
  // got nothing?
  if (readch < 0)
  {
    return 0;
  }

  // is this the first message byte i.e. the opcode?
  if (rx_count == 0)
  {
    opcode = readch;
    expected = msg_lens[opcode];
  }

  rx_count++;

  // received the expected number of bytes?
  if (rx_count == expected)
  {
    storeInBuffer(readch, buffer);
    pos = 0; // Reset buffer index
    return rx_count;
  }

  if (rx_count < expected)
  {
    storeInBuffer(readch, buffer);
    // Serial.print("count: ");
    // Serial.println(rx_count);
    return 0;
  }
  else
  {
    Serial.print("Error: unexpected excess data - bug! : ");
    Serial.println(rx_count);
    return rx_count;
  }
}

void writeHm10(char *output, int len)
{
  Serial.print("TX: ");
  logBuffer(output, len);
  mySerial.write(output);
}

void logBuffer(unsigned char *buf, int len)
{
  for (int i = 0; i < len; i++)
  {
    String hex = String(buf[i], HEX);
    Serial.print(hex);
    Serial.print(" ");
  }
  Serial.println("");
}

void swallowResponse()
{
  String result = "RX: ";
  while (mySerial.available())
    result += mySerial.read();
  Serial.println(result);
}

void setup()
{
  Serial.begin(9600);
  mySerial.begin(9600);
  delay(500);
  writeHm10("AT+RESET\r\n", 10);
  // make sure the serial buffer from the Bluetooth module is empty
  delay(500);
  swallowResponse();
  sample_timestamp = millis();
  randomSeed(analogRead(0));
}

void dpadControlEvent()
{
  // format: [0x01, 0x00] - opcode, dpad event ID
  // dpad event IDs:
  //   01 - left pad, top button - pressed
  //   02 - left pad, top button - released
  //   03 - left pad, bottom button - pressed
  //   04 - left pad, bottom button - released
  //   05 - left pad, left button - pressed
  //   06 - left pad, left button - released
  //   07 - left pad, right button - pressed
  //   08 - left pad, right button - released
  //   09 - right pad, top button - pressed
  //   10 - right pad, top button - released
  //   11 - right pad, bottom button - pressed
  //   12 - right pad, bottom button - released
  //   13 - right pad, left button - pressed
  //   14 - right pad, left button - released
  //   15 - right pad, right button - pressed
  //   16 - right pad, right button - released
}

void touchpadMotionEvent()
{
  // format: [0x02, 0x00, 0x00] - opcode, fwd bwd magnitude (-10 to +10), left right magnitude (-10 to +10)
}

void touchpadControlEvent()
{
  // format: [0x03, 0x00, 0x00] - opcode, RFU, 1=touchpad touched, 0=touchpad released
  // Examples:
  //         [0x03, 0x00, 0x01] - touchpad touched
  //         [0x03, 0x00, 0x00] - touchpad released
}

void otherControlEvent()
{
  // format: [0x04, 0x00] - opcode, enhanced touchpad button 1=pressed, 2=released
  // Examples:
  //         [0x04, 0x01] - pressed
  //         [0x04, 0x02] - released
}

void samplingControlEvent()
{
  // format: [0x06, 0x00] - opcode, 1=start sampling, 2=stop sampling
}

void padEvent()
{
  // format: [0x07, 0x00] - opcode, pad/button ID pressed
  // Examples:
  //  [0x07, 0x03] - button 3 on the touchpad with buttons UI was pressed
}

void pinEvent()
{
  // format: [0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] - opcode, pin #1 number, pin #1 state, pin #2 number, pin #2 state, pin #3 number, pin #3 state
  // Examples:
  //  [0x08, 0x0B, 0x01, 0x0C, 0x00, 0x0D, 0x01] - pin 11 on, pin 12 off, pin 13 on
  //  [0x08, 0x0B, 0x00, 0x0C, 0x00, 0x0D, 0x00] - pin 11 off, pin 12 off, pin 13 off
  //  [0x08, 0x0B, 0x01, 0x0C, 0x01, 0x0D, 0x01] - pin 11 on, pin 12 on, pin 13 on
}

short simulateSensorReading()
{
  return (short)random(1024);
}

void transmitSensorReading(unsigned char data_id, short value)
{
  // bits 0-9 contain value. Bits 10-12 contain a data ID no (1-5)
  Serial.print("ID: ");
  Serial.println(data_id);
  Serial.print("Value: ");
  Serial.println(value);
  short ev = (data_id << 10) + value;
  Serial.print("16-bit: ");
  Serial.println(ev);
  // little endian format required
  sensor_msg[1] = ev;
  sensor_msg[2] = ev >> 8;
  Serial.print("sensor_msg[1]: ");
  Serial.println(sensor_msg[1]);
  Serial.print("sensor_msg[2]: ");
  Serial.println(sensor_msg[2]);
  writeHm10(sensor_msg, 3);
}

void loop()
{

  if (readMessage(mySerial.read(), buf) > 0)
  {
    rx_count = 0;
    Serial.print("RX: ");
    logBuffer(buf, expected);
    switch (opcode)
    {
    case 1:
      dpadControlEvent();
      break;
    case 2:
      touchpadMotionEvent();
      break;
    case 3:
      touchpadControlEvent();
      break;
    case 4:
      otherControlEvent();
      break;
    case 6:
      samplingControlEvent();
      break;
    case 7:
      padEvent();
      break;
    case 8:
      pinEvent();
      break;
    }
    expected = 0;
    opcode = 0;
  }
  // sample sensors every 1000ms
  if (millis() - sample_timestamp > 1000)
  {
    // simulate sampling from 5 different sensors
    for (int i = 1; i < 6; i++)
    {
      transmitSensorReading(i, simulateSensorReading());
      delay(50);
    }
    sample_timestamp = millis();
  }
}