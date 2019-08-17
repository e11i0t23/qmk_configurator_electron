const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const SerialPort = require('serialport')
const prompt = require('electron-prompt');

let avrdude;
let command;
let vendorIDs;

if (process.platform == 'win32') {
  avrdude = path.resolve('programmers', './avrdude.exe');
  console.log(avrdude);
} else if (process.platform == 'darwin') {
  avrdude = path.resolve('programmers', './avrdude');
} else {
  avrdude = 'avrdude';
}

async function flash() {
  SerialPort.list(async function(err, ports) {
    console.log(ports)
    ports.forEach(async function(port) {
      console.log(port.vendorId)
      if (vendorIDs.includes(port.vendorId)) {
        CaterinaPort = port.comName;
        command = `${command} -P ${CaterinaPort}`;
        const {stdout, stderr} = await exec(command);
        window.Bridge.statusAppend(` stdout: ${stdout}`);
        window.Bridge.statusAppend(` stderr: ${stderr}`);
      }else if (port == ports[ports.length - 1] ){
        window.Bridge.statusAppend('No Com Port Found');
      }
    });
  });
}

module.exports = {
  caterina: async (mcu) =>{
    vendorIDs = ['2341', '1B4F', '239a']
    command =  `${avrdude} -p ${mcu} -c avr109 -U flash:w:\"${window.inputPath}"\:i`;
    flash()
  },
  avrisp: async (mcu) =>{
    vendorIDs = ['16C0']
    command = `${avrdude} -p ${mcu} -c avrisp -U flash:w:\"${window.inputPath}"\:i`
    flash()
  },
  USBasp: async () =>{
    prompt({
      title: 'Processor',
      label: 'Please submit processor',
      height: 150,
      value: 'atmega32u4',
    })
        .then((r) => {
          if (r === null) {
            window.Bridge.statusAppend('No selection made flashing cancelled');
          } else {
            command = `${avrdude} -p ${r} -c usbasp -U flash:w:\"${window.inputPath}"\:i`
            flash()
          }
        })
        .catch(console.error);
  },
  USBtiny: async () =>{
    prompt({
      title: 'Processor',
      label: 'Please submit processor',
      height: 150,
      value: 'atmega32u4',
    })
        .then((r) => {
          if (r === null) {
            window.Bridge.statusAppend('No selection made flashing cancelled');
          } else {
            vendorIDs = ['1781']
            command = `${avrdude} -p ${r} -c usbtiny -U flash:w:\"${window.inputPath}"\:i`
            flash()
          }
        })
        .catch(console.error);

  },
};
