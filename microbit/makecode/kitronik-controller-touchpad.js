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

let lft = 0
let rgt = 0
let bwd_fwd = 0
let lft_rgt = 0
let bwd_fwd_lvl = 0
let lft_rgt_lvl = 0
let CONTROL_TARGET_1_OFF = 0
let CONTROL_TARGET_1_ON = 0
let OTHER_CONTROL = 0
let TOUCHPAD_CONTROL = 0
let TOUCHPAD_MOTION = 0
let p0_val = 0
let p8_val = 0
let p12_val = 0
let p16_val = 0
let drive = 0
let bwd = 0
let analog = 0
let fwd = 0
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

function resetPinValues() {
    p0_val = 0
    p8_val = 0
    p12_val = 0
    p16_val = 0
}

function stop() {
    fwd = 0
    bwd = 0
    resetPinValues()
    drive = 0
}

function writePinsAnalog() {
    resetPinValues();
    if (fwd == 1) {
        p12_val = bwd_fwd_lvl * 102
        p16_val = bwd_fwd_lvl * 102
        if (lft == 1) {
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2) {
                p12_val = bwd_fwd_lvl * 102
                p16_val = p12_val * (10 + lft_rgt_lvl) / 10
            } else {
                p12_val = bwd_fwd_lvl * 102
                p16_val = 0
                p0_val = p12_val * (-8 - lft_rgt_lvl) / 2
            }
        } else if (rgt == 1) {
            if (lft_rgt_lvl < 9) {
                p16_val = bwd_fwd_lvl * 102
                p12_val = p16_val * (10 - lft_rgt_lvl) / 10
            } else {
                p16_val = bwd_fwd_lvl * 102
                p12_val = 0
                p8_val = p16_val * (lft_rgt_lvl - 8) / 2
            }
        } else if (lft == 0 && rgt == 0) {}
    }
    if (bwd == 1) {
        p0_val = bwd_fwd_lvl * -102
        p8_val = bwd_fwd_lvl * -102
        if (lft == 1) {
            if (lft_rgt_lvl > -9 && lft_rgt_lvl < -2) {
                p8_val = bwd_fwd_lvl * -102
                p0_val = p8_val * (10 + lft_rgt_lvl) / 10
            } else {
                p8_val = bwd_fwd_lvl * -102
                p0_val = 0
                p16_val = p8_val * (-8 - lft_rgt_lvl) / 2
            }
        } else if (rgt == 1) {
            if (lft_rgt_lvl < 9) {
                p0_val = bwd_fwd_lvl * -102
                p8_val = p0_val * (10 - lft_rgt_lvl) / 10
            } else {
                p0_val = bwd_fwd_lvl * -102
                p8_val = 0
                p12_val = p0_val * (lft_rgt_lvl - 8) / 2
            }
        } else if (lft == 0 && rgt == 0) {}
    }
    pins.analogWritePin(AnalogPin.P0, Math.floor(p0_val))
    pins.analogWritePin(AnalogPin.P8, Math.floor(p8_val))
    pins.analogWritePin(AnalogPin.P12, Math.floor(p12_val))
    pins.analogWritePin(AnalogPin.P16, Math.floor(p16_val))
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

    fwd = 0;
    bwd = 0;
    lft = 0;
    rgt = 0;

    if (bwd_fwd > 0) {
        fwd = 1;
        bwd = 0;
        bwd_fwd_lvl = bwd_fwd;
    }
    if (bwd_fwd < 0) {
        bwd = 1;
        fwd = 0;
        bwd_fwd_lvl = bwd_fwd;
    }
    if (lft_rgt < -2) {
        lft = 1;
        rgt = 0;
        lft_rgt_lvl = lft_rgt;
    }
    if (lft_rgt > 2) {
        rgt = 1;
        lft = 0;
        lft_rgt_lvl = lft_rgt;
    }

    setDirectionIndicators();
    writePinsAnalog();
}

function setDeactivated() {
    basic.clearScreen()
    pins.analogWritePin(AnalogPin.P0, 0)
    pins.analogWritePin(AnalogPin.P8, 0)
    pins.analogWritePin(AnalogPin.P12, 0)
    pins.analogWritePin(AnalogPin.P16, 0)
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
        writePinsAnalog();
        setDeactivated();
        return;
    }
}

function setDirectionIndicators() {

    basic.clearScreen()

    if (fwd > 0) {
        led.plot(2, 0);
        led.plot(2, 1);
    }

    if (bwd > 0) {
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

p0_val = 0
p8_val = 0
p12_val = 0
p16_val = 0
TOUCHPAD_MOTION = 9011
TOUCHPAD_CONTROL = 9012
TOUCHPAD_MOTION = 9011
TOUCHPAD_CONTROL = 9012
OTHER_CONTROL = 9013
CONTROL_TARGET_1_ON = 1
CONTROL_TARGET_1_OFF = 2
drive = 0
lft_rgt_lvl = 0
bwd_fwd_lvl = 0
lft_rgt = 0
bwd_fwd = 0
connected = 0
rgt = 0
lft = 0
bwd = 0
fwd = 0
basic.showString("BC-NP TP")
control.onEvent(TOUCHPAD_CONTROL, 0, touchpadControl)
control.onEvent(TOUCHPAD_MOTION, EventBusValue.MICROBIT_EVT_ANY, onTouchpadMotionEvent)