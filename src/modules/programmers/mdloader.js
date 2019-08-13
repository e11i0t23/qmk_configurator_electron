const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let dfuUtil;

if (process.platform == 'win32') {
  mdloader = path.resolve('programmers', './mdloader_windows.exe');
  console.log(dfuUtil);
} else if (process.platform == 'darwin') {
  mdloader = path.resolve('programmers', './mdloader_mac');
} else {
  mdloader = 'mdloader_linux';
}

module.exports = {
  atmelSamBa: async () => {
    SerialPort.list(async function(err, ports) {
      ports.forEach(async function(port) {
        if (vendorIDs.includes(port.vendorId)) {
          CaterinaPort = port.comName;
          const command = `${mdloader} -p ${CaterinaPort} -D ${window.inputPath}`;
          const {stdout, stderr} = await exec(command);
          window.Bridge.statusAppend(` stdout: ${stdout}`);
          window.Bridge.statusAppend(` stderr: ${stderr}`);
          break;
        }
      });
    });
  }
}