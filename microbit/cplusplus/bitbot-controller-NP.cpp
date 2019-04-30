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

#include "MicroBit.h"
#include <stdlib.h>
#include <math.h>

MicroBit uBit;
MicroBitImage pattern(5, 5);
MicroBitThermometer thermometer;

const int TOUCHPAD_MOTION = 9011;
const int TOUCHPAD_CONTROL = 9012;
const int OTHER_CONTROL = 9013;
const int SENSOR_VALUE = 9014;
const int SAMPLING_START = 9015;
const int CONTROL_TARGET_1_ON = 1;
const int CONTROL_TARGET_1_OFF = 2;

const int SAMPLE_INTERVAL_MS = 250;

int sampling_sensors = 0;
int pin0, pin8, pin1, pin12 = 0;
int fwd, bwd, lft, rgt = 0;
int connected = 0;
int8_t bwd_fwd = 0;
int8_t lft_rgt = 0;
int8_t bwd_fwd_lvl = 0;
int8_t lft_rgt_lvl = 0;

// 0=stopped, 1=forwards, 2=backwards
int drive = 0;

void transmitSensorValue(uint8_t sensor_no, uint16_t the_sensor_value)
{
    // bits 0-9 contain value. Bits 10-12 contain a sensor no.
    uint16_t ev = ((sensor_no << 10) + the_sensor_value);
    // uBit.serial.printf("transmitted - %d,%d\r\n", SENSOR_VALUE, ev);
    MicroBitEvent evt(SENSOR_VALUE, ev);
}

int getAnalogEquivalentValue(int digital_sensor_value)
{
    int analog = 0;
    if (digital_sensor_value == 1)
    {
        analog = 1023;
    }
    return analog;
}

int getInvertedAnalogEquivalentValue(int digital_sensor_value)
{
    int analog = 0;
    if (digital_sensor_value == 0)
    {
        analog = 1023;
    }
    return analog;
}

void sampleSensors(MicroBitEvent)
{
    sampling_sensors = 1;
    uBit.serial.printf("sampling sensors - start\r\n");
    // adjust this code to include or exclude the sensors you're interested in

    int line_left;
    int line_right;
    int light_left;
    int light_right;
    int temperature;
    while (sampling_sensors == 1)
    {
        // line following sensors
        line_left = uBit.io.P11.getDigitalValue();
        line_right = uBit.io.P5.getDigitalValue();
        // select the left light sensor to read from
        uBit.io.P16.setDigitalValue(0);
        // read the sensor value
        light_left = uBit.io.P2.getAnalogValue();
        // select the right light sensor to read from
        uBit.io.P16.setDigitalValue(1);
        // read the sensor value
        light_right = uBit.io.P2.getAnalogValue();
        // read the internal thermometer
        temperature = thermometer.getTemperature();
        // assume min temperature of -20 and max of +40 (adjust to suit your purposes) and transform to the required range of 0-1023
        // range is 60
        temperature = (int)((temperature + 20.0) / 60.0 * 1023.0);
        uBit.serial.printf("temperature - %d\r\n", temperature);

        // transmit events over Bluetooth
        transmitSensorValue(1, getInvertedAnalogEquivalentValue(line_left));
        transmitSensorValue(2, getInvertedAnalogEquivalentValue(line_right));
        transmitSensorValue(3, light_left);
        transmitSensorValue(4, light_right);
        transmitSensorValue(5, temperature);

        fiber_sleep(SAMPLE_INTERVAL_MS);
    }
    uBit.serial.printf("sampling sensors - end\r\n");
}

void dpadForwards()
{
    uBit.serial.printf("fwd\r\n");
    // left motor
    pin0 = 1;
    pin8 = 0;
    // right motor
    pin1 = 1;
    pin12 = 0;

    drive = 1;
}

// dpad
void dpadBackwards()
{
    uBit.serial.printf("bwd\r\n");
    // left motor
    pin0 = 0;
    pin8 = 1;
    // right motor
    pin1 = 0;
    pin12 = 1;

    drive = 2;
}

void resetPinValues()
{
    pin0 = 0;
    pin8 = 0;
    pin1 = 0;
    pin12 = 0;
}

void stop()
{
    fwd = 0;
    bwd = 0;
    resetPinValues();
    drive = 0;
}

