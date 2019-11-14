const rimraf = require('rimraf').sync;
const {readdirSync, statSync} = require('fs');
const {join} = require('path');

const dirs = (p) =>
  readdirSync(p).filter((f) => {
    return statSync(join(p, f)).isDirectory();
  });
dirs('release').forEach((p) => {
  rimraf(join('release', p));
});
