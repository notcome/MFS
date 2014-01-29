#MFS.js

##Overview
MFS.js is a simple persistent file manage system. It supports files and directories I/O. There is a log system used to keep track of file changes.

As you may notice, it is written with Continuation.js. ``MFS.compiled.js`` is the compiled version.

##Usage
This project hasn't been uploaded to ``npm``. You could download it and install locally.

To handle a ``repository``, you need to initiate it firstly. The directory must be empty.

```Javascript
var mfs = require('mfs');

//To init a repository.
var repo1 = mfs.InitStorage('~/Media/MFS');
```

You could also reload an existing repository.

```Javascript
//To reload a existing repository.
var repo2 = mfs.ReloadStorage('~/Novels/MFS');
```

Below is a list of operations available.

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

``.MFS`` is where files are stored. It has many subdirectories classified based on date. A file whose path is ``dir1/dir2/dir3/file`` will be stored with filename ``dir1.dir2.dir3.file.suffix``. Currently the suffix is the opno (operation number).

``snapshots`` keeps the snapshots of the repository. In a snapshot there will be a ``MFS.log`` and a ``data`` directory. All files are in the ``data`` directory and are symbolic links refered to ``.MFS``.

``current`` is a symbolic link refering to the ``data`` directory of the latest snapshot.

Following is a ``MFS.log`` file copied from my test repository.

```
[06:18:15:737] 0 : mkdir IOL-2010
[06:18:15:738] 1 : mkdir IOL-1234
[06:18:15:738] 2 : write a.txt
[06:18:15:739] 3 : write b.txt
[06:18:15:740] 4 : write c.txt
[06:18:15:740] 5 : write d.txt
[06:18:15:741] 6 : write IOL-2010/error
[06:18:15:741] 7 : write IOL-1234/error
[06:18:15:742] 8 : remove IOL-1234/error
[06:18:15:742] 9 : move d.txt IOL-1234/a.txt
[06:18:15:743] 10 : move IOL-2010 IOL-1234/IOL-2010
What a good day!
```

You must be able to understand how it works. I guess that it is not hard to implement the restore function.