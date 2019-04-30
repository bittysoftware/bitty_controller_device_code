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

let param2 = 0
let param1 = 0
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
let temperature = 0
let p12_val = 0
let pin12 = 0
let light_right = 0
let p8_val = 0
let pin1 = 0
let light_left = 0
let p1_val = 0
let digital_sensor_value = 0
let drive = 0
let pin8 = 0
let line_right = 0
let SENSOR_VALUE = 0
let the_sensor_value = 0
let p0_val = 0
let bwd = 0
let pin0 = 0
let line_left = 0
let analog = 0
let fwd = 0
let sampling_sensors = 0
let ev = 0
let connected = 0
bluetooth.onBluetoothDisconnected(function () {
    connected = 0
    setConnectedIndicator2()
})
bluetooth.onBluetoothConnected(function () {
    connected = 1
    setConnectedIndicator2()
})

function transmitSensorValue2() {
    // bits 0-9 contain value. Bits 10-12 contain a sensor
    // no.
    ev = (sensor_no << 10) + the_sensor_value
    control.raiseEvent(
        SENSOR_VALUE,
        ev
    )
}

function sampleSensors2() {
    sampling_sensors = 1
    line_left = 0
    line_right = 0
    light_left = 0
    light_right = 0
    temperature = 0
    while (sampling_sensors == 1) {
        // line following sensors
        line_left = pins.digitalReadPin(DigitalPin.P11)
        line_right = pins.digitalReadPin(DigitalPin.P5)
        // select the left light sensor to read from
        pins.digitalWritePin(DigitalPin.P16, 0)
        // read the sensor value
        light_left = pins.analogReadPin(AnalogPin.P2)
        // select the right light sensor to read from
        pins.digitalWritePin(DigitalPin.P16, 1)
        // read the sensor value
        light_right = pins.analogReadPin(AnalogPin.P2)
        // read the internal thermometer
        temperature = input.temperature()
        // assume min temperature of -20 and max of +40
        // (adjust to suit your purposes) and transform to the
        // required range of 0-1023 range is 60
        temperature = Math.round((temperature + 20) / 60 * 1023)
        // transmit events over Bluetooth
        sensor_no = 1
        digital_sensor_value = line_left
        getInvertedAnalogEquivalentValue2()
        the_sensor_value = analog
        transmitSensorValue2()
        sensor_no = 2
        digital_sensor_value = line_right
        getInvertedAnalogEquivalentValue2()
        the_sensor_value = analog
        transmitSensorValue2()
        sensor_no = 3
        the_sensor_value = light_left
        transmitSensorValue2()
        sensor_no = 4
        the_sensor_value = light_right
        transmitSensorValue2()
        sensor_no = 5
        the_sensor_value = temperature
        transmitSensorValue2()
        basic.pause(250)
    }
}

function setConnectedIndicator2() {
    if (connected == 1) {
        basic.showString("C")
    } else {
        basic.showString("D")
    }
}

function writePinsDigital2() {
    pins.digitalWritePin(DigitalPin.P0, pin0)
    pins.digitalWritePin(DigitalPin.P8, pin8)
    pins.digitalWritePin(DigitalPin.P1, pin1)
    pins.digitalWritePin(DigitalPin.P12, pin12)
}
// function resetPinValues() { pin0 = 0 pin8 = 0 pin1
// = 0 pin12 = 0 }
function stop2() {
    fwd = 0
    bwd = 0
    // resetPinValues()
    drive = 0
}

function getAnalogEquivalentValue2() {
    if (digital_sensor_value == 1) {
        analog = 1023
    }
}

function getInvertedAnalogEquivalentValue2() {
    analog = 0
    if (digital_sensor_value == 0) {
        analog = 1023
    }
}
let sensor_no = 0
let SAMPLING_START = 0
p0_val = 0
p1_val = 0
p8_val = 0
p12_val = 0
TOUCHPAD_MOTION = 9011
TOUCHPAD_CONTROL = 9012
TOUCHPAD_MOTION = 9011
TOUCHPAD_CONTROL = 9012
OTHER_CONTROL = 9013
SENSOR_VALUE = 9014
SAMPLING_START = 9015
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
pin12 = 0
pin1 = 0
pin8 = 0
pin0 = 0
sampling_sensors = 0
basic.showString("BC-NP ETP")
control.onEvent(SAMPLING_START, 0, sampleSensors2)