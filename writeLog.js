const fs = require('fs')
function appendLog(message) {
  const dateStr = new Date().toLocaleString()
  const realMessage = message + ' ' + dateStr + '\r\n'
  fs.appendFile('access.log', realMessage, function(err){
    if(err) {
      console.log('err', err)
    }
    console.log('write success')
  })
}
module.exports = appendLog;
