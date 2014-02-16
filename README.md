#MFS.js

##Overview
MFS.js is a simple persistent file manage system. It supports files and directories I/O. There is a log system used to keep track of file changes.

##Usage
This project hasn't been uploaded to ``npm``. You could download it and install locally.

To handle a ``repository``, you need to either initiate one empty directory or reload an existing one:

```Javascript
var MFS = require('MFS');

MFS.initMFS(newPath, function (err, repo) {
  if (err) throw err;
  //do whatever you want:
  async.series([
    function (callback) { repo.mkdir('a', callback); },
    //2rd parameter must be a Buffer
    function (callback) { repo.write('b.txt', new Buffer('Hello'), callback); },
    function (callback) { repo.move('b.txt', 'c.txt', callback); },
    function (callback) { repo.remove('a', callback); }],
    errorHandler
  );
});

MFS.reloadMFS(oldPath, function (err, repo) {
  if (err) throw err;
  //do whatever you want.
  async.parallel([
    function (callback) { repo.list('a', callback); },
    function (callback) { repo.read('b.txt', callback); },
    function (callback) { repo.stat('c.txt', callback); }],
    dataHandler
  );
});
```

Below is the list of operations available.

```Javascript
mkdir (path, callback(err));
write (path, data, options callback(err));
move (oldPath, newPath, callback(err));
remove (path, callback(err));

list (path, callback(err, files));
read (path, options, callback(err, data));
stat (path, callback(err, stats));
```

##Restore to a historical version
Currently the function is not implemented, although the file structure supports it.

##How it works?
MFS is inspired by Apple's *Time Machine* but is much simpler. Each operation will be logged into a log file. The deleted files or the replaced ones will still be kept. To restore to a historical verison, MFS could follow the log's records. There is also a daily backup based on symbolic links.

Following is an imagined file structure.

```
/example/MFS/
-------------
|.MFS
-------------
  |2014-1-25
  -----------
  |2014-1-26
  -----------
  |2014-1-27
  -----------
    |black.jpg2
    ---------
    |black.jpg4
    ---------
|snapshots
-------------
  |2014-1-25
  -----------
    |MFS.log
    ---------
    |data
    ---------
  |2014-1-26
  -----------
  |2014-1-27
  -----------
|current
-------------
```

``.MFS`` is where files are stored. It has many subdirectories classified based on date. A file whose path is ``dir1/dir2/dir3/file`` will be stored with filename ``dir1.dir2.dir3.file@suffix``. Currently the ``@suffix`` is the opno (operation number).

``snapshots`` keeps the snapshots of the repository. In a snapshot there will be a ``MFS.log`` and a ``data`` directory. All files are in the ``data`` directory and are hard linked to ``.MFS``.

``current`` is a symbolic link refering to the ``data`` directory of the latest snapshot.

Following is a ``MFS.log`` file copied from my test repository.

```
Sat, 15 Feb 2014 04:48:13 GMT|mkdir::a
Sat, 15 Feb 2014 04:48:13 GMT|mkdir::a/b
Sat, 15 Feb 2014 04:48:13 GMT|write::a/c.txt
Sat, 15 Feb 2014 04:48:13 GMT|move::a/c.txt::a/b/c.txt
```

You must be able to understand how it works. I guess that it is not hard to implement the restore function.