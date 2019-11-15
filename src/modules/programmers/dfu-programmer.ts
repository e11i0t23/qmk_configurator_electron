import * as path from 'path';
import * as childProcess from 'child_process';
const spawn = childProcess.spawn;
import prompt from 'electron-prompt';
import log from 'electron-log';
import first from 'lodash/first';
import {FlashWriter, Methods} from '../types';
import {newStateMachine} from '../state-machine';

const atmelDevices: Map<number, Array<string>> = new Map([
  [12270, ['atmega8u2']],
  [12271, ['atmega16u2']],
  [12272, ['atmega32u2']],
  [12273, ['at32uc3a3']],
  [12275, ['atmega16u4']],
  [12276, ['atmega32u4']],
  [12278, ['at32uc3b0', 'at32uc3b1']],
  [12279, ['at90usb82']],
  [12280, ['at32uc3a0', 'at32uc3a1']],
  [12281, ['at90usb646']],
  [12282, ['at90usb162']],
  [12283, ['at90usb1286', 'at90usb1287']],
  [12285, ['at89c5130', 'at89c5131']],
  [12287, ['at89c5132', 'at89c5snd1c']],
]);

let dfuProgrammer: string;

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
function eraseChip(device: string): Promise<boolean | Error> {
  return new Promise((resolve, reject) => {
    let command = dfuProgrammer;
    let args = [device, 'erase'];
    if (process.platform === 'win32') {
      args.push('--force');
    }

    const regex = /.*Success.*\r?|\rChecking memory from .* Empty.*/;
    const eraser = spawn(command, args);
    const stderr: string[] = [];

    eraser.stderr.on('data', stderr.push);

    eraser.on('exit', (code /*, signal*/) => {
      const str = stderr.join('');
      if (
        code === 0 ||
        regex.test(str) ||
        str.includes('Chip already blank') ||
        str === ''
      ) {
        resolve(true);
      } else {
        window.Bridge.statusAppend(` ${str}`);
        reject(new Error('Erase Failed'));
      }
    });
  });
}

/**
 * Flash hex to mcu
 * @return {Promise} flash failed resolve or successfully flashed mcu
 * @module programmers/dfuProgrammer
 */
function flashChip(device: string): Promise<boolean | Error> {
  return new Promise((resolve, reject) => {
    const command = dfuProgrammer;
    const args = [device, 'flash', window.inputPath];
    const flasher = spawn(command, args);

    // add a linefeed to console output
    window.Bridge.statusAppend('');

    flasher.stderr.on('data', window.Bridge.statusAppendNoLF);

    flasher.on('exit', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        window.Bridge.statusAppend('Flashing Failed');
        reject(new Error('Flash Failed'));
      }
    });
  });
}

/**
 * reset chip
 * @return {Promise} reject - reset failed
 * @return {Promise} resolve - successfully reset mcu
 * @see  programmers/dfuProgrammer
 */
function resetChip(device: string): Promise<boolean | Error> {
  return new Promise((resolve, reject) => {
    const command: string = dfuProgrammer;
    const args = [device, 'reset'];
    const resetter = spawn(command, args);
    const stderr: string[] = [];

    resetter.stderr.on('data', stderr.push);
    resetter.on('exit', (code) => {
      window.Bridge.statusAppend(` ${stderr.join()}`);
      if (code === 0) {
        resolve(true);
      } else {
        window.Bridge.statusAppend('Reset Failed');
        reject(new Error('Reset Failed'));
      }
    });
  });
}

export class DFUProgrammer {
  constructor(productID: number, processor: string) {
    this.productID = productID;
    this.processor = processor;
  }

  isCompatible(): boolean {
    if (atmelDevices.has(this.productID)) {
      const searchList = atmelDevices.get(this.productID);
      console.log(searchList);
      const index = searchList.findIndex(
        (processorID) => processorID === this.processor
      );
      return index > -1;
    }
    return false;
  }

  methods(): Methods {
    const processor = this.processor;
    const isCompatible = this.isCompatible.bind(this);
    const fw: FlashWriter = {
      validator(): PromiseLike<boolean | Error> {
        return new Promise((resolve, reject) => {
          isCompatible() ? resolve(true) : reject(false);
        })
          .then((r) => {
            window.Bridge.statusAppend(`Found USB Device ${processor}`);
            return r;
          })
          .catch((r) => {
            window.Bridge.statusAppend(
              'Please connect the Keyboard and press reset'
            );
            return r;
          }) as PromiseLike<boolean | Error>;
      },
      eraser(): PromiseLike<boolean | Error> {
        window.Bridge.statusAppend(`Erasing ${processor}`);
        return eraseChip(processor)
          .then((r) => {
            window.Bridge.statusAppend(`Erase Succeeded`);
            return r;
          })
          .catch((r) => {
            window.Bridge.statusAppend('Erase Failed');
            return r;
          });
      },
      flasher(): PromiseLike<boolean | Error> {
        window.Bridge.statusAppend(`Flashing ${processor}`);
        return flashChip(processor)
          .then((r) => {
            window.Bridge.statusAppend(`Flashing Succeeded`);
            return r;
          })
          .catch((r) => {
            window.Bridge.statusAppend('Flashing Failed');
            return r;
          });
      },
      restarter(): PromiseLike<boolean | Error> {
        return resetChip(processor).then(() => {
          window.Bridge.statusAppend(`Restarting Keyboard`);
        }) as PromiseLike<boolean | Error>;
      },
      failer(): PromiseLike<boolean | Error> {
        return new Promise((resolve, reject) => {
          window.Bridge.statusAppend(`Flash Failed. ${this.error}`);
          reject(new Error(this.error));
        });
      },
      succeeder(): PromiseLike<boolean | Error> {
        return new Promise((resolve) => {
          window.Bridge.statusAppend('Flash Succeeded. Enjoy your new keymap');
          resolve(true);
        });
      },
    };
    return {
      ...fw,
    };
  }

  productID: number;
  processor: string;
}

/**
 * Processing unit for flashing with dfu programmer
 * @param {number} productID usb PID for atmel device
 * @param {string} processor processor submitted from api
 * @module programmers/dfuProgrammer
 */
export function dfuProgrammerFlash(productID: number, processor: string): void {
  if (processor) {
    const programmer = new DFUProgrammer(productID, processor);
    const sm = newStateMachine({methods: programmer.methods()});
    sm.ready();
  } else {
    prompt({
      title: 'Processor',
      label: 'Please submit processor',
      height: 150,
      value: first(atmelDevices.get(productID)),
    })
      .then((r: string) => {
        if (r === null) {
          window.Bridge.statusAppend('No selection made flashing cancelled');
        } else {
          const programmer = new DFUProgrammer(productID, r);
          const sm = newStateMachine({methods: programmer.methods()});
          sm.ready();
        }
      })
      .catch(log.error);
  }
}
