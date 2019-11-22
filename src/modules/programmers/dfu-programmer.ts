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

const dfuProgrammerBinary = ((): string => {
  if (process.platform == 'win32') {
    return path.resolve('programmers', './dfu-programmer.exe');
  } else if (process.platform == 'darwin') {
    return path.resolve('programmers', './dfu-programmer');
  }
  return 'dfu-programmer';
})();

log.info('DFU programmer is', dfuProgrammerBinary);

export class DFUProgrammer {
  constructor(
    productID: number,
    processor: string,
    loggerNoLF: (msg: string) => void
  ) {
    this.productID = productID;
    this.processor = processor;
    this.loggerNoLF = loggerNoLF;
  }

  productID: number;
  processor: string;
  loggerNoLF: (msg: string) => void;

  /**
   * Erase data from mcu
   * @return {Promise} reject - erase failed
   * @return {Promise} resolve - successfully erased mcu
   * @module programmers/dfuProgrammer
   */
  static eraseChip(
    loggerNoLF: (msg: string) => void,
    device: string
  ): Promise<boolean | Error> {
    const ERASED_NOT_BLANK = 5;
    return new Promise(function eraseChipResolver(resolve, reject) {
      let command = dfuProgrammerBinary;
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
          loggerNoLF(` ${str}`);
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
  static flashChip(
    loggerNoLF: (msg: string) => void,
    device: string
  ): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      const args = [device, 'flash', window.inputPath];
      const flasher = spawn(dfuProgrammerBinary, args);

      // add a linefeed to console output
      loggerNoLF('\n');

      const cancelID = timeoutBuilder(reject, flasher, 'Flash Timedout');

      flasher.stderr.on('data', loggerNoLF);

      flasher.on('exit', (code: unknown) => {
        clearTimeout(cancelID);
        if (code === 0) {
          resolve(true);
        } else {
          if (code !== null) {
            loggerNoLF(`Flashing Failed ${code}`);
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
  static resetChip(
    loggerNoLF: (msg: string) => void,
    device: string
  ): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      const args = [device, 'reset'];

      const resetter = spawn(dfuProgrammerBinary, args);

      const cancelID = timeoutBuilder(reject, resetter, 'Reset Timedout');

      resetter.on('exit', (code: unknown) => {
        clearTimeout(cancelID);
        if (code === 0) {
          resolve(true);
        } else {
          if (code !== null) {
            loggerNoLF('Reset Failed');
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
    const loggerNoLF = this.loggerNoLF;
    const eraseChip = DFUProgrammer.eraseChip.bind(this, loggerNoLF);
    const flashChip = DFUProgrammer.flashChip.bind(this, loggerNoLF);
    const resetChip = DFUProgrammer.resetChip.bind(this, loggerNoLF);
    const ra: (
      fn: Promise<unknown>,
      successMsg: string,
      failMsg: unknown
    ) => Promise<boolean | Error> = responseAdapter.bind(undefined, loggerNoLF);
    const fw: FlashWriter = {
      validator(): PromiseLike<boolean | Error> {
        return ra(
          new Promise((resolve, reject) => {
            isCompatible() ? resolve(true) : reject(false);
          }),
          `Found USB Device ${processor}`,
          'Please connect the Keyboard and press reset'
        );
      },
      eraser(): PromiseLike<boolean | Error> {
        loggerNoLF(`Erasing ${processor}\n`);
        return ra(eraseChip(processor), 'Erase Succeeded', 'Erase Failed');
      },
      flasher(): PromiseLike<boolean | Error> {
        loggerNoLF(`Flashing ${processor}\n`);
        return ra(
          flashChip(processor),
          `Flashing Succeeded`,
          (r: PromiseLike<Error>) => `Flashing Failed ${r}`
        );
      },
      restarter(): PromiseLike<boolean | Error> {
        return ra(
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
}

/**
 * Processing unit for flashing with dfu programmer
 * @param {number} productID usb PID for atmel device
 * @param {string} processor processor submitted from api
 * @module programmers/dfuProgrammer
 */
export function dfuProgrammerFlash(productID: number, processor: string): void {
  if (processor) {
    const programmer = new DFUProgrammer(
      productID,
      processor,
      window.Bridge.statusAppendNoLF
    );
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
          const programmer = new DFUProgrammer(
            productID,
            r,
            window.Bridge.statusAppendNoLF
          );
          const sm = newStateMachine({methods: programmer.methods()});
          sm.ready();
        }
      })
      .catch(log.error);
  }
}
