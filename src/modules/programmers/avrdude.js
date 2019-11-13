const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const SerialPort = require('serialport');
const prompt = require('electron-prompt');

let avrdude;
let vendorIDs;

if (process.platform == 'win32') {
  avrdude = path.resolve('programmers', './avrdude.exe');
  console.log(avrdude);
} else if (process.platform == 'darwin') {
  avrdude = path.resolve('programmers', './avrdude');
} else {
  avrdude = 'avrdude';
}

async function flash(cmd) {
  SerialPort.list(async function(err, ports) {
    console.log(ports);
    ports.forEach(async function(port) {
      console.log(port.vendorId);
      if (vendorIDs.includes(port.vendorId)) {
        const CaterinaPort = port.comName;
        const command = `${cmd} -P ${CaterinaPort}`;
        const {stdout, stderr} = await exec(command);
        window.Bridge.statusAppend(` stdout: ${stdout}`);
        window.Bridge.statusAppend(` stderr: ${stderr}`);
      } else if (port == ports[ports.length - 1]) {
        window.Bridge.statusAppend('No Com Port Found');
      }
    });
  });
}

export function caterina(mcu) {
  vendorIDs = ['2341', '1B4F', '239a'];
  const command = `${avrdude} -p ${mcu} -c avr109 -U flash:w:"${window.inputPath}":i`;
  return flash(command);
}
export function avrisp(mcu) {
  vendorIDs = ['16C0'];
  const command = `${avrdude} -p ${mcu} -c avrisp -U flash:w:"${window.inputPath}":i`;
  return flash(command);
}
export function USBasp(mcu) {
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
        const command = `${avrdude} -p ${r} -c usbasp -U flash:w:"${window.inputPath}":i`;
        return flash(command);
      }
    })
    .catch(console.error);
}
export function USBtiny(mcu) {
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
        vendorIDs = ['1781'];
        const command = `${avrdude} -p ${r} -c usbtiny -U flash:w:"${window.inputPath}":i`;
        return flash(command);
      }
    })
    .catch(console.error);
}
