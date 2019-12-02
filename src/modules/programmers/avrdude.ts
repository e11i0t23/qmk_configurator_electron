import * as path from 'path';
import * as childProcess from 'child_process';
import {newStateMachine} from '../state-machine';
import {FlashWriter, Methods, StateMachineRet} from '../types';
import {timeoutBuilder, responseAdapter} from './utils';

const spawn = childProcess.spawn;
import SerialPort from 'serialport';
//import prompt from 'electron-prompt';
import log from 'electron-log';

export enum Family {
  CATERINA,
  USBTINY,
  USBASP,
  AVRISP,
}

const VendorIDs: Map<number, Array<string>> = new Map([
  [Family.CATERINA, ['2341', '1B4F', '239a']],
  [Family.USBTINY, ['1781']],
  [Family.USBASP, []],
  [Family.AVRISP, ['16C0']],
]);

let avrdude: string;

if (process.platform === 'win32') {
  avrdude = path.resolve('programmers', './avrdude.exe');
  console.log(avrdude);
} else if (process.platform === 'darwin') {
  avrdude = path.resolve('programmers', './avrdude');
} else {
  avrdude = 'avrdude';
}

log.info(`avrdude binary ${avrdude}`);

function argBuilder(
  mcu: string,
  protocol: string,
  filepath: string
): Array<string> {
  return ['-p', mcu, '-c', protocol, '-U', `flash:w:${filepath}:i`];
}

export class AVRDude {
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
  comName: string;
  mcu = 'm32u4';

  setComName(comName: string): void {
    this.comName = comName;
  }

  getComName(): string {
    return this.comName;
  }

  // run actual flashing tool
  static run(
    args: Array<string>,
    comName: string,
    loggerNoLF: (msg: string) => void
  ): Promise<StateMachineRet> {
    return new Promise((resolve, reject) => {
      // TODO - comName deprecated in 8, need to move to path
      // typescript bindings haven't been updated
      args = args.concat([
        '-C',
        `${path.dirname(avrdude)}/avrdude.conf`,
        '-P',
        comName,
      ]);
      const avrduder = spawn(avrdude, args);
      loggerNoLF('\n');

      const cancelID = timeoutBuilder(
        reject,
        avrduder,
        'Avrdude Timedout',
        15000
      );
      avrduder.on('exit', (code: unknown) => {
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

      avrduder.stdout.on('data', loggerNoLF);
      avrduder.stderr.on('data', loggerNoLF);
      return avrduder;
    });
  }

  methods(): Methods {
    const loggerNoLF = this.loggerNoLF;
    const setComName = this.setComName.bind(this);
    const getComName = this.getComName.bind(this);
    const filepath = this.filename;
    let mcu = this.mcu;
    const family = this.family;
    const ra: (
      fn: Promise<unknown>,
      successMsg: string,
      failMsg: unknown
    ) => Promise<StateMachineRet> = responseAdapter.bind(undefined, loggerNoLF);
    const fw: FlashWriter = {
      validator(): Promise<StateMachineRet> {
        const vendorIDs = VendorIDs.get(family);
        return ra(
          new Promise((resolve, reject) => {
            /*
            switch (family) {
              case Family.USBTINY:
              case Family.USBASP:
                return prompt({
                  title: 'Processor',
                  label: 'Please submit processor',
                  height: 150,
                  value: mcu,
                })
                  .then((r) => {
                    if (r === null) {
                      reject(new Error('No selection made flashing cancelled'));
                    }
                  })
                  .catch(reject);
            }
            */

            // @
            if (family === Family.USBASP) {
              setComName('usb');
              resolve({kind: 'response', value: true});
              return;
            }

            // find expected serial port for flashing method
            return SerialPort.list()
              .then(function(ports) {
                const idx = ports.findIndex((port) =>
                  vendorIDs.includes(port.vendorId)
                );
                if (idx > -1) {
                  setComName(ports[idx].comName);
                  resolve({kind: 'response', value: true});
                } else {
                  setComName('');
                  reject(new Error('No comport'));
                }
              })
              .catch(loggerNoLF);
          }),
          'Found device port',
          'No device Port found'
        );
      },
      flasher(): Promise<StateMachineRet> {
        loggerNoLF('Flashing processor');
        let args: Array<string> = [];
        switch (family) {
          case Family.CATERINA:
            args = argBuilder(mcu, 'avr109', filepath);
            break;
          case Family.AVRISP:
            args = argBuilder(mcu, 'avrisp', filepath);
            break;
          case Family.USBTINY:
            args = argBuilder(mcu, 'usbtiny', filepath);
            break;
          case Family.USBASP:
            args = argBuilder(mcu, 'usbasp', filepath);
            break;
          default:
            throw new Error(`Unimplemented family ${family}`);
        }
        return ra(
          AVRDude.run(args, getComName(), loggerNoLF),
          `Flashing Succeeded`,
          (r: Promise<Error>) => `Flashing Failed ${r}`
        );
      },
    };
    return {...fw};
  }
}

export function AVRDudeFlash(
  firmware: string,
  family: Family,
  loggerNoLF: (msg: string) => void
): void {
  const programmer = new AVRDude(firmware, family, loggerNoLF);
  const sm = newStateMachine({methods: programmer.methods()});
  sm.ready();
}
