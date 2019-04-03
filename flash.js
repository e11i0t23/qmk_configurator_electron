const temp = require('temp');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path')
const https = require('https')

temp.track()

function flashURL(url, keyboard, filename){
  console.log(url, keyboard, filename)
  temp.mkdir('qmkconfigurator', function(err, dirPath){
    inputPath = path.join(dirPath, filename);
    file = fs.createWriteStream(inputPath);
    var request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close();  // close() is async, call cb after close completes.
      });
    }).on('error', function(err) { // Handle errors
      fs.unlink(imputPath); // Delete the file async. (But we don't check the result)
    });

    })
}

module.exports = {
  flashURL
}
