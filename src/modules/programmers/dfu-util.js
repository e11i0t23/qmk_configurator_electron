const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let dfuUtil;

if (process.platform == 'win32') {
  dfuUtil = path.resolve('programmers', './dfu-util.exe');
  console.log(dfuUtil);
} else if (process.platform == 'darwin') {
  dfuUtil = path.resolve('programmers', './dfu-util');
} else {
  dfuUtil = 'dfu-util';
}

module.exports = {
  stm32: async () => {
    f = window.inputPath;
    console.log(f.split('.').pop())
    if (f.split('.').pop() == 'bin') {
      const command = `${dfuUtil} -a 0 -d 0483:df11 -s 0x08000000:leave -D \"${f}"\ `;
      try {
        const {stdout, stderr} = await exec(command);
        window.Bridge.statusAppend(` stdout: ${stdout}`);
        window.Bridge.statusAppend(` stderr: ${stderr}`);
      } catch (error) {
        window.Bridge.statusAppend(` error: ${error}`);
      }
    } else {
      window.Bridge.statusAppend(` Err: dfu-util only works with .bin files`);
    }
  },

  kiibohd: async () => {
    f = window.inputPath;
    if (f.split('.').pop() == 'bin') {
      const command = `${dfuUtil} -D \"${f}"\ `;
      try {
        const {stdout, stderr} = await exec(command);
        window.Bridge.statusAppend(` stdout: ${stdout}`);
        window.Bridge.statusAppend(` stderr: ${stderr}`);
      } catch (error) {
        window.Bridge.statusAppend(` error: ${error}`);
      }
    } else {
      window.Bridge.statusAppend(` Err: dfu-util only works with .bin files`);
    }
  },
};