void dpadLeft()
{
    lft = 1;
    rgt = 0;
    resetPinValues();
    if (drive == 1)
    {
        // left motor off
        pin0 = 0;
        pin8 = 0;
        // right motor on, fwd
        pin1 = 1;
        pin12 = 0;
    }
    else
    {
        // left motor off
        pin0 = 0;
        pin8 = 0;
        // right motor on, bwd
        pin1 = 0;
        pin12 = 1;
    }
}

void dpadRight()
{
    lft = 0;
    rgt = 1;
    resetPinValues();
    if (drive == 1)
    {
        // right motor off
        pin1 = 0;
        pin12 = 0;
        // left motor on, fwd
        pin0 = 1;
        pin8 = 0;
    }
    else
    {
        // right motor off
        pin1 = 0;
        pin12 = 0;
        // left motor on, bwd
        pin0 = 0;
        pin8 = 8;
    }
}

void setIndicatorActivated()
{
    pattern.clear();
    pattern.setPixelValue(2, 2, 255);
    uBit.display.image.paste(pattern);
}

void setDeactivated()
{
    pattern.clear();
    uBit.display.image.paste(pattern);
    uBit.io.P0.setAnalogValue(0);
    uBit.io.P1.setAnalogValue(0);
    uBit.io.P8.setAnalogValue(0);
    uBit.io.P12.setAnalogValue(0);
}

void setDirectionIndicators()
{
    //    uBit.serial.printf("fwd:%d bwd:%d lft:%d rgt:%d bwd_fwd_lvl:%d lft_rgt_lvl:%d\r\n",fwd,bwd,lft,rgt,bwd_fwd_lvl,lft_rgt_lvl);
    pattern.clear();
    pattern.setPixelValue(2, 0, fwd * 25 * abs(bwd_fwd_lvl));
    pattern.setPixelValue(2, 1, fwd * 25 * abs(bwd_fwd_lvl));

    pattern.setPixelValue(2, 3, bwd * 25 * abs(bwd_fwd_lvl));
    pattern.setPixelValue(2, 4, bwd * 25 * abs(bwd_fwd_lvl));

    pattern.setPixelValue(0, 2, lft * 25 * abs(lft_rgt_lvl));
    pattern.setPixelValue(1, 2, lft * 25 * abs(lft_rgt_lvl));

    pattern.setPixelValue(4, 2, rgt * 25 * abs(lft_rgt_lvl));
    pattern.setPixelValue(3, 2, rgt * 25 * abs(lft_rgt_lvl));

    uBit.display.image.paste(pattern);
}

void writePinsDigital()
{
    uBit.serial.printf("P0:%d P1:%d P8:%d P12:%d\r\n", pin0, pin1, pin8, pin12);
    uBit.io.P0.setDigitalValue(pin0);
    uBit.io.P8.setDigitalValue(pin8);
    uBit.io.P1.setDigitalValue(pin1);
    uBit.io.P12.setDigitalValue(pin12);
}

