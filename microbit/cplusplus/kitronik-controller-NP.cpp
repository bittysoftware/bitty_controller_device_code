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

const int TOUCHPAD_MOTION = 9011;
const int TOUCHPAD_CONTROL = 9012;

int pin0, pin8, pin12, pin16 = 0;
int fwd, bwd, lft, rgt = 0;
int connected = 0;
int8_t bwd_fwd = 0;
int8_t lft_rgt = 0;
int8_t bwd_fwd_lvl = 0;
int8_t lft_rgt_lvl = 0;

// 0=stopped, 1=forwards, 2=backwards
int drive = 0;

void dpadForwards()
{
    pin0 = 0;
    pin8 = 0;
    pin12 = 1;
    pin16 = 1;
    drive = 1;
}

// dpad
void dpadBackwards()
{
    pin0 = 1;
    pin8 = 1;
    pin12 = 0;
    pin16 = 0;
    drive = 2;
}
void resetPinValues()
{
    pin0 = 0;
    pin8 = 0;
    pin12 = 0;
    pin16 = 0;
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
        pin12 = 1;
        pin16 = 0;
    }
    else
    {
        pin0 = 0;
        pin8 = 1;
    }
}

void dpadRight()
{
    lft = 0;
    rgt = 1;
    resetPinValues();
    if (drive == 1)
    {
        pin12 = 0;
        pin16 = 1;
    }
    else
    {
        pin0 = 1;
        pin8 = 0;
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
    uBit.io.P8.setAnalogValue(0);
    uBit.io.P12.setAnalogValue(0);
    uBit.io.P16.setAnalogValue(0);
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
    uBit.io.P0.setDigitalValue(pin0);
    uBit.io.P8.setDigitalValue(pin8);
    uBit.io.P12.setDigitalValue(pin12);
    uBit.io.P16.setDigitalValue(pin16);
}

void writePinsAnalog()
{

    // bwd_fwd_lvl: -ve=back +ve=forwards range:0-10
    //                                    0=no movement forwards or backwards
    //                                    1 to 10=forward speed (1=slowest, 10=fastest), -1 to -10 backwards
    // lft_rgt_lvl: -ve=left +ve=right    range:0-10
    //                                    0-2=no movement left or right (deliberately less sensitive than fwd/bwd control)
    //                                    +/- 3-8 gradually increasing turn
    //                                    +/- 9-10 sharp turn

    int p12_val = fwd * bwd_fwd_lvl * 102;
    int p16_val = fwd * bwd_fwd_lvl * 102;

    int p0_val = bwd * bwd_fwd_lvl * -102;
    int p8_val = bwd * bwd_fwd_lvl * -102;

    // left : pins 0 (backward) and 16 (forward)
    // right: pins 8 (backward) and 12 (forward)

    if (fwd == 1)
    {
        if (lft == 1)
        {
            // -3 to -8
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2)
            {
                // forward with slow left turn
                //	  	  	  uBit.serial.printf("B1\r\n");
                // left wheel slower than right, same direction of rotation
                p16_val = (int)((p12_val * (10 + lft_rgt_lvl)) / 10);
                // forward with faster left turn
            }
            else
            {
                // -9 to -10
                // forward with fast left turn
                // left wheel slower than right, opposite direction of rotation. Note, for extreme turns, could run this wheel faster than the other.
                //	  	  	  uBit.serial.printf("C1\r\n");
                p0_val = (int)((p12_val * (-8 - lft_rgt_lvl)) * 0.5);
                p8_val = 0;
                p16_val = 0;
            }
        }
        else if (rgt == 1)
        {
            // forward with slow right turn
            // 3 to 8
            if (lft_rgt_lvl < 9)
            {
                //	  	  	  uBit.serial.printf("D1\r\n");
                // right wheel slower than left, same direction of rotation
                p12_val = (int)((p16_val * (10 - lft_rgt_lvl)) / 10);
                p0_val = 0;
                p8_val = 0;
                // forward with faster right turn
            }
            else
            {
                // 9 to 10
                //	  	  	  uBit.serial.printf("E1\r\n");
                p8_val = (int)((p16_val * (lft_rgt_lvl - 8)) * 0.5);
                p0_val = 0;
                p12_val = 0;
            }
        }
        else if (lft == 0 && rgt == 0)
        {
            //	  	  	  uBit.serial.printf("A1\r\n");
        }
    }
    // left : pins 0 (backward) and 16 (forward)
    // right: pins 8 (backward) and 12 (forward)
    if (bwd == 1)
    {
        // -3 to -8
        if (lft == 1)
        {
            // backward with slow left turn
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2)
            {
                //	  	  	  uBit.serial.printf("B2\r\n");
                // left wheel slower than right, same direction of rotation
                p0_val = (int)((p8_val * (10 + lft_rgt_lvl)) / 10);
                p12_val = 0;
                p16_val = 0;
                // backward with faster left turn
            }
            else
            {
                // -9 to -10
                //	  	  	  uBit.serial.printf("C2\r\n");
                // left wheel slower than right, opposite direction of rotation. Note, for extreme turns, could run this wheel faster than the other.
                p16_val = (int)((p8_val * (-8 - lft_rgt_lvl)) * 0.5);
                p0_val = 0;
                p12_val = 0;
            }
        }
        else if (rgt == 1)
        {
            // backward with slow right turn
            // 3 to 8
            if (lft_rgt_lvl < 9)
            {
                //	  	  	  uBit.serial.printf("D2\r\n");
                // right wheel slower than left, same direction of rotation
                p8_val = (int)((p0_val * (10 - lft_rgt_lvl)) / 10);
                p12_val = 0;
                p16_val = 0;
                // backward with faster right turn
            }
            else
            {
                // 9 to 10
                // right wheel slower than left, opposite direction of rotation
                //	  	  	  uBit.serial.printf("E2\r\n");
                p12_val = (int)((p0_val * (lft_rgt_lvl - 8)) * 0.5);
                p8_val = 0;
                p16_val = 0;
            }
        }
        else if (lft == 0 && rgt == 0)
        {
            //	  	  	  uBit.serial.printf("A2\r\n");
        }
    }

    //  uBit.serial.printf("fwd: %d bwd: %d lft: %d rgt: %d bwd_fwd_lvl: %d lft_rgt_lvl: %d p0_val:%d p8_val:%d p12_val:%d p16_val:%d\r\n",fwd,bwd,lft,rgt,bwd_fwd_lvl,lft_rgt_lvl,p0_val,p8_val,p12_val,p16_val);

    uBit.io.P0.setAnalogValue(p0_val);
    uBit.io.P8.setAnalogValue(p8_val);
    uBit.io.P12.setAnalogValue(p12_val);
    uBit.io.P16.setAnalogValue(p16_val);
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
    stop();
    writePinsAnalog();
    setConnectedIndicator();
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

    uBit.serial.printf("bwd_fwd: %d lft_rgt: %d\r\n", bwd_fwd, lft_rgt);

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

    uBit.serial.printf("event %d\n", e.value);

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
        writePinsDigital();
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

    // Bitty Controller - Kitronik - No Pairing
    uBit.display.scroll("BC-K-NP");

    uBit.messageBus.listen(TOUCHPAD_MOTION, 0, onTouchpadMotionEvent);
    uBit.messageBus.listen(TOUCHPAD_CONTROL, 0, onTouchpadControlEvent);

    uBit.messageBus.listen(MES_DPAD_CONTROLLER_ID, 0, onDpadControllerEvent);

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
