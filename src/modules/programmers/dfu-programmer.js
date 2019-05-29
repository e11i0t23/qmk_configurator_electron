const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const atmelDevices = {
  12270: ['atmega8u2'],
  12271: ['atmega16u2'],
  12272: ['atmega32u2'],
  12273: ['at32uc3a3'],
  12275: ['atmega16u4'],
  12276: ['atmega32u4'],
  12278: ['at32uc3b0', 'at32uc3b1'],
  12279: ['at90usb82'],
  12280: ['at32uc3a0', 'at32uc3a1'],
  12281: ['at90usb646'],
  12282: ['at90usb162'],
  12283: ['at90usb1286', 'at90usb1287'],
  12285: ['at89c5130', 'at89c5131'],
  12287: ['at89c5132', 'at89c5snd1c'],
};

let dfuProgrammer = path.resolve('programmers', './dfu-programmer');

if (process.platform == 'win32') {
  dfuProgrammer = dfuProgrammer + '.exe';
  console.log(dfuProgrammer);
}

let DFUdevice = '';

/**
 * Processing unit for flashing with dfu programmer
 * @param {hexidecimal} productID usb PID for atmel device
 * @param {string} processor processor submitted from api
 * @module programmers/dfuProgrammer
 */
function dfuProgrammerFlash(productID, processor) {
  console.log('processor: ', processor);
  found = false;
  if (Object.keys(atmelDevices).includes(productID)) {
    console.log(atmelDevices[productID]);
    for (let i = 0; i < atmelDevices[productID].length; i++) {
      dev = atmelDevices[productID][i];
      if ((processor == dev) & (found == false)) {
        DFUdevice = processor;
        found = true;
        window.Bridge.statusAppend(`Found USB Device ${DFUdevice}`);
        eraseChip().then(() => {
          console.log('errased device');
          flashChip().then(() => {
            console.log('flashed device');
            resetChip().then(() => {
              console.log(`flashing finnished`);
              window.Bridge.statusAppend(
                  '\n \n Successfully Flashed Keymap onto device'
              );
            });
          });
        });
      } else if (i == atmelDevices[productID].length - 1) {
        if (!found) {
          window.Bridge.statusAppend(
              '\nPlease connect the Keyboard and enter reset'
          );
        }
      }
    }
  }
}

module.exports = {
  dfuProgrammerFlash,
};

/**
 * Erase data from mcu
 * @return {Promise} reject - erase failed
 * @return {Promise} resolve - successfully erased mcu
 * @module programmers/dfuProgrammer
 */
function eraseChip() {
  return new Promise(async (resolve, reject) => {
    if (process.platform == `win32`) {
      command = `${dfuProgrammer} ${DFUdevice} erase --force`;
    } else command = `${dfuProgrammer} ${DFUdevice} erase`;
    const regex = /.*Success.*\r?\n|\rChecking memory from .* Empty.*/;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(`\n ${stderr}`);
    if (regex.test(stderr) || stderr.includes('Chip already blank')) {
      resolve(true);
    } else {
      window.Bridge.statusAppend('Erase Failed');
      reject(new Error('Erase Failed'));
    }
  });
};

/**
 * Flash hex to mcu
 * @return {Promise} reject - flash failed
 * @return {Promise} resolve - successfully flashed mcu
 * @module programmers/dfuProgrammer
 */
function flashChip() {
  return new Promise(async (resolve, reject) => {
    command = `${dfuProgrammer} ${DFUdevice} flash ${window.inputPath}`;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(`\n ${stderr}`);
    if (stderr.indexOf('Validating...  Success') > -1) resolve(true);
    else {
      window.Bridge.statusAppend('Flashing Failed');
      reject(new Error('Flash Failed'));
    }
  });
};
/**
 * Reset the mcu
 * @return {Promise} reject - reset failed
 * @return {Promise} resolve - successfully reset mcu
 * @  programmers/dfuProgrammer
 */
function resetChip() {
  return new Promise(async (resolve, reject) => {
    command = `${dfuProgrammer} ${DFUdevice} reset`;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(`\n ${stderr}`);
    if (stderr == '') resolve(true);
    else {
      window.Bridge.statusAppend('Reset Failed');
      reject(new Error('Reset Failed'));
    }
  });
};
