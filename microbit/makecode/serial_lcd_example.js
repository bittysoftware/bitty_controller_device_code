let col = 0
let row = 0
function move_cursor() {
    cmd0 = 254
    cmd1 = 128
    if (row == 1) {
        cmd1 += 64
    }
    cmd1 = cmd1 + col
    let bufr = pins.createBuffer(2);
bufr.setNumber(NumberFormat.Int8LE, 0, cmd0);
bufr.setNumber(NumberFormat.Int8LE, 1, cmd1);
serial.writeBuffer(bufr)
    basic.pause(10)
}
function clear() {
    cmd0 = 254
    cmd1 = 1
    let bufr2 = pins.createBuffer(2);
bufr2.setNumber(NumberFormat.Int8LE, 0, cmd0);
bufr2.setNumber(NumberFormat.Int8LE, 1, cmd1);
serial.writeBuffer(bufr2)
    basic.pause(10)
}
input.onButtonPressed(Button.A, function () {
    clear()
    row = 0
    col = 0
    move_cursor()
    serial.writeString("BITTY")
    basic.pause(1000)
})
input.onButtonPressed(Button.B, function () {
    row = 1
    col = 0
    move_cursor()
    serial.writeString("SOFTWARE")
    basic.pause(1000)
})
let cmd0 = 0
let cmd1 = 0
serial.redirect(
SerialPin.P0,
SerialPin.P1,
BaudRate.BaudRate9600
)