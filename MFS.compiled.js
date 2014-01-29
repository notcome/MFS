var fs, console;
fs = require('fs');
console = require('console');
function alignDate(value, margin) {
  var str;
  if (margin == undefined) {
    margin = 2;
  }
  str = value.toString();
  while (str.length < margin) {
    str = '0' + str;
  }
  return str;
}
function getCurrentDate(D) {
  var year, month, date;
  year = D.getUTCFullYear();
  month = D.getUTCMonth() + 1;
  date = D.getUTCDate() + 1;
  return year + '-' + alignDate(month) + '-' + alignDate(date);
}
function getCurrentTime(D) {
  var hour, minute, second, ms;
  hour = D.getUTCHours();
  minute = D.getUTCMinutes();
  second = D.getUTCSeconds();
  ms = D.getUTCMilliseconds();
  return alignDate(hour) + ':' + alignDate(minute) + ':' + alignDate(second) + ':' + alignDate(ms, 3);
}
function log(content, date, storage) {
  var log;
  log = '[' + getCurrentTime(date) + '] ' + storage.opno + ' : ' + content + '\n';
  storage.slog.write(new Buffer(log));
  storage.opno++;
}
function storageCreateLogStream(storage, ret) {
  storage.slog = fs.createWriteStream(storage.curSnapshot + 'MFS.log', {
    'flags': 'a',
    'encoding': 'utf8'
  });
  storage.slog.on('open', function () {
    ret(null);
  });
}
function storageSetPathName(storage) {
  storage.curMFS = storage.path + '/.MFS/' + storage.date + '/';
  storage.curSnapshot = storage.path + '/snapshots/' + storage.date + '/';
  storage.curData = storage.curSnapshot + 'data/';
}
function storageAddMethod(storage) {
  storage.mkdir = mkdir;
  storage.write = write;
  storage.move = move;
  storage.remove = remove;
  storage.list = list;
  storage.read = read;
  storage.stat = stat;
}
function storageCreateDirectories(storage, ret) {
  var _$err;
  (function (_$cont) {
    try {
      fs.mkdir(storage.curMFS, function (arguments, _$param0) {
        try {
          _$err = _$param0;
          if (_$err)
            throw _$err;
          fs.mkdir(storage.curSnapshot, function (arguments, _$param1) {
            try {
              _$err = _$param1;
              if (_$err)
                throw _$err;
              fs.mkdir(storage.curData, function (arguments, _$param2) {
                try {
                  _$err = _$param2;
                  if (_$err)
                    throw _$err;
                  fs.symlink(storage.curSnapshot, storage.path + '/current', function (arguments, _$param3) {
                    try {
                      _$err = _$param3;
                      if (_$err)
                        throw _$err;
                      storageCreateLogStream(storage, function (arguments, _$param4) {
                        try {
                          _$err = _$param4;
                          if (_$err)
                            throw _$err;
                          ret(null);
                          _$cont();
                        } catch (_$err) {
                          _$cont(_$err);
                        }
                      }.bind(this, arguments));
                    } catch (_$err) {
                      _$cont(_$err);
                    }
                  }.bind(this, arguments));
                } catch (_$err) {
                  _$cont(_$err);
                }
              }.bind(this, arguments));
            } catch (_$err) {
              _$cont(_$err);
            }
          }.bind(this, arguments));
        } catch (_$err) {
          _$cont(_$err);
        }
      }.bind(this, arguments));
    } catch (_$err) {
      _$cont(_$err);
    }
  }(function (err) {
    if (err !== undefined) {
      ret(err);
    }
  }));
}
function copyDirectories(src, des, ret) {
  var err, counter;
  fs.rmdir(des, function (arguments, _$param5) {
    err = _$param5;
    if (err) {
      ret(err);
    }
    counter = 1;
    function copyRecursive(src, des, ret) {
      var _$err, stats, files, i, _$itmp_list, _$itmp, to;
      (function (_$cont) {
        try {
          fs.stat(src, function (arguments, _$param6, _$param7) {
            try {
              _$err = _$param6;
              stats = _$param7;
              if (_$err)
                throw _$err;
              (function (_$cont) {
                try {
                  if (stats.isDirectory()) {
                    var _$parallel_done_0 = 0;
                    var _$errors_0 = [];
                    (function (_$cont) {
                      try {
                        fs.readdir(src, function (arguments, _$param8, _$param9) {
                          try {
                            ++_$parallel_done_0;
                            _$err = _$param8;
                            files = _$param9;
                            if (_$err)
                              throw _$err;
                            _$cont();
                          } catch (_$err) {
                            _$cont(_$err);
                          }
                        }.bind(this, arguments));
                        fs.mkdir(des, function (arguments, _$param10) {
                          try {
                            ++_$parallel_done_0;
                            _$err = _$param10;
                            if (_$err)
                              throw _$err;
                            _$cont();
                          } catch (_$err) {
                            _$cont(_$err);
                          }
                        }.bind(this, arguments));
                      } catch (_$err) {
                        _$cont(_$err);
                      }
                    }(function (_$err) {
                      try {
                        if (_$err)
                          _$errors_0.push(_$err);
                        if (_$parallel_done_0 !== 2)
                          return;
                        if (_$errors_0.length > 0)
                          throw _$errors_0;
                        _$parallel_done_0 = undefined;
                        _$err = undefined;
                        _$errors_0 = undefined;
                        counter += files.length;
                        _$itmp_list = [];
                        for (i in files) {
                          _$itmp_list.push(i);
                        }
                        _$itmp = 0;
                        while (_$itmp < _$itmp_list.length) {
                          i = _$itmp_list[_$itmp];
                          copyRecursive(src + '/' + files[i], des + '/' + files[i], ret);
                          ++_$itmp;
                        }
                        counter--;
                        ret(null);
                        _$cont();
                      } catch (_$err) {
                        _$cont(_$err);
                      }
                    }));
                  } else {
                    fs.readlink(src, function (arguments, _$param11, _$param12) {
                      try {
                        _$err = _$param11;
                        to = _$param12;
                        if (_$err)
                          throw _$err;
                        fs.symlink(to, des, function () {
                          counter--;
                          ret(null);
                        });
                        _$cont();
                      } catch (_$err) {
                        _$cont(_$err);
                      }
                    }.bind(this, arguments));
                  }
                } catch (_$err) {
                  _$cont(_$err);
                }
              }(function (_$err) {
                try {
                  if (_$err !== undefined)
                    return _$cont(_$err);
                  _$cont();
                } catch (_$err) {
                  _$cont(_$err);
                }
              }));
            } catch (_$err) {
              _$cont(_$err);
            }
          }.bind(this, arguments));
        } catch (_$err) {
          _$cont(_$err);
        }
      }(function (err) {
        if (err !== undefined) {
          ret(err);
        }
      }));
    }
    copyRecursive(src, des, function (err) {
      if (err) {
        ret(err);
      } else {
        if (counter == 0) {
          ret(null);
        }
      }
    });
  }.bind(this, arguments));
}
function InitStorage(path, ret) {
  var err, _$err, storage;
  fs.mkdir(path, function (arguments, _$param13) {
    err = _$param13;
    if (err && err.code != 'EEXIST') {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.mkdir(path + '/.MFS', function (arguments, _$param14) {
          try {
            _$err = _$param14;
            if (_$err)
              throw _$err;
            fs.mkdir(path + '/snapshots', function (arguments, _$param15) {
              try {
                _$err = _$param15;
                if (_$err)
                  throw _$err;
                storage = {
                  'date': getCurrentDate(new Date()),
                  'path': path,
                  'opno': 0
                };
                storageSetPathName(storage);
                storageCreateDirectories(storage);
                storageAddMethod(storage);
                ret(null, storage);
                _$cont();
              } catch (_$err) {
                _$cont(_$err);
              }
            }.bind(this, arguments));
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function ReloadStorage(path, ret) {
  var storage, _$err, data, i, _$itmp_list, _$itmp;
  storage = {
    'date': getCurrentDate(new Date()),
    'path': path
  };
  storageSetPathName(storage);
  (function (_$cont) {
    try {
      fs.readFile(storage.curSnapshot + 'MFS.log', { 'encoding': 'utf8' }, function (arguments, _$param16, _$param17) {
        try {
          _$err = _$param16;
          data = _$param17;
          if (_$err)
            throw _$err;
          storage.opno = 0;
          _$itmp_list = [];
          for (i in data) {
            _$itmp_list.push(i);
          }
          _$itmp = 0;
          while (_$itmp < _$itmp_list.length) {
            i = _$itmp_list[_$itmp];
            if (data[i] == '\n') {
              storage.opno++;
            }
            ++_$itmp;
          }
          storageCreateLogStream(storage, function (arguments, _$param18) {
            try {
              _$err = _$param18;
              if (_$err)
                throw _$err;
              storageAddMethod(storage);
              ret(null, storage);
              _$cont();
            } catch (_$err) {
              _$cont(_$err);
            }
          }.bind(this, arguments));
        } catch (_$err) {
          _$cont(_$err);
        }
      }.bind(this, arguments));
    } catch (_$err) {
      _$cont(_$err);
    }
  }(function (err) {
    if (err !== undefined) {
      ret(err);
    }
  }));
}
function mkdir(path, ret) {
  var err, self, date, _$err;
  storageBackupDaily(this, function (arguments, _$param19, _$param20, _$param21) {
    err = _$param19;
    self = _$param20;
    date = _$param21;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.mkdir(self.curData + path, function (arguments, _$param22) {
          try {
            _$err = _$param22;
            if (_$err)
              throw _$err;
            log('mkdir ' + path, date, self);
            ret();
            _$cont();
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function write(path, buffer, ret) {
  var err, self, date, MFSPath, i, _$err, exists;
  storageBackupDaily(this, function (arguments, _$param23, _$param24, _$param25) {
    err = _$param23;
    self = _$param24;
    date = _$param25;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        MFSPath = '';
        i = 0;
        while (i < path.length) {
          if (path[i] == '/') {
            MFSPath += '.';
          } else {
            MFSPath += path[i];
          }
          i++;
        }
        fs.writeFile(self.curMFS + MFSPath + self.opno, buffer, function (arguments, _$param26) {
          try {
            _$err = _$param26;
            if (_$err)
              throw _$err;
            fs.exists(self.curData + path, function (arguments, _$param27) {
              try {
                exists = _$param27;
                (function (_$cont) {
                  try {
                    if (exists) {
                      fs.unlink(self.curData + path, function (arguments, _$param28) {
                        try {
                          _$err = _$param28;
                          if (_$err)
                            throw _$err;
                          _$cont();
                        } catch (_$err) {
                          _$cont(_$err);
                        }
                      }.bind(this, arguments));
                    } else {
                      _$cont();
                    }
                  } catch (_$err) {
                    _$cont(_$err);
                  }
                }(function (_$err) {
                  try {
                    if (_$err !== undefined)
                      return _$cont(_$err);
                    fs.symlink(self.curMFS + MFSPath + self.opno, self.curData + path, function (arguments, _$param29) {
                      try {
                        _$err = _$param29;
                        if (_$err)
                          throw _$err;
                        log('write ' + path, date, self);
                        ret();
                        _$cont();
                      } catch (_$err) {
                        _$cont(_$err);
                      }
                    }.bind(this, arguments));
                  } catch (_$err) {
                    _$cont(_$err);
                  }
                }));
              } catch (_$err) {
                _$cont(_$err);
              }
            }.bind(this, arguments));
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function move(oldPath, newPath, ret) {
  var err, self, date, _$err;
  storageBackupDaily(this, function (arguments, _$param30, _$param31, _$param32) {
    err = _$param30;
    self = _$param31;
    date = _$param32;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.rename(self.curData + oldPath, self.curData + newPath, function (arguments, _$param33) {
          try {
            _$err = _$param33;
            if (_$err)
              throw _$err;
            log('move ' + oldPath + ' ' + newPath, date, self);
            ret();
            _$cont();
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function remove(path, ret) {
  var err, self, date, absPath, _$err, stats;
  storageBackupDaily(this, function (arguments, _$param34, _$param35, _$param36) {
    err = _$param34;
    self = _$param35;
    date = _$param36;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        absPath = self.curData + path;
        fs.stat(absPath, function (arguments, _$param37, _$param38) {
          try {
            _$err = _$param37;
            stats = _$param38;
            if (_$err)
              throw _$err;
            (function (_$cont) {
              try {
                if (stats.isDirectory()) {
                  fs.rmdir(absPath, function (arguments, _$param39) {
                    try {
                      _$err = _$param39;
                      if (_$err)
                        throw _$err;
                      _$cont();
                    } catch (_$err) {
                      _$cont(_$err);
                    }
                  }.bind(this, arguments));
                } else {
                  fs.unlink(absPath, function (arguments, _$param40) {
                    try {
                      _$err = _$param40;
                      if (_$err)
                        throw _$err;
                      _$cont();
                    } catch (_$err) {
                      _$cont(_$err);
                    }
                  }.bind(this, arguments));
                }
              } catch (_$err) {
                _$cont(_$err);
              }
            }(function (_$err) {
              try {
                if (_$err !== undefined)
                  return _$cont(_$err);
                log('remove ' + path, date, self);
                ret();
                _$cont();
              } catch (_$err) {
                _$cont(_$err);
              }
            }));
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function list(path, ret) {
  var err, self, date, _$err, files;
  storageBackupDaily(this, function (arguments, _$param41, _$param42, _$param43) {
    err = _$param41;
    self = _$param42;
    date = _$param43;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.readdir(self.curData + path, function (arguments, _$param44, _$param45) {
          try {
            _$err = _$param44;
            files = _$param45;
            if (_$err)
              throw _$err;
            ret(null, files);
            _$cont();
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function read(path, ret) {
  var err, self, date, _$err, buffer;
  storageBackupDaily(this, function (arguments, _$param46, _$param47, _$param48) {
    err = _$param46;
    self = _$param47;
    date = _$param48;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.readFile(self.curData + path, function (arguments, _$param49, _$param50) {
          try {
            _$err = _$param49;
            buffer = _$param50;
            if (_$err)
              throw _$err;
            ret(null, buffer);
            _$cont();
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function stat(path, ret) {
  var err, self, date, _$err, stats;
  storageBackupDaily(this, function (arguments, _$param51, _$param52, _$param53) {
    err = _$param51;
    self = _$param52;
    date = _$param53;
    if (err) {
      ret(err);
    }
    (function (_$cont) {
      try {
        fs.lstat(self.curData + path, function (arguments, _$param54, _$param55) {
          try {
            _$err = _$param54;
            stats = _$param55;
            if (_$err)
              throw _$err;
            ret(null, stats);
            _$cont();
          } catch (_$err) {
            _$cont(_$err);
          }
        }.bind(this, arguments));
      } catch (_$err) {
        _$cont(_$err);
      }
    }(function (err) {
      if (err !== undefined) {
        ret(err);
      }
    }));
  }.bind(this, arguments));
}
function storageBackupDaily(storage, ret) {
  var date, oldData, err;
  date = new Date();
  (function (_$cont) {
    if (getCurrentDate(date) > storage.date) {
      oldData = storage.curData;
      storage.date = getCurrentDate(date);
      storageSetPathName(storage);
      fs.unlink(storage.path + '/current', function (arguments, _$param56) {
        err = _$param56;
        if (err) {
          ret(err);
        }
        storage.slog.end('What a good day!\n', 'utf8');
        storageCreateDirectories(storage, function (arguments, _$param57) {
          err = _$param57;
          if (err) {
            ret(err);
          }
          copyDirectories(oldData, storage.curData, function (arguments, _$param58) {
            err = _$param58;
            if (err) {
              ret(err);
            }
            _$cont();
          }.bind(this, arguments));
        }.bind(this, arguments));
      }.bind(this, arguments));
    } else {
      _$cont();
    }
  }(function (_$err) {
    if (_$err !== undefined)
      return _$cont(_$err);
    storage.opno = 0;
    ret(null, storage, new Date());
  }));
}
exports.init = InitStorage();
exports.reload = ReloadStorage();
/* Generated by Continuation.js v0.1.4 */
//@ sourceMappingURL=MFS.compiled.js.map