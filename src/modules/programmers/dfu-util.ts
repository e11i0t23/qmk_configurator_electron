import * as path from 'path';
import childProcess from 'child_process';
import log from 'electron-log';
import {FlashWriter, Methods, StateMachineRet} from '../types';
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

export enum Family {
  stm32,
  kiibohd,
}

export class DFUUtil {
  constructor(
    filename: string,
    family: Family,
    loggerNoLF: (msg: string) => void
  ) {
    this.filename = filename;
    this.family = family;
    this.loggerNoLF = loggerNoLF;
  }

  filename: string;
  family: Family;
  loggerNoLF: (msg: string) => void;

  static flasherFn(
    loggerNoLF: (msg: string) => void,
    command: string,
    args: Array<string>
  ): Promise<StateMachineRet> {
    return new Promise((resolve, reject) => {
      const dfuer = spawn(command, args);
      dfuer.stdout.on('data', loggerNoLF);
      dfuer.stderr.on('data', loggerNoLF);

      const cancelID = timeoutBuilder(reject, dfuer, 'Flash Timedout', 15000);
      dfuer.on('exit', (code: unknown /*, signal*/) => {
        clearTimeout(cancelID);
        if (code === 0) {
          resolve({kind: 'response', value: true});
        } else {
          if (code === null) {
            reject(new Error('Flash Timedout'));
          } else {
            reject(new Error(`Flash Failed ${code}`));
          }
        }
      });
    });
  }

  static stm32(
    loggerNoLF: (msg: string) => void,
    firmware: string
  ): Promise<StateMachineRet> {
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
    return DFUUtil.flasherFn(loggerNoLF, command, args);
  }

  static kiibohd(
    loggerNoLF: (msg: string) => void,
    filename: string
  ): Promise<StateMachineRet> {
    const command = dfuUtil;
    const args = ['-D', filename];
    return DFUUtil.flasherFn(loggerNoLF, command, args);
  }

  methods(): Methods {
    const filename = this.filename;
    const loggerNoLF = this.loggerNoLF;
    const ra: (
      fn: Promise<unknown>,
      successMsg: string,
      failMsg: unknown
    ) => Promise<StateMachineRet> = responseAdapter.bind(undefined, loggerNoLF);
    const fw: FlashWriter = {
      validator(): PromiseLike<StateMachineRet> {
        loggerNoLF('');
        return ra(
          new Promise((resolve, reject) => {
            filename.endsWith('bin')
              ? resolve({kind: 'response', value: true})
              : reject(new Error('filename should end with bin'));
          }),
          `\nfound .bin file`,
          `\ndfu-util only works with .bin files`
        );
      },
      flasher(): PromiseLike<StateMachineRet> {
        loggerNoLF(`Flashing processor\n`);
        let flashFn: (
          logger: (msg: string) => void,
          a: string
        ) => Promise<StateMachineRet>;
        switch (this.family) {
          case Family.stm32:
            flashFn = DFUUtil.stm32;
            break;
          case Family.kiibohd:
            flashFn = DFUUtil.kiibohd;
            break;
          default:
            flashFn = DFUUtil.stm32;
        }
        return ra(
          flashFn(loggerNoLF, filename),
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

export function dfuUtilFlash(
  firmware: string,
  family: Family,
  loggerNoLF: (msg: string) => void
): void {
  const programmer = new DFUUtil(firmware, family, loggerNoLF);
  const sm = newStateMachine({methods: programmer.methods()});
  sm.ready();
}
