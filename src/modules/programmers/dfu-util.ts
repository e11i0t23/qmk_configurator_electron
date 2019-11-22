import * as path from 'path';
import childProcess from 'child_process';
import log from 'electron-log';
import {FlashWriter, Methods} from '../types';
import {timeoutBuilder, responseAdapter} from './utils';
import {newStateMachine} from '../state-machine';

const spawn = childProcess.spawn;

let dfuUtil: string;

if (process.platform === 'win32') {
  dfuUtil = path.resolve('programmers', './dfu-util.exe');
  console.log(dfuUtil);
} else if (process.platform === 'darwin') {
  dfuUtil = path.resolve('programmers', './dfu-util');
} else {
  dfuUtil = 'dfu-util';
}

log.info(`dfuUtil found at ${dfuUtil}`);

export function flasher(
  command: string,
  args: Array<string>
): Promise<boolean | Error> {
  return new Promise((resolve, reject) => {
    const dfuer = spawn(command, args);
    dfuer.stdout.on('data', window.Bridge.statusAppendNoLF);
    dfuer.stderr.on('data', window.Bridge.statusAppendNoLF);

    const cancelID = timeoutBuilder(reject, dfuer, 'Flash Timedout', 15000);
    dfuer.on('exit', (code: unknown /*, signal*/) => {
      clearTimeout(cancelID);
      if (code === 0) {
        resolve(true);
      } else {
        if (code === null) {
          reject(new Error('Flash Timedout'));
        } else {
          reject(new Error(`Flash Failed ${code}`));
        }
      }
    });
  }) as Promise<boolean | Error>;
}

export function stm32(firmware: string): Promise<boolean | Error> {
  const command = dfuUtil;
  const args = [
    '-a',
    '0',
    '-d',
    '0483:df11',
    '-s',
    '0x08000000:leave',
    '-D',
    firmware,
  ];
  return flasher(command, args) as Promise<boolean | Error>;
}

export function kiibohd(filename: string): Promise<boolean | Error> {
  const command = dfuUtil;
  const args = ['-D', filename];
  return flasher(command, args) as Promise<boolean | Error>;
}

export enum Family {
  stm32,
  kiibohd,
}

export class DFUUtil {
  constructor(filename: string, family: Family) {
    this.filename = filename;
    this.family = family;
  }

  filename: string;
  family: Family;

  methods(): Methods {
    const filename = this.filename;
    const ra: (
      fn: Promise<unknown>,
      successMsg: string,
      failMsg: unknown
    ) => Promise<boolean | Error> = responseAdapter.bind(
      undefined,
      window.Bridge.statusAppendNoLF
    );
    const fw: FlashWriter = {
      validator(): PromiseLike<boolean | Error> {
        return ra(
          new Promise((resolve, reject) => {
            filename.endsWith('bin') ? resolve(true) : reject(false);
          }),
          `found .bin file`,
          `dfu-util only works with .bin files`
        );
      },
      flasher(): PromiseLike<boolean | Error> {
        window.Bridge.statusAppend(`Flashing processor`);
        let flashFn: (a: string) => Promise<boolean | Error>;
        switch (this.family) {
          case Family.stm32:
            flashFn = stm32;
            break;
          case Family.kiibohd:
            flashFn = kiibohd;
            break;
          default:
            flashFn = stm32;
        }
        return ra(
          flashFn(filename),
          `Flashing Succeeded`,
          (r: PromiseLike<Error>) => `Flashing Failed ${r}`
        );
      },
    };
    return {
      ...fw,
    };
  }
}

export function dfuUtilFlash(firmware: string, family: Family): void {
  const programmer = new DFUUtil(firmware, family);
  const sm = newStateMachine({methods: programmer.methods()});
  sm.ready();
}
