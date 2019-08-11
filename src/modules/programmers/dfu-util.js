const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let dfuUtil = path.resolve('programmers', './dfu-util');

if (process.platform == 'win32') {
  dfuUtil = dfuUtil + '.exe';
  console.log(dfuUtil);
}

module.exports = {
  stm32: async () => {
    f = window.inputPath;
    if (f.substr(f.length, -4) == '.bin') {
      const command = `${dfuUtil} -a 0 -d 0483:df11 -s 0x08000000:leave -D ${f}`;
      const {stdout, stderr} = await exec(command);
      window.Bridge.statusAppend(`\n stdout: ${stdout}`);
      window.Bridge.statusAppend(`\n stderr: ${stderr}`);
    } else {
      window.Bridge.statusAppend(`\n Err: dfu-util only works with .bin files`);
    }
  },

  kiibohd: async () => {
    f = window.inputPath;
    if (f.substr(f.length, -4) == '.bin') {
      const command = `${dfuUtil} -D ${f}`;
      const {stdout, stderr} = await exec(command);
      window.Bridge.statusAppend(`\n stdout: ${stdout}`);
      window.Bridge.statusAppend(`\n stderr: ${stderr}`);
    } else {
      window.Bridge.statusAppend(`\n Err: dfu-util only works with .bin files`);
    }
  },
};
