var fs = require('fs');
var async = require('async');
var log = require('./log');

function join (from, to) {
  for (var key in from)
    to[key] = from[key];
}

exports.initMFS = function (path, callback) {
  mapSeries([path, path + '/.MFS', path + '/snapshots', path + '/.MFS' + date,
    path + '/snapshots/' + date, path + '/snapshots/' + date + '/data'],
    fs.mkdir, function (err) { 
      if (err) callback(err);
      else fs.symlink(data, path + '/current', function (err) {
        if (err) callback(err);
        else callback(null, new repository(path, getCurrentDate(), 0));
      });
    });
};

exports.reloadMFS = function (path, callback) {
  fs.readlink(path + '/current', function (err, src) {
    if (err) { callback(err); return; }
    var date = src.substr(-10);
    log.loadMFSLog(path + '/current/MFS.log', function (err, data) {
      if (err) { callback(err); return; }
      this.opno = data.length;
      callback(null, new repository(path, date, opno));
    })
  });
};

function repository (path, date, opno) {
  this.path = path;
  __setVars(date, opno);
}

repository.prototype = {
// ---
// backup functions
// ---
  __setVars: function (date, opno) {
    this.date = date, this.opno = opno;
    this.MFS = path + '/.MFS/' + date + '/';
    this.current = path + '/snapshots/' + date + '/';
    this.data = path + '/snapshots/' + date + '/data/';
    this.log = new log.MFSLog(fs.createWriteStream(current + 'MFS.log', {flags: 'a', encoding: 'utf8'}));
  },

  backup: function (callback) {
    var date = getCurrentDate();
    var counter = 1;
    var dest = path + '/snapshots/' + date + '/data/';
    function copy (now, callback) {
      fs.stat(data + now, function (err, stats) {
        if (stats.isDirectoy()) {
          async.parallel([
            function (callback) { fs.mkdir(dest + now, callback); },
            function (callback) { fs.readdir(data + now, callback); }],
            function (err, results) {
              if (err) { callback(err); return; }
              counter += results[1].length - 1;
              results[1].forEach(function (file)) { copy(now + '/' + file, callback); });
              if (counter == 0) callback();
            })
        }
        else fs.link(data + now, dest + now, function (err) {
          if (err) { callback(err); return; }
          counter --;
          if (counter == 0) callback();
        });
      }
    }
    async.mapSeries([path + '/.MFS' + date, path + '/snapshots/' + date],
      fs.mkdir, function(err) {
        if (err) callback(err);
        else copy('.', function (err) { callback(err); });
      });
  },
// ---
// write functions
// ---
  checkBackup: function (callback) {
    if (this.date == getCurrentDate()) callback();
    else backup(function (err) {
      if (err) { callback(err); return; }
      __setVars(getCurrentDate(), 0);
      callback();
    });
  },

  mkdir: function (path, callback) {
    checkBackup(function (err) {
      if (err) callback(err);
      else fs.mkdir(data + path, function (err) {
        if (err) callback(err);
        else { log.write('mkdir::' + path); opno ++; callback(); }
      });
    });
  },

  write: function (path, buffer, callback) {
    checkBackup(function (err) {
      if (err) { callback(err); return; }
      var MFSPath = path.split('/').join('.') + this.opno;
      async.series([
        function (callback) { fs.writeFile(MFS + MFSPath, buffer, callback); },
        function (callback) { fs.unlink(data + path, function () { callback(); }); },
        function (callback) { fs.link(MFS + MFSPath, data + path, callback); }
      ], function (err) {
        if (err) callback(err);
        else { log.write('write::' + path); opno ++; callback(); }
      });
    });
  },

  move: function (from, to, callback) {
    checkBackup(function (err) {
      if (err) callback(err);
      else fs.rename(data + from, data + to, function (err) {
        if (err) callback(err);
        else { log.write('move::' + from + '::' + to); opno ++; callback(); }
      })
    });
  },

  mkdir: function (path, callback) {
    var fullPath = data + path;
    function remove (isDir, callback) {
      if (isDir) fs.rmdir(fullPath, callback);
      else fs.unlink(fullPath, callback);
    }

    checkBackup(function (err) {
      if (err) { callback(err); return; }
      fs.stat(fullPath, function (err, stats) {
        remove(stats.isDirectory(), function (err) {
          if (err) callback(err);
          else { log.write('remove::' + path); opno ++; callback(); }
        });
      });
    });
  },
// ---
// readonly functions
// It is unnecessary to backup the repository when no change happened.
// ---
  list: function (path, callback) {
    fs.readdir(this.data + path, callback);
  },

  read: function (path, callback) {
    fs.readFile(this.data + path, callback);
  },

  stat: function (path, callback) {
    fs.stat(this.data + path, callback);
  }
};

function alignDate (value, margin) {
  if (margin == undefined) margin = 2;
  var str = value.toString();
  while (str.length < margin) str = '0' + str;
  return str;
}

function getCurrentDate (D) {
  var year = D.getUTCFullYear(),
      month = D.getUTCMonth() + 1,
      date = D.getUTCDate() + 1;
  return year + '-' + alignDate(month) + '-' + alignDate(date);
}
