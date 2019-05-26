const { dfuProgrammerFlash } = require("./programmers/dfu-programmer");
const usb = require("usb");

const deviceIDs = {
  0x03eb: "dfu-programmer", //Atmel vendor id
  9025: "avrdude", // Arduino vendor id
  6991: "avrdude", //Sparkfun vendor id
  9114: "avrdude", //adafruit vendor id
  1155: "dfu-util"
};

flashing = false;

function routes(keyboard) {
  console.log(keyboard);
  fetch("http://api.qmk.fm/v1/keyboards/" + keyboard)
    .then(res => res.json())
    .then(data => data.keyboards[keyboard].processor)
    .then(processor => {
      flashing = false;
      selector(processor);
      console.log("Auto Flash: ", window.Bridge.autoFlash);
      if (window.Bridge.autoFlash) {
        while (!flashing) {
          setTimeout(selector(processor), 1500);
        }
      }
    })
    .catch(err => console.error(err));
}

module.exports = { routes };

let selector = processor => {
  USBdevices = usb.getDeviceList();
  USBdevicesQTY = USBdevices.length;
  for (let USBdevice of USBdevices) {
    vendorID = USBdevice.deviceDescriptor.idVendor.toString();
    productID = USBdevice.deviceDescriptor.idProduct.toString();
    // Check if known VID for AVR/ARM programmers
    if (Object.keys(deviceIDs).includes(vendorID)) {
      programmer = deviceIDs[vendorID];
      // Forwards onto seperate programming scripts found in ./modules/programmers
      switch (programmer) {
        case "dfu-programmer":
          if (!flashing) {
            window.Bridge.statusAppend("\nUsing DFU-Programmer");
            setTimeout(dfuProgrammerFlash(productID, processor), 500);
            flashing = true;
          }
          break;
        case "avrdude":
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend("\nnot implemented yet");
          }
          break;
        case "dfu-util":
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend("\nnot implemented yet");
          }
          break;
        default:
          window.Bridge.statusAppend(
            "\nProgrammer not yet implemented for this device"
          );
          break;
      }
      break;
    } else if (USBdevice == USBdevices[USBdevicesQTY - 1]) {
      if (!window.Bridge.autoFlash) {
        window.Bridge.statusAppend("\nERROR: No USB Device Found");
      }
    }
  }
};
