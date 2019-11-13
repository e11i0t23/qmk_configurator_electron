import * as path from 'path';
import childProcess from 'child_process';

const spawn = childProcess.spawn;

let dfuUtil: string;

if (process.platform === 'win32') {
  dfuUtil = path.resolve('programmers', './dfu-util.exe');
  console.log(dfuUtil);
} else if (process.platform === 'darwin') {
  dfuUtil = path.resolve('programmers', './dfu-util');
} else {
  dfuUtil = 'dfu-util';
}

export function stm32() {
  const firmware = window.inputPath;
  console.log(firmware);
  if (firmware.endsWith('bin')) {
    const command = dfuUtil;
    const args = [
      '-a',
      '0',
      '-d',
      '0483:df11',
      '-s',
      '0x08000000:leave',
      '-D',
      firmware,
    ];
    try {
      const dfuer = spawn(command, args);
      dfuer.stdout.on('data', window.Bridge.statusAppendNoLF);
      dfuer.stderr.on('data', window.Bridge.statusAppendNoLF);
    } catch (error) {
      window.Bridge.statusAppend(` error: ${error}`);
    }
  } else {
    window.Bridge.statusAppend(` Err: dfu-util only works with .bin files`);
  }
}

export function kiibohd() {
  const f = window.inputPath;
  if (f.endsWith('bin')) {
    const command = dfuUtil;
    const args = ['-D', f];
    try {
      const dfuer = spawn(command, args);
      dfuer.stdout.on('data', window.Bridge.statusAppendNoLF);
      dfuer.stderr.on('data', window.Bridge.statusAppendNoLF);
    } catch (error) {
      window.Bridge.statusAppend(` error: ${error}`);
    }
  } else {
    window.Bridge.statusAppend(` Err: dfu-util only works with .bin files`);
  }
}
