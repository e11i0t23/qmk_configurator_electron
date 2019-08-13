const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let avrdude;

if (process.platform == 'win32') {
  avrdude = path.resolve('programmers', './avrdude.exe');
  console.log(avrdude);
} else if (process.platform == 'darwin') {
  avrdude = path.resolve('programmers', './avrdude');
} else {
  avrdude = 'avrdude';
}

async function flash(command, vendorIDs) {
  SerialPort.list(async function(err, ports) {
    ports.forEach(async function(port) {
      if (vendorIDs.includes(port.vendorId)) {
        CaterinaPort = port.comName;
        const command = `${command} -P ${CaterinaPort}`;
        const {stdout, stderr} = await exec(command);
        window.Bridge.statusAppend(` stdout: ${stdout}`);
        window.Bridge.statusAppend(` stderr: ${stderr}`);
        break;
      }
    });
  });
}

module.export = {
  caterina: async (mcu) =>{
    vendorIDs = [0x2341, 0x1B4F, 0x239a]
    command = `${avrdude} -p ${mcu} -c avr109 -U flash:w:${window.inputPath}:i`;
    flash(command, vendorIDs)
  },
  avrisp: async (mcu) =>{
    vendorIDs = [0x16C0]
    command = `${avrdude} -p ${mcu} -c avrisp -U flash:w:${window.inputPath}:i`
    flash(command, vendorIDs)
  },
  USBasp: async () =>{
    vendorIDs = [0x16C0]
    command = `${avrdude} -p ${mcu} -c usbasp -U flash:w:${window.inputPath}:i`
    flash(command, vendorIDs)
  },
  USBtiny: async () =>{
    vendorIDs = [0x1781]
    command = `${avrdude} -p ${mcu} -c usbtiny -U flash:w:${window.inputPath}:i`
    flash(command, vendorIDs)
  },
};
