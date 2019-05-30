const {dfuProgrammerFlash} = require('./programmers/dfu-programmer');
// const {avrFlash} = require('./programmers/caterina');

const usb = require('usb');

const deviceIDs = {
  0x03eb: 'dfu-programmer', // Atmel vendor id
  0x2341: 'avrdude', // Arduino vendor id
  0x1B4F: 'avrdude', // Sparkfun vendor id
  0x239a: 'avrdude', // adafruit vendor id
  1155: 'dfu-util',
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
        case 'avrdude':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nUsing avrgirl to flash caterina');
            // if (vendorID == 0x1B4F) avrFlash('sf-pro-micro');
            // else avrFlash();
          }
          break;
        case 'dfu-util':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('\nnot implemented yet');
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
