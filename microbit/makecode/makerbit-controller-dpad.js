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

let bwd = 0
let fwd = 0
let p11_val = 0
let p12_val = 0
let p13_val = 0
let p14_val = 0
let p15_val = 0
let p16_val = 0
let drive = 0

function resetPinValues() {
    p11_val = 0
    p12_val = 0
    p15_val = 0
    p16_val = 0
}

bluetooth.onBluetoothConnected(() => {
    drive = 0
    resetPinValues();
    basic.showString("C")
})
bluetooth.onBluetoothDisconnected(() => {
    drive = 0
    basic.showString("D")
})

function goFwd() {
    p11_val = 1
    p12_val = 0
    p15_val = 1
    p16_val = 0
}

function goBwd() {
    p11_val = 0
    p12_val = 1
    p15_val = 0
    p16_val = 1
}

control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MICROBIT_EVT_ANY, () => {
    if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_DOWN) {
        goFwd()
        drive = 1
    } else {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_DOWN) {
            goBwd()
            drive = 2
            fwd = 0
            bwd = 1
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_UP) {
                resetPinValues();
                drive = 0
            }
        }
    }
    if (drive > 0) {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_DOWN) {
            p15_val = 0
            p16_val = 0
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_DOWN) {
                p11_val = 0
                p12_val = 0
            } else {
                if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_UP) {
                    if (drive == 1) {
                        goFwd()
                        drive = 1
                    } else {
                        goBwd()
                        drive = 2
                    }
                } else {

                }
            }
        }
    }

    pins.digitalWritePin(DigitalPin.P11, p11_val)
    pins.digitalWritePin(DigitalPin.P12, p12_val)
    pins.digitalWritePin(DigitalPin.P15, p15_val)
    pins.digitalWritePin(DigitalPin.P16, p16_val)
})
p11_val = 0
p12_val = 0
p13_val = 1023
p14_val = 1023
p15_val = 0
p16_val = 0
drive = 0
basic.showString("BC-NP DP")

pins.analogWritePin(AnalogPin.P13, Math.floor(p13_val))
pins.analogWritePin(AnalogPin.P14, Math.floor(p14_val))