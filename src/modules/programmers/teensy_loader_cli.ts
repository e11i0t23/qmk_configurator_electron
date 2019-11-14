import * as path from 'path';
import * as childProcess from 'child_process';
const spawn = childProcess.spawn;
import prompt from 'electron-prompt';

let teensy = '';
if (process.platform === 'win32') {
  teensy = path.resolve('programmers', './teensy_loader_cli.exe');
  console.log(teensy);
} else if (process.platform === 'darwin') {
  teensy = path.resolve('programmers', './teensy_loader_cli');
} else {
  teensy = 'teensy_loader_cli';
}

/**
 * flash-teensy loader
 * @param {String } mcu mcu of teenst
 */
async function flash(mcu: string): Promise<any> {
  const f = window.inputPath;
  const command = teensy;
  const args = [`-mmcu=${mcu}`, f, '-v'];
  const teensyer = spawn(command, args);
  teensyer.stdout.on('data', window.Bridge.statusAppendNoLF);
  teensyer.stderr.on('data', window.Bridge.statusAppendNoLF);
  return teensyer;
}

export async function tlc(): Promise<any> {
  return prompt({
    title: 'Teensy',
    label: 'Please select Teensy model',
    height: 150,
    type: 'select',
    selectOptions: {
      mk66fx1m0: 'Teensy 3.6',
      mk64fx512: 'Teensy 3.5',
      mk20dx256: 'Teensy 3.2 & 3.1',
      mk20dx128: 'Teensy 3.0',
      mkl26z64: 'Teensy LC',
      at90usb1286: 'Teensy++ 2.0',
      atmega32u4: 'Teensy 2.0',
      at90usb646: 'Teensy++ 1.0',
      at90usb162: 'Teensy 1.0',
    },
  })
    .then((r) => {
      if (r === null) {
        window.Bridge.statusAppend('No selection made flashing cancelled');
      } else {
        return flash(r);
      }
    })
    .catch((err) => {
      console.error(err);
      return err;
    });
}
