const temp = require('temp');
const path = require('path');
const selector = require('./modules/selector');
const https = require('follow-redirects').https;
const fs = require('fs');
const {dialog} = require('electron').remote;

temp.track();

/**
 * Download keymap from API before initiating programmer selection
 * @param {String} url URL from compiler API for file download
 * @param {String} keyboard Name of keyboard
 * @param {String} filename Name of file to save download to
 * @module window.Bridge
 */
async function flashURL(url, keyboard, filename) {
  console.log(url, keyboard, filename);
  temp.mkdir('qmkconfigurator', function(err, dirPath) {
    window.tempFolder = dirPath;
    window.Bridge.statusAppend('----STARTING FLASHING PROCEDURES----');
    window.inputPath = path.join(dirPath, filename);
    console.log(window.inputPath);
    pipeFile = fs.createWriteStream(window.inputPath);
    https
        .get(url, function(response) {
          response.pipe(pipeFile);
          pipeFile.on('finish', function() {
            console.log('finish downloads');
            selector.routes(keyboard);
            pipeFile.close();
          });
        })
        .on('error', function(err) {
        // Handle errors
          fs.unlink(imputPath); // Delete the file async. (But we don't check the result)
        });
  });
}

/**
 * Flash a custom file
 */
async function flashFile() {
  window.Bridge.statusAppend('----STARTING FLASHING PROCEDURES----');
  dialog.showOpenDialog(process.win, {
    filters: [{name: '.bin, .hex', extensions: ['bin', 'hex']}],
    properties: ['openFile'],
  }, (filenames) =>{
    if (filenames.length == 1) {
      console.log(filenames);
      window.inputPath = filenames[0];
      selector.routes();
    } else window.Bridge.statusAppend('Flash Cancelled');
  });
}

module.exports = {
  flashURL,
  flashFile,
};
