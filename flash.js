const temp = require("temp");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const https = require("https");
const usb = require("usb");
//const usbDevices = require('./usbDevices')

const usbDevices = {
  1003: {
    // Atmel Corp., list sourced from http://www.linux-usb.org/usb.ids
    12270: ["atmega8u2"],
    12271: ["atmega16u2"],
    12272: ["atmega32u2"],
    12273: ["at32uc3a3"],
    12275: ["atmega16u4"],
    12276: ["atmega32u4"],
    12278: ["at32uc3b0", "at32uc3b1"],
    12279: ["at90usb82"],
    12280: ["at32uc3a0", "at32uc3a1"],
    12281: ["at90usb646"],
    12282: ["at90usb162"],
    12283: ["at90usb1286", "at90usb1287"],
    12285: ["at89c5130", "at89c5131"],
    12287: ["at89c5132", "at89c5snd1c"]
  }
};

temp.track();

var dfuProgrammer = path.resolve("dfu", "./dfu-programmer");

if (process.platform == "win32") {
  dfuProgrammer = dfuProgrammer + ".exe";
  console.log(dfuProgrammer);
}

function flashURL(url, keyboard, filename) {
  console.log(url, keyboard, filename);
  temp.mkdir("qmkconfigurator", function(err, dirPath) {
    inputPath = path.join(dirPath, filename);
    file = fs.createWriteStream(inputPath);
    var request = https
      .get(url, function(response) {
        response.pipe(file);
        file.on("finish", function() {
          file.close(); // close() is async, call cb after close completes.
          console.log(inputPath);
          checkForBoard(inputPath);
        });
      })
      .on("error", function(err) {
        // Handle errors
        fs.unlink(imputPath); // Delete the file async. (But we don't check the result)
      });
  });
}

module.exports = {
  flashURL
};

function checkForBoard(inputPath) {
  dfu_device = null;
  for (let device of usb.getDeviceList()) {
    if (
      usbDevices.hasOwnProperty(device.deviceDescriptor.idVendor) &&
      usbDevices[device.deviceDescriptor.idVendor].hasOwnProperty(
        device.deviceDescriptor.idProduct
      )
    ) {
      dfu_device =
        usbDevices[device.deviceDescriptor.idVendor][
          device.deviceDescriptor.idProduct
        ];
      console.log("Found atmel device: " + dfu_device[0]);
      console.log(device);
      sendHex(dfu_device, inputPath, function(success) {
        if (success) {
          //window.Bridge.statusAppend("Flash Sucessful")
        }
      });
      break; // First match wins for now
    }
  }
}

function sendHex(dfu_device, file, callback) {
  eraseChip(dfu_device, function(success) {
    if (success) {
      flashChip(dfu_device, file, function(success) {
        if (success) {
          resetChip(dfu_device, function(success) {
            if (success) {
              callback(true);
            } else {
              console.log("Error resetting chip, see status window.");
              callback(false);
            }
          });
        } else {
          console.log("Error resetting chip, memory/other.");
          callback(false);
        }
      });
    } else {
      console.log("Error resetting chip, no device/other.");
      callback(false);
    }
  });
}

function eraseChip(dfu_device, callback) {
  let dfu_args = " " + dfu_device + " erase --force";
  window.Bridge.statusAppend("dfu-programmer" + dfu_args);
  console.log(dfuProgrammer + dfu_args);
  exec(dfuProgrammer + dfu_args, function(error, stdout, stderr) {
    console.log("stdout");
    console.log(stdout);
    window.Bridge.statusAppend(stdout);
    console.log("stderr");
    console.log(stderr);
    window.Bridge.statusAppend(stderr);
    const regex = /.*Success.*\r?\n|\rChecking memory from .* Empty.*/;
    if (regex.test(stderr)) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function flashChip(dfu_device, file, callback) {
  let dfu_args = " " + dfu_device + " flash " + file;
  window.Bridge.statusAppend("dfu-programmer" + dfu_args);
  console.log(dfuProgrammer + dfu_args);
  exec(dfuProgrammer + dfu_args, function(error, stdout, stderr) {
    console.log("stdout");
    console.log(stdout);
    window.Bridge.statusAppend(stdout);
    console.log("stderr");
    console.log(stderr);
    window.Bridge.statusAppend(stderr);
    if (stderr.indexOf("Validating...  Success") > -1) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function resetChip(dfu_device, callback) {
  let dfu_args = " " + dfu_device + " reset";
  window.Bridge.statusAppend("dfu-programmer" + dfu_args);
  console.log(dfuProgrammer + dfu_args);
  exec(dfuProgrammer + dfu_args, function(error, stdout, stderr) {
    console.log("stdout");
    console.log(stdout);
    window.Bridge.statusAppend(stdout);
    console.log("stderr");
    console.log(stderr);
    window.Bridge.statusAppend(stderr);
    if (stderr == "") {
      callback(true);
    } else {
      callback(false);
    }
  });
}
