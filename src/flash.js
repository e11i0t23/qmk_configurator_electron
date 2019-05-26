const temp = require("temp");
const path = require("path");
const selector = require("./modules/selector");
const https = require("follow-redirects").https;
const fs = require("fs");

temp.track();

async function flashURL(url, keyboard, filename) {
  console.log(url, keyboard, filename);
  temp.mkdir("qmkconfigurator", function(err, dirPath) {
    window.tempFolder = dirPath;
    window.Bridge.statusAppend("\n\n ----STARTING FLASHING PROCEDURES----\n");
    window.inputPath = path.join(dirPath, filename);
    console.log(window.inputPath);
    pipeFile = fs.createWriteStream(window.inputPath);
    https
      .get(url, function(response) {
        response.pipe(pipeFile);
        pipeFile.on("finish", function() {
          console.log("finish downloads");
          selector.routes(keyboard);
          pipeFile.close();
        });
      })
      .on("error", function(err) {
        // Handle errors
        fs.unlink(imputPath); // Delete the file async. (But we don't check the result)
      });
  });
}

module.exports = {
  flashURL
};
