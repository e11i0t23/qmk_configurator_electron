import * as path from 'path';
import * as childProcess from 'child_process';

const spawn = childProcess.spawn;
import SerialPort from 'serialport';
import prompt from 'electron-prompt';
import log from 'electron-log';

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

async function flash(args: Array<string>, vendorIDs: Array<String>) {
  SerialPort.list()
    .then(function(ports) {
      console.log(ports);
      ports.forEach(async function(port) {
        console.log(port.vendorId);
        if (vendorIDs.includes(port.vendorId)) {
          // TODO - deprecated in 8, need to move to path
          // typescript bindings haven't been updated
          const CaterinaPort = port.comName;
          const command = avrdude;
          args = args.concat([
            '-C',
            `${path.dirname(avrdude)}/avrdude.conf`,
            '-P',
            CaterinaPort,
          ]);
          const avrduder = spawn(command, args);
          window.Bridge.statusAppend('');

          avrduder.stdout.on('data', window.Bridge.statusAppendNoLF);
          avrduder.stderr.on('data', window.Bridge.statusAppendNoLF);
        } else if (port == ports[ports.length - 1]) {
          window.Bridge.statusAppend('No Com Port Found');
        }
      });
    })
    .catch(window.Bridge.statusAppend);
}

export function caterina(mcu: string) {
  const vendorIDs = ['2341', '1B4F', '239a'];
  const args = [
    '-p',
    mcu,
    '-c',
    'avr109',
    '-U',
    `flash:w:${window.inputPath}:i`,
  ];
  return flash(args, vendorIDs);
}
export function avrisp(mcu: string) {
  const vendorIDs = ['16C0'];
  const args = [
    '-p',
    mcu,
    '-c',
    'avrisp',
    '-U',
    `flash:w:${window.inputPath}:i`,
  ];
  return flash(args, vendorIDs);
}
export function USBasp(mcu: string) {
  prompt({
    title: 'Processor',
    label: 'Please submit processor',
    height: 150,
    value: mcu,
  })
    .then((r) => {
      if (r === null) {
        window.Bridge.statusAppend('No selection made flashing cancelled');
      } else {
        const args = [
          '-p',
          r,
          '-c',
          'usbasp',
          '-U',
          `flash:w:${window.inputPath}:i`,
        ];
        return flash(args, []);
      }
    })
    .catch(console.error);
}
export function USBtiny(mcu: string) {
  prompt({
    title: 'Processor',
    label: 'Please submit processor',
    height: 150,
    value: mcu,
  })
    .then((r) => {
      if (r === null) {
        window.Bridge.statusAppend('No selection made flashing cancelled');
      } else {
        const vendorIDs = ['1781'];
        const args = [
          '-p',
          r,
          '-c',
          'usbtiny',
          '-U',
          `flash:w:${window.inputPath}:i`,
        ];
        return flash(args, vendorIDs);
      }
    })
    .catch(console.error);
}
