bluetooth.onBluetoothConnected(function () {
    basic.showString("C")
    basic.pause(1000)
    basic.clearScreen()
})
bluetooth.onBluetoothDisconnected(function () {
    basic.showString("D")
    basic.pause(1000)
    basic.clearScreen()
})
bluetooth.startIOPinService()
pins.digitalWritePin(DigitalPin.P0, 0)
basic.showIcon(IconNames.SmallDiamond)
basic.pause(2000)
basic.clearScreen()
