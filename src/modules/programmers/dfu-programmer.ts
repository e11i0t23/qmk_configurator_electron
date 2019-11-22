import * as path from 'path';
import * as childProcess from 'child_process';
const spawn = childProcess.spawn;
import prompt from 'electron-prompt';
import log from 'electron-log';
import first from 'lodash/first';
import {FlashWriter, Methods} from '../types';
import {newStateMachine} from '../state-machine';

import {timeoutBuilder, responseAdapter} from './utils';

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

export class DFUProgrammer {
  constructor(productID: number, processor: string) {
    this.productID = productID;
    this.processor = processor;
  }

  /**
   * Erase data from mcu
   * @return {Promise} reject - erase failed
   * @return {Promise} resolve - successfully erased mcu
   * @module programmers/dfuProgrammer
   */
  eraseChip(device: string): Promise<boolean | Error> {
    const ERASED_NOT_BLANK = 5;
    return new Promise(function eraseChipResolver(resolve, reject) {
      let command = dfuProgrammer;
      let args = [device, 'erase'];
      if (process.platform === 'win32') {
        args.push('--force');
      }

      const stderr: string[] = [];
      const regex = /.*Success.*\r?|\rChecking memory from .* Empty.*/;
      const eraser = spawn(command, args);

      const cancelID = timeoutBuilder(reject, eraser, 'Erase Timedout');

      eraser.stderr.on('data', stderr.push);

      eraser.on('exit', (code: unknown /*, signal*/) => {
        clearTimeout(cancelID);
        const str = stderr.join('');
        if (
          code === 0 ||
          code === ERASED_NOT_BLANK ||
          str === '' ||
          regex.test(str)
        ) {
          resolve(true);
        } else {
          window.Bridge.statusAppend(` ${str}`);
          if (code === null) {
            reject(new Error('Erase Timedout'));
          } else {
            reject(new Error(`Erase Failed ${code}`));
          }
        }
      });
    });
  }

  /**
   * Flash hex to mcu
   * @return {Promise} flash failed resolve or successfully flashed mcu
   * @module programmers/dfuProgrammer
   */
  flashChip(device: string): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      const command = dfuProgrammer;
      const args = [device, 'flash', window.inputPath];
      const flasher = spawn(command, args);

      // add a linefeed to console output
      window.Bridge.statusAppend('');

      const cancelID = timeoutBuilder(reject, flasher, 'Flash Timedout');

      flasher.stderr.on('data', window.Bridge.statusAppendNoLF);

      flasher.on('exit', (code: unknown) => {
        clearTimeout(cancelID);
        if (code === 0) {
          resolve(true);
        } else {
          if (code !== null) {
            window.Bridge.statusAppend(`Flashing Failed ${code}`);
            reject(new Error(`Flash Failed ${code}`));
          }
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
  resetChip(device: string): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      const command: string = dfuProgrammer;
      const args = [device, 'reset'];

      const resetter = spawn(command, args);

      const cancelID = timeoutBuilder(reject, resetter, 'Reset Timedout');

      resetter.on('exit', (code: unknown) => {
        clearTimeout(cancelID);
        if (code === 0) {
          resolve(true);
        } else {
          if (code !== null) {
            window.Bridge.statusAppend('Reset Failed');
            reject(Error('Reset Failed'));
          }
        }
      });
    });
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
    const eraseChip = this.eraseChip.bind(this);
    const flashChip = this.flashChip.bind(this);
    const resetChip = this.resetChip.bind(this);
    const fw: FlashWriter = {
      validator(): PromiseLike<boolean | Error> {
        return responseAdapter(
          new Promise((resolve, reject) => {
            isCompatible() ? resolve(true) : reject(false);
          }),
          `Found USB Device ${processor}`,
          'Please connect the Keyboard and press reset'
        );
      },
      eraser(): PromiseLike<boolean | Error> {
        window.Bridge.statusAppend(`Erasing ${processor}`);
        return responseAdapter(
          eraseChip(processor),
          'Erase Succeeded',
          'Erase Failed'
        );
      },
      flasher(): PromiseLike<boolean | Error> {
        window.Bridge.statusAppend(`Flashing ${processor}`);
        return responseAdapter(
          flashChip(processor),
          `Flashing Succeeded`,
          (r: PromiseLike<Error>) => `Flashing Failed ${r}`
        );
      },
      restarter(): PromiseLike<boolean | Error> {
        return responseAdapter(
          resetChip(processor),
          `Restarting Keyboard`,
          (r: PromiseLike<Error>) => `Restart Failed ${r}`
        );
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
