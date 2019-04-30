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

#include "MicroBit.h"
#include <stdlib.h>
#include <math.h>

MicroBit uBit;
MicroBitImage pattern(5, 5);

int connected = 0;

void setConnectedIndicator()
{
    if (connected == 1)
    {
        uBit.display.print("C");
    }
    else
    {
        uBit.display.print("D");
    }
}

void onConnected(MicroBitEvent)
{
    connected = 1;
    setConnectedIndicator();
}

void onDisconnected(MicroBitEvent)
{
    connected = 0;
    setConnectedIndicator();
}

void onButton(MicroBitEvent)
{
    uBit.display.scroll(uBit.getName());
}

int main()
{
    // Initialise the micro:bit runtime.
    uBit.init();

    // Bitty Controller Switch Control - No Pairing
    uBit.display.scroll("BC-S-NP");

    new MicroBitIOPinService(*uBit.ble, uBit.io);

    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
    uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);

    uBit.messageBus.listen(MICROBIT_ID_BUTTON_A, MICROBIT_BUTTON_EVT_CLICK, onButton);
    uBit.messageBus.listen(MICROBIT_ID_BUTTON_B, MICROBIT_BUTTON_EVT_CLICK, onButton);

    // If main exits, there may still be other fibers running or registered event handlers etc.
    // Simply release this fiber, which will mean we enter the scheduler. Worse case, we then
    // sit in the idle task forever, in a power efficient sleep.
    release_fiber();
}
