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
let pin16 = 0
let pin12 = 0
let pin8 = 0
let drive = 0
let pin0 = 0
bluetooth.onBluetoothConnected(() => {
    pin0 = 0
    pin8 = 0
    pin12 = 0
    pin16 = 0
    drive = 0
    basic.showString("C")
})
bluetooth.onBluetoothDisconnected(() => {
    drive = 0
    basic.showString("D")
})
control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MICROBIT_EVT_ANY, () => {
    if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_DOWN) {
        pin0 = 0
        pin8 = 0
        pin12 = 1
        pin16 = 1
        drive = 1
    } else {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_DOWN) {
            pin0 = 1
            pin8 = 1
            pin12 = 0
            pin16 = 0
            drive = 2
            fwd = 0
            bwd = 1
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_UP) {
                pin0 = 0
                pin8 = 0
                pin12 = 0
                pin16 = 0
                drive = 0
            } else {

            }
        }
    }
    if (drive > 0) {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_DOWN) {
            if (drive == 1) {
                pin0 = 0
                pin8 = 0
                pin12 = 1
                pin16 = 0
            } else {
                pin0 = 0
                pin8 = 1
                pin12 = 0
                pin16 = 0
            }
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_DOWN) {
                if (drive == 1) {
                    pin0 = 0
                    pin8 = 0
                    pin12 = 0
                    pin16 = 1
                } else {
                    pin0 = 1
                    pin8 = 0
                    pin12 = 0
                    pin16 = 0
                }
            } else {
                if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_UP) {
                    if (drive == 1) {
                        pin0 = 0
                        pin8 = 0
                        pin12 = 1
                        pin16 = 1
                        drive = 1
                    } else {
                        pin0 = 1
                        pin8 = 1
                        pin12 = 0
                        pin16 = 0
                        drive = 2
                    }
                } else {

                }
            }
        }
    }
    if (drive == 0) {
        basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
    }
    if (drive == 1) {
        basic.showLeds(`
            . . # . .
            . . # . .
            . . . . .
            . . . . .
            . . . . .
            `)
    }
    if (drive == 2) {
        basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . # . .
            . . # . .
            `)
    }
    serial.writeValue("p0", pin0)
    serial.writeValue("p8", pin8)
    serial.writeValue("p12", pin12)
    serial.writeValue("p16", pin16)
    pins.digitalWritePin(DigitalPin.P0, pin0)
    pins.digitalWritePin(DigitalPin.P8, pin8)
    pins.digitalWritePin(DigitalPin.P12, pin12)
    pins.digitalWritePin(DigitalPin.P16, pin16)
})
pin0 = 0
pin8 = 0
drive = 0
pin12 = 0
pin16 = 0
basic.showString("BC-JW")