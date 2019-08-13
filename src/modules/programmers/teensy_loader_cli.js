const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const prompt = require('electron-prompt');

if (process.platform == 'win32') {
  teensy = path.resolve('programmers', './teensy_loader_cli.exe');
  console.log(teensy);
} else if (process.platform == 'darwin') {
  teensy = path.resolve('programmers', './teensy_loader_cli');
} else {
  teensy = 'teensy_loader_cli';
}

module.exports = {
  tlc: async () => {
    prompt({
      title: 'Teensy',
      label: 'Please select Teensy model',
      height: 150,
      type: 'select',
      selectOptions: {
        'mk66fx1m0': 'Teensy 3.6',
        'mk64fx512': 'Teensy 3.5',
        'mk20dx256': 'Teensy 3.2 & 3.1',
        'mk20dx128': 'Teensy 3.0',
        'mkl26z64': 'Teensy LC',
        'at90usb1286': 'Teensy++ 2.0',
        'atmega32u4': 'Teensy 2.0',
        'at90usb646': 'Teensy++ 1.0',
        'at90usb162': 'Teensy 1.0',
      },
    })
        .then((r) => {
          if (r === null) {
            window.Bridge.statusAppend('No selection made flashing cancelled');
          } else {
            flash(r);
          }
        })
        .catch(console.error);
  },
};
/**
 * flash-teensy loader
 * @param {String } mcu mcu of teenst
 */
async function flash(mcu) {
  f = window.inputPath;
  const command = `${teensy} -mmcu=${mcu} ${f} -v`;
  const {stdout, stderr} = await exec(command);
  window.Bridge.statusAppend(`\n stdout: ${stdout}`);
  window.Bridge.statusAppend(`\n stderr: ${stderr}`);
}