void writePinsAnalog()
{
    uBit.serial.printf("fwd:%d bwd:%d bwd_fwd_lvl:%d\r\n", fwd, bwd, bwd_fwd_lvl);

    // bwd_fwd_lvl: -ve=back +ve=forwards range:0-10
    //                                    0=no movement forwards or backwards
    //                                    1 to 10=forward speed (1=slowest, 10=fastest), -1 to -10 backwards
    // lft_rgt_lvl: -ve=left +ve=right    range:0-10
    //                                    0-2=no movement left or right (deliberately less sensitive than fwd/bwd control)
    //                                    +/- 3-8 gradually increasing turn
    //                                    +/- 9-10 sharp turn

    // default to fowards and then adjust
    int p0_val = fwd * bwd_fwd_lvl * 102;
    int p8_val = 0;

    int p1_val = fwd * bwd_fwd_lvl * 102;
    int p12_val = 0;

    if (fwd == 1)
    {
        if (lft == 1)
        {
            // -3 to -8
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2)
            {
                uBit.serial.printf("F L SLOW\r\n");
                // forward with slow left turn
                // left wheel slower than right, same direction of rotation
                p1_val = fwd * bwd_fwd_lvl * 102;                   // right motor speed
                p0_val = (int)((p1_val * (10 + lft_rgt_lvl)) / 10); // left motor speed
                p12_val = 0;                                        // right motor fwd
                p8_val = 0;                                         // left  motor fwd
            }
            else
            {
                // forward with faster left turn
                // -9 to -10
                // forward with fast left turn
                // left wheel slower than right, opposite direction of rotation.
                uBit.serial.printf("F L FAST\r\n");
                p1_val = fwd * bwd_fwd_lvl * 102;                    // right motor speed
                p8_val = (int)((p1_val * (-8 - lft_rgt_lvl)) * 0.5); // left motor speed
                p12_val = 0;                                         // right motor fwd
                p0_val = 0;                                          // left  motor bwd
            }
        }
        else if (rgt == 1)
        {

            // forward with slow right turn
            // 3 to 8
            if (lft_rgt_lvl < 9)
            {
                uBit.serial.printf("F R SLOW\r\n");
                // forward with slow right turn
                // right wheel slower than left, same direction of rotation
                // F R SLOW
                p0_val = fwd * bwd_fwd_lvl * 102;                   // left motor speed
                p1_val = (int)((p0_val * (10 - lft_rgt_lvl)) / 10); // right motor speed
                p12_val = 0;                                        // right motor fwd
                p8_val = 0;                                         // left  motor fwd
            }
            else
            {
                // 9 to 10
                // right wheel slower than left, opposite direction of rotation.
                uBit.serial.printf("F R FAST\r\n");
                // F R FAST
                p0_val = fwd * bwd_fwd_lvl * 102;                    // left motor speed
                p12_val = (int)((p0_val * (lft_rgt_lvl - 8)) * 0.5); // right motor speed
                p1_val = 0;                                          // right motor bwd
                p8_val = 0;                                          // left  motor fwd
            }
        }
        else if (lft == 0 && rgt == 0)
        {
            uBit.serial.printf("F STRAIGHT\r\n");
        }
    }
    if (bwd == 1)
    {
        // -3 to -8
        if (lft == 1)
        {
            // backward with slow left turn
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2)
            {
                uBit.serial.printf("B L SLOW\r\n");
                // backward with slow left turn
                // left wheel slower than right, same direction of rotation
                p12_val = bwd * bwd_fwd_lvl * -102;                  // right motor speed
                p8_val = (int)((p12_val * (10 + lft_rgt_lvl)) / 10); // left motor speed
                p1_val = 0;                                          // right motor bwd
                p0_val = 0;                                          // left  motor bwd
            }
            else
            {
                // -9 to -10
                // left wheel slower than right, opposite direction of rotation.
                uBit.serial.printf("B L FAST\r\n");
                p12_val = bwd * bwd_fwd_lvl * -102;                   // right motor speed
                p0_val = (int)((p12_val * (-8 - lft_rgt_lvl)) * 0.5); // left motor speed
                p1_val = 0;                                           // right motor bwd
                p8_val = 0;                                           // left  motor fwd
            }
        }
        else if (rgt == 1)
        {
            // backward with slow right turn
            // 3 to 8
            if (lft_rgt_lvl < 9)
            {
                uBit.serial.printf("B R SLOW\r\n");
                // backward with slow left turn
                // right wheel slower than left, same direction of rotation
                p8_val = bwd * bwd_fwd_lvl * -102;                   // left motor speed
                p12_val = (int)((p8_val * (10 - lft_rgt_lvl)) / 10); // right motor speed
                p1_val = 0;                                          // right motor bwd
                p0_val = 0;                                          // left  motor bwd
            }
            else
            {
                // 9 to 10
                // right wheel slower than left, opposite direction of rotation
                uBit.serial.printf("B R FAST\r\n");
                p8_val = bwd * bwd_fwd_lvl * -102;                  // left motor speed
                p1_val = (int)((p8_val * (lft_rgt_lvl - 8)) * 0.5); // right motor speed
                p0_val = 0;                                         // right motor bwd
                p12_val = 0;                                        // left  motor fwd
            }
        }
        else if (lft == 0 && rgt == 0)
        {
            uBit.serial.printf("B STRAIGHT\r\n");
            // fwd: 0 bwd: 1 lft: 0 rgt: 0 bwd_fwd_lvl: -10 lft_rgt_lvl: 0 p0_val:0 p8_val:0 p1_val:0 p12_val:0
            p8_val = bwd * bwd_fwd_lvl * -102;
            p0_val = 0;
            p12_val = bwd * bwd_fwd_lvl * -102;
            p1_val = 0;
        }
    }

    uBit.serial.printf("fwd: %d bwd: %d lft: %d rgt: %d bwd_fwd_lvl: %d lft_rgt_lvl: %d p0_val:%d p8_val:%d p1_val:%d p12_val:%d\r\n", fwd, bwd, lft, rgt, bwd_fwd_lvl, lft_rgt_lvl, p0_val, p8_val, p1_val, p12_val);

    uBit.io.P0.setAnalogValue(p0_val);
    uBit.io.P1.setAnalogValue(p1_val);
    uBit.io.P8.setAnalogValue(p8_val);
    uBit.io.P12.setAnalogValue(p12_val);
}

