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

function runAvrdude(
  args: Array<string>,
  caterinaPort: string
): Record<string, any> {
  // TODO - comName deprecated in 8, need to move to path
  // typescript bindings haven't been updated
  args = args.concat([
    '-C',
    `${path.dirname(avrdude)}/avrdude.conf`,
    '-P',
    caterinaPort,
  ]);
  const avrduder = spawn(avrdude, args);
  window.Bridge.statusAppend('');

  avrduder.stdout.on('data', window.Bridge.statusAppendNoLF);
  avrduder.stderr.on('data', window.Bridge.statusAppendNoLF);
  return avrduder;
}

async function flash(
  args: Array<string>,
  vendorIDs: Array<string>
): Promise<any> {
  return SerialPort.list()
    .then(function(ports) {
      console.log(ports);
      const idx = ports.findIndex((port) => vendorIDs.includes(port.vendorId));
      if (idx > -1) {
        runAvrdude(args, ports[idx].comName);
      } else {
        window.Bridge.statusAppend('No serial Port Found');
      }
    })
    .catch(window.Bridge.statusAppend);
}

function argBuilder(
  mcu: string,
  protocol: string,
  filepath: string
): Array<string> {
  return ['-p', mcu, '-c', protocol, '-U', `flash:w:${filepath}:i`];
}

export function caterina(mcu: string): Promise<any> {
  const vendorIDs = ['2341', '1B4F', '239a'];
  const args = argBuilder(mcu, 'avr109', window.inputPath);
  return flash(args, vendorIDs);
}
export function avrisp(mcu: string): Promise<any> {
  const vendorIDs = ['16C0'];
  const args = argBuilder(mcu, 'avrisp', window.inputPath);
  return flash(args, vendorIDs);
}
export function USBasp(mcu: string): Promise<any> {
  return prompt({
    title: 'Processor',
    label: 'Please submit processor',
    height: 150,
    value: mcu,
  })
    .then((r) => {
      if (r === null) {
        window.Bridge.statusAppend('No selection made flashing cancelled');
      } else {
        const args = argBuilder(r, 'uspasp', window.inputPath);
        return flash(args, []);
      }
    })
    .catch(console.error);
}

export function USBtiny(mcu: string): Promise<any> {
  return prompt({
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
        const args = argBuilder(r, 'usbtiny', window.inputPath);
        return flash(args, vendorIDs);
      }
    })
    .catch(console.error);
}
