const {dfuProgrammerFlash} = require('./programmers/dfu-programmer');
const {stm32, kiibohd} = require('./programmers/dfu-util');
const {caterina, avrisp, USBtiny, USBasp} = require('./programmers/avrdude');

const usb = require('usb');

const deviceIDs = {
  0x03eb: 'dfu-programmer', // Atmel vendor id
  0x2341: 'caterina', // Arduino vendor id
  0x1B4F: 'caterina', // Sparkfun vendor id
  0x239a: 'caterina', // adafruit vendor id
  0x0483: 'dfu-util',
  0x1C11: 'dfu-util',
  0x16C0: 'avrisp/usbasp',
  0x1781: 'usbtiny',
};

let flashing = false;

/**
 * Calls API for processor the calls selector (repeatedly if autoflash)
 * @param {String} keyboard Takes a keyboard name from configurator
 * @member selector
 */
function routes(keyboard) {
  console.log(keyboard);
  fetch('http://api.qmk.fm/v1/keyboards/' + keyboard)
      .then((res) => res.json())
      .then((data) => data.keyboards[keyboard].processor)
      .then((processor) => {
        flashing = false;
        selector(processor);
        console.log('Auto Flash: ', window.Bridge.autoFlash);
        if (window.Bridge.autoFlash) {
          while (!flashing) {
            setTimeout(selector(processor), 1500);
          }
        }
      })
      .catch((err) => console.error(err));
}

module.exports = {routes};

/**
 * Selects the programmer to use
 * @param {String} processor
 * @module selector
 */
function selector(processor) {
  USBdevices = usb.getDeviceList();
  USBdevicesQTY = USBdevices.length;
  for (const USBdevice of USBdevices) {
    vendorID = USBdevice.deviceDescriptor.idVendor.toString();
    productID = USBdevice.deviceDescriptor.idProduct.toString();
    // Check if known VID for AVR/ARM programmers
    if (Object.keys(deviceIDs).includes(vendorID)) {
      programmer = deviceIDs[vendorID];
      // Forwards onto seperate programming scripts found in ./modules/programmers
      switch (programmer) {
        case 'dfu-programmer':
          if (!flashing) {
            window.Bridge.statusAppend('\nUsing DFU-Programmer');
            setTimeout(dfuProgrammerFlash(productID, processor), 500);
            flashing = true;
          }
          break;
        case 'caterina':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nUsing avrdude to flash caterina');
            mcu = 'm32u4';
            caterina(mcu);
          }
          break;
        case 'avrisp/usbasp':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nUsing avrdude to flash avrisp');
            mcu = 'm32u4';
            if (productID== '0x0483') avrisp(mcu);
            if (productID== '0x05DC') USBasp(mcu);
          }
          break;
        case 'usbtiny':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nUsing avrdude to flash caterina');
            mcu = 'm32u4';
            USBtiny(mcu);
          }
          break;
        case 'dfu-util':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nUsing dfu-util to flash dfu');
            if (vendorID == 0x0483) stm32();
            if (vendorID == 0x1C11) kiibohd();
          }
          break;
        default:
          window.Bridge.statusAppend(
              '\nProgrammer not yet implemented for this device'
          );
          break;
      }
      break;
    } else if (USBdevice == USBdevices[USBdevicesQTY - 1]) {
      if (!window.Bridge.autoFlash) {
        window.Bridge.statusAppend('\nERROR: No USB Device Found');
      }
    }
  }
};