void setConnectedIndicator()
{
    if (connected == 1)
    {
        uBit.display.print("C");
    }
    else
    {
        uBit.display.print("D");
    }
}

void onConnected(MicroBitEvent)
{
    connected = 1;
    setConnectedIndicator();
}

void onDisconnected(MicroBitEvent)
{
    connected = 0;
    setConnectedIndicator();
    sampling_sensors = 0;
    stop();
    writePinsAnalog();
}

void onTouchpadControlEvent(MicroBitEvent e)
{
    int8_t ctrl1 = {(uint8_t)(e.value & 0xFF)};
    int8_t ctrl2 = {(uint8_t)((e.value >> 8))};
    uBit.serial.printf("ctrl1: %d ctrl2: %d\r\n", ctrl1, ctrl2);

    if (ctrl1 == 0 && ctrl2 == 1)
    {
        setIndicatorActivated();
        return;
    }

    if (ctrl1 == 0 && ctrl2 == 0)
    {
        bwd_fwd = 0;
        lft_rgt = 0;
        lft = 0;
        rgt = 0;
        stop();
        writePinsAnalog();
        setDeactivated();
        return;
    }
}

void onTouchpadMotionEvent(MicroBitEvent e)
{
    // value[0] -ve=back +ve=forwards range:0-10
    //                                      0=no movement forwards or backwards
    //                                      1 to 10=forward speed (1=slowest, 10=fastest), -1 to -10 backwards
    // value[1] -ve=left +ve=right    range:0-10
    //                                      0-2=no movement left or right (deliberately less sensitive than fwd/bwd control)
    //                                      +/- 3-8 gradually increasing turn
    //                                      +/- 9-10 sharp turn

    bwd_fwd = {(int8_t)(e.value & 0xFF)};
    lft_rgt = {(int8_t)((e.value >> 8))};

    uBit.serial.printf("tp bwd_fwd: %d lft_rgt: %d\r\n", bwd_fwd, lft_rgt);

    if (bwd_fwd == 0 && lft_rgt == 0)
    {
        return;
    }

    fwd = 0;
    bwd = 0;
    lft = 0;
    rgt = 0;

    if (bwd_fwd > 0)
    {
        fwd = 1;
        bwd = 0;
        bwd_fwd_lvl = bwd_fwd;
    }
    if (bwd_fwd < 0)
    {
        bwd = 1;
        fwd = 0;
        bwd_fwd_lvl = bwd_fwd;
    }
    // left/right is deliberately less sensitive
    if (lft_rgt < -2)
    {
        lft = 1;
        rgt = 0;
        lft_rgt_lvl = lft_rgt;
    }
    if (lft_rgt > 2)
    {
        rgt = 1;
        lft = 0;
        lft_rgt_lvl = lft_rgt;
    }

    setDirectionIndicators();
    writePinsAnalog();
}

