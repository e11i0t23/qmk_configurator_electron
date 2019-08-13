const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let dfuUtil;

if (process.platform == 'win32') {
  COMMAND = path.resolve('programmers', './FILE.exe');
  console.log(dfuUtil);
} else if (process.platform == 'darwin') {
  COMMAND = path.resolve('programmers', './FILE');
} else {
  COMMAND = 'FILE';
}

module.exports = {
  COMMAND = () => {
    const command = ``;
    const {stdout, stderr} = await exec(command);
    window.Bridge.statusAppend(`\n stdout: ${stdout}`);
    window.Bridge.statusAppend(`\n stderr: ${stderr}`);
  }
}