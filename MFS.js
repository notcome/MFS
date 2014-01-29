var fs = require('fs');
var console = require('console');

//Utils
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

function getCurrentTime (D) {
  var hour = D.getUTCHours(),
      minute = D.getUTCMinutes(),
      second = D.getUTCSeconds(),
      ms = D.getUTCMilliseconds();
  return alignDate(hour) + ':' + alignDate(minute) + ':' + alignDate(second) + ':' + alignDate(ms, 3);
}
//------
function log (content, date, storage) {
  var log = '[' + getCurrentTime(date) + '] ' + storage.opno + ' : ' + content + '\n';
  storage.slog.write(new Buffer(log));
  storage.opno ++;
}

function storageCreateLogStream (storage, ret) {
  storage.slog = fs.createWriteStream(storage.curSnapshot + 'MFS.log',
                                      { 'flags': 'a', 'encoding': 'utf8' });
  storage.slog.on('open', function () { ret(null); });
}
//------
function storageSetPathName (storage) {
  storage.curMFS = storage.path + '/.MFS/' + storage.date + '/';
  storage.curSnapshot = storage.path + '/snapshots/' + storage.date + '/';
  storage.curData = storage.curSnapshot + 'data/';
}

function storageAddMethod (storage) {
  storage.mkdir = mkdir;
  storage.write = write;
  storage.move = move;
  storage.remove = remove;

  storage.list = list;
  storage.read = read;
  storage.stat = stat;
}

function storageCreateDirectories (storage, ret) {
  try {
    fs.mkdir(storage.curMFS, obtain());
    fs.mkdir(storage.curSnapshot, obtain());
    fs.mkdir(storage.curData, obtain());
    fs.symlink(storage.curSnapshot, storage.path + '/current', obtain());
    storageCreateLogStream(storage, obtain());

    ret(null);
  } catch (err) {
    ret(err);
  }
}
//------
function copyDirectories(src, des, ret) {
  //For convenience
  fs.rmdir(des, cont(err));
  if (err) ret(err);

  var counter = 1;

  function copyRecursive (src, des, ret) {
    try {
      fs.stat(src, obtain(stats));
      if (stats.isDirectory()) {
        parallel(
          fs.readdir(src, obtain(files)),
          fs.mkdir(des, obtain()));
        counter += files.length;
        for (var i in files)
          copyRecursive(src + '/' + files[i], des + '/' + files[i], ret);
        counter --;
        ret(null);
      }
      else {
        fs.readlink(src, obtain(to));
        fs.symlink(to, des, function () {
          counter --;
          ret(null);
        }) 
      }
    } catch (err) {
      ret(err);
    }
  }

  copyRecursive(src, des, function (err) {
    if (err) ret(err);
    else if (counter == 0) ret(null);
  })
}

//Storage Factory
function InitStorage (path, ret) {
  fs.mkdir(path, cont(err));
  if (err && err.code != 'EEXIST') ret(err);

  try {
    fs.mkdir(path + '/.MFS', obtain());
    fs.mkdir(path + '/snapshots', obtain());
    
    var storage = {
      'date': getCurrentDate(new Date()),
      'path': path,
      'opno': 0
    };

    storageSetPathName(storage);
    storageCreateDirectories(storage);
    storageAddMethod(storage);

    ret(null, storage);
  } catch (err) {
    ret(err);
  }
}

function ReloadStorage (path, ret) {
  var storage = {
    'date': getCurrentDate(new Date()),
    'path': path,
  };
  storageSetPathName(storage);

  try {
    fs.readFile(storage.curSnapshot + 'MFS.log', { 'encoding': 'utf8' }, obtain(data));
    storage.opno = 0;
    for (var i in data) {
      if (data[i] == '\n') storage.opno ++;
    }

    storageCreateLogStream(storage, obtain());
    storageAddMethod(storage);

    ret(null, storage);
  } catch (err) {
    ret(err);
  }
}

//Interface Implementation
function mkdir (path, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    fs.mkdir(self.curData + path, obtain());
    log('mkdir ' + path, date, self);
    ret();
  } catch (err) {
    ret(err);
  }
}

function write (path, buffer, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    var MFSPath = '';
    for (var i = 0; i < path.length; i ++) {
      if (path[i] == '/') MFSPath += '.';
      else MFSPath += path[i];
    }

    fs.writeFile(self.curMFS + MFSPath + self.opno, buffer, obtain());

    //Assuming no one else will access the storage,
    //so that it is safe to use fs.exists()
    fs.exists(self.curData + path, cont(exists));
    if (exists) fs.unlink(self.curData + path, obtain());
    fs.symlink(self.curMFS + MFSPath + self.opno, self.curData + path, obtain());

    //Only log when both operations are done
    log('write ' + path, date, self);
    ret();
  } catch (err) {
    ret(err);
  }
}

function move (oldPath, newPath, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    fs.rename(self.curData + oldPath, self.curData + newPath, obtain());
    log('move ' + oldPath + ' ' + newPath, date, self);
    ret();
  } catch (err) {
    ret(err);
  }
}

function remove (path, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    var absPath = self.curData + path;

    fs.stat(absPath, obtain(stats));
    if (stats.isDirectory()) fs.rmdir(absPath, obtain());
    else fs.unlink(absPath, obtain());

    log('remove ' + path, date, self);
    ret();
  } catch (err) {
    ret(err);
  }
}
//------
function list (path, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    fs.readdir(self.curData + path, obtain(files));
    ret(null, files);
  } catch (err) {
    ret(err);
  }
}

function read (path, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    fs.readFile(self.curData + path, obtain(buffer));
    ret(null, buffer);
  } catch (err) {
    ret(err);
  }
}

function stat (path, ret) {
  storageBackupDaily(this, cont(err, self, date));
  if (err) ret(err);

  try {
    fs.lstat(self.curData + path, obtain(stats));
    ret(null, stats);
  } catch (err) {
    ret(err);
  }
}

//Backup
function storageBackupDaily (storage, ret) {
  var date = new Date();
  if (getCurrentDate(date) > storage.date) {
    var oldData = storage.curData;
    storage.date = getCurrentDate(date);
    storageSetPathName(storage);

    fs.unlink(storage.path + '/current', cont(err));
    if (err) ret(err);
    storage.slog.end('What a good day!\n', 'utf8');

    storageCreateDirectories(storage, cont(err));
    if (err) ret(err);

    copyDirectories(oldData, storage.curData, cont(err));
    if (err) ret(err);
  }
  storage.opno = 0;
  ret(null, storage, new Date());
}

exports.init = InitStorage();
exports.reload = ReloadStorage();
