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

enum gigglebotWhichSpeed {
    //% block="slowest"
    Slowest = 30,
        //% block="slower"
        Slower = 45,
        //% block="normal"
        Normal = 60,
        //% block="faster"
        Faster = 75,
        //% block="fastest"
        Fastest = 90
}

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
let x = 0
let drive = 1

input.onButtonPressed(Button.B, function () {
    x += 1
    if (x == 0) {
        stop()
        basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
    } else if (x == 1) {
        fwd()
        basic.showLeds(`
            . . # . .
            . . # . .
            . . # . .
            . . . . .
            . . . . .
            `)
    } else if (x == 2) {
        fwdLeft()
        basic.showLeds(`
            # # # . .
            . . # . .
            . . # . .
            . . . . .
            . . . . .
            `)
    } else if (x == 3) {
        fwdRight()
        basic.showLeds(`
            . . # # #
            . . # . .
            . . # . .
            . . . . .
            . . . . .
            `)
    } else if (x == 4) {
        bwd()
        basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . # . .
            . . # . .
            `)
    } else if (x == 5) {
        bwdLeft()
        basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . # . .
            # # # . .
            `)
    } else {
        bwdRight()
        basic.showLeds(`
            . . . . .
            . . . . .
            . . # . .
            . . # . .
            . . # # #
            `)
    }
    if (x == 6) {
        x = -1
    }
})
x = 0

function stop() {
    motorPowerAssignBoth(0, 0);
}

function fwd() {
    motorPowerAssignBoth(gigglebotWhichSpeed.Fastest, gigglebotWhichSpeed.Fastest);
}

function fwdLeft() {
    motorPowerAssignBoth(gigglebotWhichSpeed.Fastest, 0);
}

function fwdRight() {
    motorPowerAssignBoth(0, gigglebotWhichSpeed.Fastest);
}

function bwd() {
    motorPowerAssignBoth(-1 * gigglebotWhichSpeed.Fastest, -1 * gigglebotWhichSpeed.Fastest);
}

function bwdLeft() {
    motorPowerAssignBoth(-1 * gigglebotWhichSpeed.Fastest, 0);
}

function bwdRight() {
    motorPowerAssignBoth(0, -1 * gigglebotWhichSpeed.Fastest);
}

/**
 * Assigns potentially different powers to both motors in one call.  
 * Values from 101 through 127, and -128 through -101 are used to float the  motor.
 * @param left_power: the power to assign to the left motor (between -100 and 100)
 * @param right_power: the power to assign to the right motor (between -100 and 100)
 */

function motorPowerAssignBoth(left_power: number, right_power: number) {
    let buf = pins.createBuffer(3)
    // SET_MOTOR_POWERS = 10
    buf.setNumber(NumberFormat.UInt8BE, 0, gigglebotI2CCommands.SET_MOTOR_POWERS)
    buf.setNumber(NumberFormat.UInt8BE, 1, right_power)
    buf.setNumber(NumberFormat.UInt8BE, 2, left_power)
    //     let ADDR = 0x04
    pins.i2cWriteBuffer(ADDR, buf, false);
}