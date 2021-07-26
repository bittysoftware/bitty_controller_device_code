function fwdLeft () {
    motorPowerAssignBoth(0, gigglebotWhichSpeed.Fastest)
}
function fwd () {
    motorPowerAssignBoth(gigglebotWhichSpeed.Fastest, gigglebotWhichSpeed.Fastest)
}
// Assigns potentially different powers to both motors in one call.
// Values from 101 through 127, and -128 through -101 are used to float the  motor.
// @param left_power: the power to assign to the left motor (between -100 and 100)
// @param right_power: the power to assign to the right motor (between -100 and 100)
function motorPowerAssignBoth (left_power: number, right_power: number) {
    let buf = pins.createBuffer(3)
buf.setNumber(NumberFormat.UInt8BE, 0, gigglebotI2CCommands.SET_MOTOR_POWERS)
buf.setNumber(NumberFormat.UInt8BE, 1, right_power)
buf.setNumber(NumberFormat.UInt8BE, 2, left_power)
pins.i2cWriteBuffer(ADDR, buf, false);
}
bluetooth.onBluetoothConnected(function () {
    drive = 0
    basic.showString("C")
})
function stop () {
    motorPowerAssignBoth(0, 0)
}
bluetooth.onBluetoothDisconnected(function () {
    drive = 0
    stop()
    basic.showString("D")
})
function bwdRight () {
    motorPowerAssignBoth(-1 * gigglebotWhichSpeed.Fastest, 0)
}
function fwdRight () {
    motorPowerAssignBoth(gigglebotWhichSpeed.Fastest, 0)
}
function bwd () {
    motorPowerAssignBoth(-1 * gigglebotWhichSpeed.Fastest, -1 * gigglebotWhichSpeed.Fastest)
}
function bwdLeft () {
    motorPowerAssignBoth(0, -1 * gigglebotWhichSpeed.Fastest)
}
function eyesOn() {
    pins.digitalWritePin(DigitalPin.P0, 1)
    pins.digitalWritePin(DigitalPin.P1, 1)
}

function eyesOff() {
    pins.digitalWritePin(DigitalPin.P0, 0)
    pins.digitalWritePin(DigitalPin.P1, 0)
}

function shakeHead() {
    for (let i = 0; i < 2; i++) {
        gigglebot.servoMove(gigglebotServoAction.Right, 15)
        basic.pause(300)
        gigglebot.servoMove(gigglebotServoAction.Right, 75)
        basic.pause(300)
    }
    gigglebot.servoMove(gigglebotServoAction.Right, 45)
}

function wagTail() {
    for (let i = 0; i < 12; i++) {
        gigglebot.servoMove(gigglebotServoAction.Left, 60)
        basic.pause(200)
        gigglebot.servoMove(gigglebotServoAction.Left, 30)
        basic.pause(200)
    }
    gigglebot.servoMove(gigglebotServoAction.Left, 45)
}

control.onEvent(EventBusSource.MES_DPAD_CONTROLLER_ID, EventBusValue.MICROBIT_EVT_ANY, function () {
    switch (control.eventValue()) {
        case EventBusValue.MES_DPAD_BUTTON_4_DOWN:        
        case EventBusValue.MES_DPAD_BUTTON_3_DOWN:
            wagTail()
            return
        case EventBusValue.MES_DPAD_BUTTON_A_DOWN:
            eyesOn()
            return
        case EventBusValue.MES_DPAD_BUTTON_B_DOWN:
            eyesOff()
            return
    }

    lft = 0
    rgt = 0
    if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_DOWN) {
        drive = 1
    } else {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_DOWN) {
            drive = 2
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_1_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_2_UP) {
                drive = 0
            }
        }
    }
    if (drive > 0) {
        if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_DOWN) {
            if (drive == 1) {
                lft = 1
            } else {
                rgt = 1
            }
        } else {
            if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_DOWN) {
                if (drive == 1) {
                    rgt = 1
                } else {
                    lft = 1
                }
            } else {
                if (control.eventValue() == EventBusValue.MES_DPAD_BUTTON_C_UP || control.eventValue() == EventBusValue.MES_DPAD_BUTTON_D_UP) {
                    lft = 0
                    rgt = 0
                }
            }
        }
    }
    if (drive == 0) {
        stop()
        basic.showLeds(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
    }
    if (drive == 1) {
        if (lft == 0 && rgt == 0) {
            fwd()
            basic.showLeds(`
                . . # . .
                . . # . .
                . . . . .
                . . . . .
                . . . . .
                `)
        } else if (lft == 1) {
            fwdLeft()
            basic.showLeds(`
                # # # . .
                . . # . .
                . . # . .
                . . . . .
                . . . . .
                `)
        } else {
            fwdRight()
            basic.showLeds(`
                . . # # #
                . . # . .
                . . # . .
                . . . . .
                . . . . .
                `)
        }
    }
    if (drive == 2) {
        if (lft == 0 && rgt == 0) {
            bwd()
            basic.showLeds(`
                . . . . .
                . . . . .
                . . . . .
                . . # . .
                . . # . .
                `)
        } else if (rgt == 1) {
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
    }
})
let rgt = 0
let lft = 0
let drive = 0
let ADDR = 4
basic.showString("GB")