void onDpadControllerEvent(MicroBitEvent e)
{

    // MES_DPAD_BUTTON_1_DOWN = right hand pad, up
    // MES_DPAD_BUTTON_2_DOWN = right hand pad, down
    // MES_DPAD_BUTTON_C_DOWN = left hand pad, left
    // MES_DPAD_BUTTON_D_DOWN = left hand pad, right

    uBit.serial.printf("dpad event %d\r\n", e.value);

    if (e.value == MES_DPAD_BUTTON_1_DOWN)
    {
        fwd = 1;
        bwd_fwd_lvl = 10;
    }
    if (e.value == MES_DPAD_BUTTON_1_UP)
    {
        fwd = 0;
        bwd_fwd_lvl = 0;
    }
    if (e.value == MES_DPAD_BUTTON_2_DOWN)
    {
        bwd = 1;
        bwd_fwd_lvl = -10;
    }
    if (e.value == MES_DPAD_BUTTON_2_UP)
    {
        bwd = 0;
        bwd_fwd_lvl = 0;
    }
    if (e.value == MES_DPAD_BUTTON_C_DOWN)
    {
        lft = 1;
        lft_rgt_lvl = -10;
    }
    if (e.value == MES_DPAD_BUTTON_C_UP)
    {
        lft = 0;
        lft_rgt_lvl = 0;
    }
    if (e.value == MES_DPAD_BUTTON_D_DOWN)
    {
        rgt = 1;
        lft_rgt_lvl = 10;
    }
    if (e.value == MES_DPAD_BUTTON_D_UP)
    {
        rgt = 0;
        lft_rgt_lvl = 0;
    }

    if (e.value == MES_DPAD_BUTTON_1_DOWN)
    {
        dpadForwards();
    }
    else if (e.value == MES_DPAD_BUTTON_1_UP || e.value == MES_DPAD_BUTTON_2_UP)
    {
        stop();
        setDirectionIndicators();
        writePinsDigital();
        return;
    }
    else if (e.value == MES_DPAD_BUTTON_2_DOWN)
    {
        dpadBackwards();
    }

    if (drive > 0)
    {
        if (e.value == MES_DPAD_BUTTON_C_DOWN)
        {
            dpadLeft();
        }
        else
        {
            if (e.value == MES_DPAD_BUTTON_D_DOWN)
            {
                dpadRight();
            }
            else
            {
                if (e.value == MES_DPAD_BUTTON_C_UP || e.value == MES_DPAD_BUTTON_D_UP)
                {
                    if (drive == 1)
                    {
                        dpadForwards();
                    }
                    else
                    {
                        dpadBackwards();
                    }
                }
            }
        }
    }
    setDirectionIndicators();
    writePinsDigital();
}

void onOtherControlEvent(MicroBitEvent e)
{
    uBit.serial.printf("other event %d\r\n", e.value);
    switch (e.value)
    {
    case CONTROL_TARGET_1_ON:
        // switch pin 14 (buzzer on Bit:Bot) ON
        //        uBit.serial.printf("buzzer on\r\n");
        uBit.io.P14.setDigitalValue(1);
        break;
    case CONTROL_TARGET_1_OFF:
        // switch pin 14 (buzzer on Bit:Bot) OFF
        //        uBit.serial.printf("buzzer off\r\n");
        uBit.io.P14.setDigitalValue(0);
        break;
    }
}

void onButton(MicroBitEvent)
{
    uBit.display.scroll(uBit.getName());
}

int main()
{
    // Initialise the micro:bit runtime.
    uBit.init();

    bwd_fwd_lvl = 0;
    lft_rgt_lvl = 0;

    // Bitty Controller - BitBot - No Pairing
    uBit.display.scroll("BC-B-NP");

    uBit.messageBus.listen(TOUCHPAD_MOTION, 0, onTouchpadMotionEvent);
    uBit.messageBus.listen(TOUCHPAD_CONTROL, 0, onTouchpadControlEvent);
    uBit.messageBus.listen(MES_DPAD_CONTROLLER_ID, 0, onDpadControllerEvent);
    uBit.messageBus.listen(OTHER_CONTROL, 0, onOtherControlEvent);
    uBit.messageBus.listen(SAMPLING_START, 0, sampleSensors);

    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);

    uBit.messageBus.listen(MICROBIT_ID_BUTTON_A, MICROBIT_BUTTON_EVT_CLICK, onButton);
    uBit.messageBus.listen(MICROBIT_ID_BUTTON_B, MICROBIT_BUTTON_EVT_CLICK, onButton);

    uBit.display.setDisplayMode(DISPLAY_MODE_GREYSCALE);

    // If main exits, there may still be other fibers running or registered event handlers etc.
    // Simply release this fiber, which will mean we enter the scheduler. Worse case, we then
    // sit in the idle task forever, in a power efficient sleep.
    release_fiber();
}
