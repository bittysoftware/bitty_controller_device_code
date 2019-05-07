# bitty_controller_device_code

Code examples and templates for various microcontrollers for use with the Bitty Controller apps

Bitty Controller is an application for iOS, Android and web (see https://www.bittysoftware.com/bittyweb/) which allows you to remote control maker projects like smart cards, cranes... in fact anything which is connected to a microcontroller or computer which you can program and which supports Bluetooth Low Energy (LE). It has a series of different user interfaces, each one suited to particular types of control scenario. See https://www.bittysoftware.com/apps/bitty_controller.html for more information.

To use Bitty Controller, the microcontroller or computer which is electrically connected to your machine must be running suitable code. You can think of this code as comprising two parts; the first provides an interface via which to communicate with your device over Bluetooth. This is commonly known as a "profile". The second is concerned with whatever you want your machine to do, in response to the various types of interaction over Bluetooth which Bitty Controller might initiate.

Bitty Controller was originally created for BBC micro:bit projects but in fact, you can use it with any microcontroller or computer that supports Bluetooth LE and which you can program to support one of the two supported profiles. To be more technically precise, your device must be able to act as a Bluetooth LE GAP peripheral, with Bitty Controller acting as the GAP central mode device. See http://bluetooth-mdw.blogspot.com/2016/07/microbit-and-bluetooth-roles.html for a brief description of GAP and device roles.

This repository collects together example code for various devices, created using various tools and programming languages. In some cases they are complete solutions for controlling specific types of machine and in other cases the code offers an example or a template into which you can slot your custom code.

PR for new microcontroller types or new controllable products are welcome.

All source code is provided under the MIT licence. See source file header for details.

