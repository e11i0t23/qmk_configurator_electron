import * as path from 'path';
import * as util from 'util';
import * as childProcess from 'child_process';
const exec = util.promisify(childProcess.exec);
import * as prompt from 'electron-prompt';
import log from 'electron-log';

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

let dfuProgrammer;

if (process.platform == 'win32') {
  dfuProgrammer = path.resolve('programmers', './dfu-programmer.exe');
} else if (process.platform == 'darwin') {
  dfuProgrammer = path.resolve('programmers', './dfu-programmer');
} else {
  dfuProgrammer = 'dfu-programmer';
}
log.info('DFU programmer is', dfuProgrammer);

/**
 * Erase data from mcu
 * @return {Promise} reject - erase failed
 * @return {Promise} resolve - successfully erased mcu
 * @module programmers/dfuProgrammer
 */
function eraseChip(device) {
  return new Promise(async (resolve, reject) => {
    let command = '';
    if (process.platform == `win32`) {
      command = `${dfuProgrammer} ${device} erase --force`;
    } else {
      command = `${dfuProgrammer} ${device} erase`;
    }
    const regex = /.*Success.*\r?|\rChecking memory from .* Empty.*/;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(` ${stderr}`);
    if (
      regex.test(stderr) ||
      stderr.includes('Chip already blank') ||
      stderr == ''
    ) {
      resolve(true);
    } else {
      window.Bridge.statusAppend('Erase Failed');
      reject(new Error('Erase Failed'));
    }
  });
}

/**
 * Flash hex to mcu
 * @return {Promise} reject - flash failed
 * @return {Promise} resolve - successfully flashed mcu
 * @module programmers/dfuProgrammer
 */
function flashChip(device) {
  return new Promise(async (resolve, reject) => {
    const command = `${dfuProgrammer} ${device} flash ${window.inputPath}`;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(` ${stderr}`);
    if (
      stderr.includes('Validating...  Success') ||
      stderr.includes(' bytes used (')
    ) {
      resolve(true);
    } else {
      window.Bridge.statusAppend('Flashing Failed');
      reject(new Error('Flash Failed'));
    }
  });
}

/**
 * reset chip
 * @return {Promise} reject - reset failed
 * @return {Promise} resolve - successfully reset mcu
 * @see  programmers/dfuProgrammer
 */
function resetChip(device) {
  return new Promise(async (resolve, reject) => {
    const command = `${dfuProgrammer} ${device} reset`;
    const {stderr} = await exec(command);
    window.Bridge.statusAppend(` ${stderr}`);
    if (stderr === '') resolve(true);
    else {
      window.Bridge.statusAppend('Reset Failed');
      reject(new Error('Reset Failed'));
    }
  });
}

/**
 * handler
 * @param {string} productID
 * @param {string} _processor processor submitted from api
 * @module programmers/dfuProgrammer
 */
async function handler(productID, _processor) {
  console.log('processor: ', _processor);
  let found = false;
  if (Object.keys(atmelDevices).includes(productID)) {
    const searchList = atmelDevices[productID];
    console.log(searchList);
    for (let i = 0; i < searchList.length; i++) {
      const dev = searchList[i];
      if (_processor === dev && found === false) {
        const DFUdevice = _processor;
        found = true;
        window.Bridge.statusAppend(`Found USB Device ${DFUdevice}`);
        try {
          await eraseChip(DFUdevice);
          console.log('erased device');
          await flashChip(DFUdevice);
          console.log('flashed device');
          await resetChip(DFUdevice);
          console.log(`flashing finished`);
        } catch (err) {
          window.Bridge.statusAppend(`  Error Flashing ${err}`);
          return err;
        }
        window.Bridge.statusAppend('  Successfully Flashed Keymap onto device');
      } else if (i === searchList.length - 1) {
        if (!found) {
          window.Bridge.statusAppend(
            'Please connect the Keyboard and press reset'
          );
        }
      }
    }
  }
}

/**
 * Processing unit for flashing with dfu programmer
 * @param {hexidecimal} productID usb PID for atmel device
 * @param {string} processor processor submitted from api
 * @module programmers/dfuProgrammer
 */
export function dfuProgrammerFlash(productID, processor) {
  if (processor) {
    handler(productID, processor);
  } else {
    prompt(
      {
        title: 'Processor',
        label: 'Please submit processor',
        height: 150,
        value: 'atmega32u4',
      },
      process.win
    )
      .then((r) => {
        if (r === null) {
          window.Bridge.statusAppend('No selection made flashing cancelled');
        } else {
          handler(productID, r);
        }
      })
      .catch(log.error);
  }
}
