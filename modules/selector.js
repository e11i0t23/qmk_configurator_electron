const { dfuProgrammerFlash } = require("./programmers/dfu-programmer");
const usb = require("usb");

const deviceIDs = {
  1003: "dfu-programmer",
  9025: "avrdude",
  6991: "avrdude",
  9114: "avrdude",
  1155: "dfu-util"
};

function routes(keyboard) {
  /* IMPLEMENTED FOR FUTURE CHECKING WITH API TO CHECK DEVICE
  fetch("http://api.qmk.fm/v1/keyboards/" + keyboard)
    .then(res => res.json())
    .then(data => console.log(data.keyboards[keyboard]))
    .catch(err => console.error(err));
  */

  for (let device of usb.getDeviceList()) {
    vendorID = device.deviceDescriptor.idVendor.toString();
    if (Object.keys(deviceIDs).includes(vendorID)) {
      console.log("found device");
      programmer = deviceIDs[vendorID];
      switch (programmer) {
        case "dfu-programmer":
          dfuProgrammerFlash();
          break;
        case "avrdude":
          window.Bridge.statusAppend("not implemented yet");
        case "dfu-util":
          window.Bridge.statusAppend("not implemented yet");
        default:
          window.Bridge.statusAppend("Programmer not yet implemented for this device");
          break;
      }
      break;
    }
  }
}

module.exports = { routes };
