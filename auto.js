const process = require('child_process');
const fs = require('fs-extra');
const ChildProcess = process.fork('./game.js');

ChildProcess.on('exit', function(code) {
  console.log('process exits ', code);
  fs.appendFileSync('./log.txt', code)
  if(code !== 0) {
    process.fork('./game.js')
  }
})
