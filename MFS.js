var fs = require('fs');
var async = require('async');
var log = require('./log');

function empty () {}

exports.initMFS = function (path, callback) {
  var date = getCurrentDate();
  var repo = new repository(path, date, 0);
  async.mapSeries([path + '/.MFS', path + '/snapshots', repo.MFS, repo.current, repo.data],
    fs.mkdir, function (err) { 
      if (err) { callback(err); return; }
      repo.__createLog();
      repo.__linkCurrent(function (err) {
        if (err) callback(err);
        else callback(null, repo);
      });
    });
};

exports.reloadMFS = function (path, callback) {
  fs.readlink(path + '/current', function (err, src) {
    if (err) { callback(err); return; }
    var date = src.substr(-16).substr(0, 10);
    log.loadMFSLog(path + '/snapshots/' + date + '/MFS.log', function (err, data) {
      if (err) { callback(err); return; }
      var opno = data.length;
      var repo = new repository(path, date, opno);
      repo.__createLog();
      callback(null, repo);
    })
  });
};

function repository (path, date, opno) {
  this.path = path;
  this.__setVars(date, opno);
}

repository.prototype = {
// ---
// backup functions
// ---
  __setVars: function (date, opno) {
    this.date = date, this.opno = opno;
    this.MFS = this.path + '/.MFS/' + date + '/';
    this.current = this.path + '/snapshots/' + date + '/';
    this.data = this.current + 'data/';
  },

  __createLog: function () {
    this.log = new log.MFSLog(fs.createWriteStream(this.current + 'MFS.log', {flags: 'a', encoding: 'utf8'}));
  },

  __linkCurrent: function (callback) {
    var data = this.data, path = this.path;
    fs.unlink(this.path + '/current', function (err, exists) {
      fs.symlink(data, path + '/current', function (err) { callback(err); });
    });
  },

  __copy: function (src, dest, callback) {
    var counter = 1;
    function copy (now, callback) {
      fs.stat(src + now, function (err, stats) {
        if (err) callback(err);
        if (stats.isDirectory()) {
          async.parallel([
            function (callback) { fs.mkdir(dest + now, callback); },
            function (callback) { fs.readdir(src + now, callback); }],
            function (err, results) {
              if (err) { callback(err); return; }
              counter += results[1].length - 1;
              results[1].forEach(function (file) { copy(now + '/' + file, callback); });
              if (counter == 0) callback();
            })
        }
        else fs.link(src + now, dest + now, function (err) {
          if (err) { callback(err); return; }
          counter --;
          if (counter == 0) callback();
        });
      });
    }
    copy('', function (err) { callback(err); });
  },

  backup: function (callback) {
    var date = getCurrentDate();
    var src = this.data, self = this;
    this.__setVars(date, 0);
    async.mapSeries([this.MFS, this.current], fs.mkdir, function (err) {
      if (err) { callback(err); return; }
      self.__createLog();
      self.__copy(src, self.data, function (err) {
        if (err) callback(err);
        else self.__linkCurrent(callback);
      });
    });
  },
// ---
// write functions
// ---
  checkBackup: function (callback) {
    if (this.date == getCurrentDate()) callback();
    else this.backup(function (err) { callback(err); return; });
  },

  mkdir: function (path, callback) {
    callback || (callback = empty);
    var self = this;
    this.checkBackup(function (err) {
      if (err) callback(err);
      else fs.mkdir(self.data + path, function (err) {
        if (err) callback(err);
        else { self.log.write('mkdir::' + path); self.opno ++; callback(); }
      });
    });
  },

  write: function (path, buffer, callback) {
    callback || (callback = empty);
    var self = this;
    this.checkBackup(function (err) {
      if (err) { callback(err); return; }
      var MFSPath = path.split('/').join('.') + self.opno;
      async.series([
        function (callback) { fs.writeFile(self.MFS + MFSPath, buffer, callback); },
        function (callback) { fs.unlink(self.data + path, function () { callback(); }); },
        function (callback) { fs.link(self.MFS + MFSPath, self.data + path, callback); }
      ], function (err) {
        if (err) callback(err);
        else { self.log.write('write::' + path); self.opno ++; callback(); }
      });
    });
  },

  move: function (from, to, callback) {
    callback || (callback = empty);
    var self = this;
    this.checkBackup(function (err) {
      if (err) callback(err);
      else fs.rename(self.data + from, self.data + to, function (err) {
        if (err) callback(err);
        else { self.log.write('move::' + from + '::' + to); self.opno ++; callback(); }
      })
    });
  },

  remove: function (path, callback) {
    callback || (callback = empty);
    var fullPath = this.data + path, self = this;
    function remove (isDir, callback) {
      if (isDir) fs.rmdir(fullPath, callback);
      else fs.unlink(fullPath, callback);
    }

    this.checkBackup(function (err) {
      if (err) { callback(err); return; }
      fs.stat(fullPath, function (err, stats) {
        if (err) callback(err);
        else remove(stats.isDirectory(), function (err) {
          if (err) callback(err);
          else { self.log.write('remove::' + path); self.opno ++; callback(); }
        });
      });
    });
  },
// ---
// readonly functions
// It is unnecessary to backup the repository when no change happened.
// ---
  list: function (path, callback) {
    callback || (callback = empty);
    fs.readdir(this.data + path, callback);
  },

  read: function (path, callback) {
    callback || (callback = empty);
    fs.readFile(this.data + path, callback);
  },

  stat: function (path, callback) {
    callback || (callback = empty);
    fs.stat(this.data + path, callback);
  }
};

function getCurrentDate () {
  var D = new Date();
  var year = D.getUTCFullYear(), month = D.getUTCMonth() + 1, date = D.getUTCDate();
  return year + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date);
}
