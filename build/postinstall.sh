#!/bin/bash

echo "#UDEV rules for qmk flashing

# Atmel Devices
SUBSYSTEMS=="usb", ATTRS{idVendor}=="03eb", MODE:="0666"

# tmk keyboard products     https://github.com/tmk/tmk_keyboard
SUBSYSTEMS=="usb", ATTRS{idVendor}=="feed", MODE:="0666"

# Input Club keyboard bootloader
SUBSYSTEMS=="usb", ATTRS{idVendor}=="1c11", MODE:="0666"

# ModemManager should ignore the following devices for caterlina
ATTRS{idVendor}=="2a03", ENV{ID_MM_DEVICE_IGNORE}="1"
ATTRS{idVendor}=="2341", ENV{ID_MM_DEVICE_IGNORE}="1"

# stm32duino
SUBSYSTEMS=="usb", ATTRS{idVendor}=="1eaf", ATTRS{idProduct}=="0003", MODE:="0666"
# Generic stm32
SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", MODE:="0666"

# avrisp
SUBSYSTEMS=="usb", ATTRS{idVendor}=="16C0", ATTRS{idProduct}=="0483", MODE:="0666"
# USBasp
SUBSYSTEMS=="usb", ATTRS{idVendor}=="16C0", ATTRS{idProduct}=="05DC", MODE:="0666"

#teensy_loader_cli
ATTRS{idVendor}=="16c0", ATTRS{idProduct}=="04[789B]?", ENV{ID_MM_DEVICE_IGNORE}="1", ENV{ID_MM_PORT_IGNORE}="1"
ATTRS{idVendor}=="16c0", ATTRS{idProduct}=="04[789A]?", ENV{MTP_NO_PROBE}="1"
SUBSYSTEMS=="usb", ATTRS{idVendor}=="16c0", ATTRS{idProduct}=="04[789ABCD]?", MODE:="0666"
KERNEL=="ttyACM*", ATTRS{idVendor}=="16c0", ATTRS{idProduct}=="04[789B]?", MODE:="0666"

#end of current implemented rules
" | tee /etc/udev/rules.d/48-qmk.rules

sed -i 's/--filter-policy=strict/--filter-policy=default/' /lib/systemd/system/ModemManager.service
systemctl daemon-reload
systemctl restart ModemManager
