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
let SENSOR_VALUE = 0
let SAMPLING_START = 0

let ev = 0
let connected = 0

let the_sensor_value = 0
let sampling_sensors = 0
let sensor_no = 0
let analog = 0
let digital_sensor_value = 0
let light_right = 0
let light_left = 0
let line_right = 0
let line_left = 0
let temperature = 0

function getInvertedAnalogEquivalentValue() {
    analog = 0
    if (digital_sensor_value == 0) {
        analog = 1023
    }
}

function transmitSensorValue() {
    // bits 0-9 contain value. Bits 10-12 contain a sensor
    // no.
    ev = (sensor_no << 10) + the_sensor_value
    control.raiseEvent(
        SENSOR_VALUE,
        ev
    )
}

function sampleSensors() {
    sampling_sensors = 1
    line_left = 0
    line_right = 0
    light_left = 0
    light_right = 0
    temperature = 0
    while (sampling_sensors == 1) {
        // line following sensors
        let lfs = gigglebot.lineSensorsRaw()
        line_left = lfs[0]
        line_right = lfs[1]
        // light sensors
        light_left = gigglebot.lightReadSensor(gigglebotWhichTurnDirection.Left)
        light_right = gigglebot.lightReadSensor(gigglebotWhichTurnDirection.Right)

        // read the internal thermometer
        temperature = input.temperature()
        // assume min temperature of -20 and max of +40
        // (adjust to suit your purposes) and transform to the
        // required range of 0-1023 range is 60
        temperature = Math.round((temperature + 20) / 60 * 1023)
        // transmit events over Bluetooth
        sensor_no = 1
        digital_sensor_value = line_left
        getInvertedAnalogEquivalentValue()
        the_sensor_value = analog
        transmitSensorValue()
        sensor_no = 2
        digital_sensor_value = line_right
        getInvertedAnalogEquivalentValue()
        the_sensor_value = analog
        transmitSensorValue()
        sensor_no = 3
        the_sensor_value = light_left
        transmitSensorValue()
        sensor_no = 4
        the_sensor_value = light_right
        transmitSensorValue()
        sensor_no = 5
        the_sensor_value = temperature
        transmitSensorValue()
        basic.pause(250)
    }
}

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

function stop() {
    dir = 0
    gigglebot.motorPowerAssignBoth(0, 0)
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
    gigglebot.motorPowerAssignBoth(lft_motor, rgt_motor)
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
SENSOR_VALUE = 9014
SAMPLING_START = 9015

lft_rgt = 0
bwd_fwd = 0
lft_motor = 0;
rgt_motor = 0;
connected = 0
lft = 0
rgt = 0
dir = 0
the_sensor_value = 0
sampling_sensors = 0
sensor_no = 0

basic.showString("BC-NP ETP")
control.onEvent(TOUCHPAD_CONTROL, 0, touchpadControl)
control.onEvent(TOUCHPAD_MOTION, EventBusValue.MICROBIT_EVT_ANY, onTouchpadMotionEvent)
control.onEvent(SAMPLING_START, 0, sampleSensors)