var fs = require('fs');

function loadMFSLog (filename, options, callback) {
  if (typeof options == 'function')
    callback = options, options = {encoding: 'utf8'};
  fs.readFile(filename, options, function (err, data) {
    if (err) callback(err);

    var logs = new Array();
    data.split('\n').forEach(function (line) {
      if (line == '') return;
      var date = new Date(line.split('|')[0]);
      var cont = line.split('|')[1];
      logs.push({date: date, content: cont});
    });
    callback(null, logs);
  });
}

function MFSLog (stream) {
  this.stream = stream;
}

MFSLog.prototype = {
  write: function (data) {
    stream.write(new Date().toUTCString() + '|' + data + '\n');
  }
}

exports.MFSLog = MFSLog;
exports.loadMFSLog = loadMFSLog;
