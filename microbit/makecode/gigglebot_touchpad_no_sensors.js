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

enum gigglebotI2CCommands {
    GET_FIRMWARE_VERSION = 1,
        GET_MANUFACTURER,
        GET_BOARD,
        GET_VOLTAGE_BATTERY,
        GET_LINE_SENSORS,
        GET_LIGHT_SENSORS,
        GET_MOTOR_STATUS_RIGHT,
        GET_MOTOR_STATUS_LEFT,
        SET_MOTOR_POWER,
        SET_MOTOR_POWERS
}
let ADDR = 0x04
let lft = 0
let rgt = 0
let dir = 0
let bwd_fwd = 0
let lft_rgt = 0
let lft_motor = 0;
let rgt_motor = 0;
let TOUCHPAD_MOTION = 0
let TOUCHPAD_CONTROL = 0
let ev = 0
let connected = 0
bluetooth.onBluetoothDisconnected(function () {
    connected = 0
    setConnectedIndicator()
})
bluetooth.onBluetoothConnected(function () {
    connected = 1
    setConnectedIndicator()
})

function setIndicatorActivated() {
    basic.clearScreen()
    led.plot(2, 2)
}

/**
 * Assigns potentially different powers to both motors in one call.  
 * Values from 101 through 127, and -128 through -101 are used to float the  motor.
 * @param left_power: the power to assign to the left motor (between -100 and 100)
 * @param right_power: the power to assign to the right motor (between -100 and 100)
 */

function motorPowerAssignBoth(left_power: number, right_power: number) {
    let buf = pins.createBuffer(3)
    buf.setNumber(NumberFormat.UInt8BE, 0, gigglebotI2CCommands.SET_MOTOR_POWERS)
    buf.setNumber(NumberFormat.UInt8BE, 1, right_power)
    buf.setNumber(NumberFormat.UInt8BE, 2, left_power)
    pins.i2cWriteBuffer(ADDR, buf, false);
}

function stop() {
    dir = 0
    motorPowerAssignBoth(0, 0);
}

function setMotors() {
    lft_motor = bwd_fwd * 10
    rgt_motor = bwd_fwd * 10
    if (lft == 1) {
        lft_motor = rgt_motor * ((10 + lft_rgt) / 10)
        if (lft_rgt < -8) {
            lft_motor = dir * (Math.abs(lft_rgt) - 8) * -30
        }
    } else if (rgt == 1) {
        rgt_motor = lft_motor * ((10 - lft_rgt) / 10)
        if (lft_rgt > 8) {
            rgt_motor = dir * (lft_rgt - 8) * -30
        }
    }

    motorPowerAssignBoth(lft_motor, rgt_motor)
}

function onTouchpadMotionEvent() {
    // value[0] -ve=back +ve=forwards range:0-10
    //                                      0=no movement forwards or backwards
    //                                      1 to 10=forward speed (1=slowest, 10=fastest), -1 to -10 backwards
    // value[1] -ve=left +ve=right    range:0-10
    //                                      0-2=no movement left or right (deliberately less sensitive than fwd/bwd control)
    //                                      +/- 3-8 gradually increasing turn
    //                                      +/- 9-10 sharp turn
    let bufr = pins.createBuffer(2);
    bwd_fwd = (control.eventValue() & 0x00ff);
    lft_rgt = ((control.eventValue() & 0xff00) >> 8);

    bufr.setNumber(NumberFormat.Int8LE, 0, bwd_fwd);
    bufr.setNumber(NumberFormat.Int8LE, 1, lft_rgt);

    bwd_fwd = bufr.getNumber(NumberFormat.Int8LE, 0);
    lft_rgt = bufr.getNumber(NumberFormat.Int8LE, 1)

    if (bwd_fwd == 0 && lft_rgt == 0) {
        return;
    }

    dir = 0;
    lft = 0;
    rgt = 0;

    if (bwd_fwd > 0) {
        dir = 1;
    }
    if (bwd_fwd < 0) {
        dir = -1;
    }
    if (lft_rgt < -2) {
        lft = 1;
        rgt = 0;
    }
    if (lft_rgt > 2) {
        rgt = 1;
        lft = 0;
    }

    setMotors();
    setDirectionIndicators();
}

function touchpadControl() {
    let ctrl1 = control.eventValue() & 0xFF;
    let ctrl2 = control.eventValue() >> 8;

    if (ctrl1 == 0 && ctrl2 == 1) {
        setIndicatorActivated();
        return;
    }

    if (ctrl1 == 0 && ctrl2 == 0) {
        bwd_fwd = 0;
        lft_rgt = 0;
        lft = 0;
        rgt = 0;
        stop();
        basic.clearScreen()
        return;
    }
}

function setDirectionIndicators() {

    basic.clearScreen()

    if (dir == 1) {
        led.plot(2, 0);
        led.plot(2, 1);
    }

    if (dir == -1) {
        led.plot(2, 3);
        led.plot(2, 4);
    }

    if (lft > 0) {
        led.plot(0, 2);
        led.plot(1, 2);
    }

    if (rgt > 0) {
        led.plot(4, 2);
        led.plot(3, 2);
    }
}

function setConnectedIndicator() {
    if (connected == 1) {
        basic.showString("C")
    } else {
        basic.showString("D")
    }
}
TOUCHPAD_MOTION = 9011
TOUCHPAD_CONTROL = 9012
lft_rgt = 0
bwd_fwd = 0
lft_motor = 0;
rgt_motor = 0;
connected = 0
lft = 0
rgt = 0
dir = 0
basic.showString("BC-NP TP")
control.onEvent(TOUCHPAD_CONTROL, 0, touchpadControl)
control.onEvent(TOUCHPAD_MOTION, EventBusValue.MICROBIT_EVT_ANY, onTouchpadMotionEvent)