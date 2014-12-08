#!/usr/local/bin/node

var tintExecutableWindows = '@@@TINT_WINDOWS_EXECUTABLE@@@',
  tintExecutableOSX = '@@@TINT_OSX_EXECUTABLE@@@',
  tintExecutableLinux = '@@@TINT_LINUX_EXECUTABLE@@@',
  baseDirectory = process.cwd(),
  outputDirectory = baseDirectory+'/'+'build',
  resourceDirectory = outputDirectory + '/'+'tmp',
  sourceDirectory = null,
  pa = require('path'),
  fs = require('fs'),
  os = require('os'),
  zlib = require('zlib'),
  util = require('util'),
  Stream = require('stream');

/// Main Tint Compile/Build Control Functions ///

$tint = {};
if(typeof(window) == 'undefined') window = {}; // incase we're in a html context, its odd, i know.

$tint.loadbuilder=function(path,onError,onWarning,onProgress,onSuccess,onStart) {
  if(!$tint.file(path)) throw new Error("The path "+path+" was not found or is not a file.");
  if(!onError) onError = function(e){ if(e.stack) console.log(e.stack); else console.log('Error: '+e); }.bind(window);
  if(!onWarning) onWarning = function(e){console.log('Warning: '+e);}.bind(window);
  if(!onProgress) onProgress = function(e){console.log('Progress '+e);}.bind(window);
  if(!onSuccess) onSuccess = function(e){console.log('Success');}.bind(window);
  if(!onStart) onStart = function(e){console.log('Start '+e);}.bind(window);
  var b = new $tint.builder(onError,onWarning,onProgress,onSuccess,onStart); 
  try {
    var pjdata = $tint.read(path).toString('utf8');
    var packagejson = JSON.parse(pjdata);
  } catch(e) {
    onError(e, 'The format of the package.json file has a syntax error\n'+$tint.read(path));
  }
  b.data=$tint.mergeobjs(b.data,packagejson);
  b.data.sources.directory=$tint.absolute(b.data.sources.directory,'.');
  sourceDirectory = baseDirectory + '/' + $tint.absolute($tint.dotdot(path),b.data.sources.directory);
  // outputDirectory=$tint.absolute(outputDirectory,pathDir); 
  b.data.icon.osx[0]=$tint.absolute(b.data.icon.osx[0],sourceDirectory);
  b.data.icon.windows[0]=$tint.absolute(b.data.icon.windows[0],sourceDirectory);
  b.manifest = path;
  return b; 
};

$tint.builder = function(onError,onWarning,onProgress,onSuccess,onStart) {
  return {
    onError:onError,
    onWarning:onWarning,
    onProgress:onProgress,
    onSuccess:onSuccess,
    onStart:onStart,
    tasks:[],
    data:[],
    packageheader:[],
    windowsicon:[],
    macosxicon:[],
    checkdata:function () {
      if (!$tint.exists(outputDirectory, false)) {
        $tint.makedir(outputDirectory);
      }
      if (!$tint.exists(resourceDirectory, false)) {
        $tint.makedir(resourceDirectory);
      }
      if (this.data.name.trim() === "") throw new Error("The bundle name must be a valid file name without an extension or special characters.");
      if (!this.data.version) throw new Error("The version number does not exist.");
      if (!this.data.sources) throw new Error("A source directory has not been selected.");
      if (this.data.longname.trim() === "") throw new Error("The long name is invalid");
      if ($tint.ndef(this.data.icon.osx) || !$tint.file(this.data.icon.osx[0]) || this.data.icon.osx[0].indexOf(".png") == -1)
          throw new Error("Select an icon (as a PNG image) to build an application.");
        if ($tint.ndef(this.data.icon.windows) || !$tint.file(this.data.icon.windows[0]) || this.data.icon.windows[0].indexOf(".png") == -1)
          throw new Error("Select an icon (as a PNG image) to build an application.");
        if (this.data.namespace.trim() == "") throw new Error("The namespace field is required.");
        if (!$tint.exists($tint.path([sourceDirectory,this.data.sources.directory.trim(),this.data.main.trim()]))) throw new Error("A main.js file is required n the root of your source directory.");
        },
    config:function() {
      var obj = {};
      // Determine from our process where the resources directory may be, 
      // give a few options to check before giving up.
      var runproc = process.execPath.split(pa.sep);
      // Create build configuration
      obj.srcex= !this.data.sources.exclude ? null : this.data.sources.exclude;
      obj.dstdir=outputDirectory;
      obj.manifest = this.manifest;
      obj.srcdir=$tint.path([sourceDirectory,this.data.sources.directory]);
      obj.pkgmid=$tint.path([obj.dstdir, 'Package']);
      obj.runtime=$tint.path([obj.rescdir, 'Runtime']);
      obj.macapp=$tint.path([outputDirectory, 'MacOS X', this.data.name + '.app']);
      obj.winapp=$tint.path([outputDirectory, 'Windows', this.data.name + '.exe']);
      obj.main=$tint.path([this.data.sources.directory,this.data.main]);
      var maccontents = $tint.path([obj.macapp,'Contents']);
      var macresources = $tint.path([maccontents,'Resources']);
      var macframeworks = $tint.path([maccontents,'Frameworks']);
      obj.macinfo=$tint.path([maccontents, 'Info.plist']);
      obj.macicon=$tint.path([macresources, 'app.icns']);
      obj.macpkgdst=$tint.path([macresources, 'Package']);
      obj.perms=[ $tint.path([maccontents, 'MacOS', 'Runtime']) ];
      obj.icon=$tint.path([this.data.icon]);
      // Create a list of what to prepare for packaging
      var files = $tint.getfiles(obj.srcdir);
      obj.toprepare=obj.topackage=files
        .filter(function (e) { return !e.match(obj.srcex); })
        .map(function(e){
          return $tint.getpaths(e,resourceDirectory,sourceDirectory); 
        });
        //   filter out excemptions.
        //
        //   create absolute & relative in/out paths.
        //.map(function(e) {return $tint.getpaths(e,obj.dstdir,obj.srcdir); })
        //   filter out anything going to the destination directory.
        //.filter(function(e) { return !$tint.issubdir(e.absin,outputDirectory); }.bind(this))
        //   add manifest, wrapper information and resources. 
        //  .concat([$tint.getpaths(obj.manifest,'.', '.')])
        //  .concat($tint.resources.map(function(e){return $tint.getpaths(e,obj.dstdir,obj.rescdir);}));
      // Create a list for the pre-checks needed to succeed. Files that need to be removed, 
      // Directories that should exist prior to running, files that should exist prior to running.
      obj.prechecks={
        //  Old: remove:[obj.dstdir,obj.macapp,obj.winapp,obj.pkgmid].concat(obj.topackage.map(function(e){return e.absout+'.o';})),
        remove:[obj.macapp,obj.winapp,obj.pkgmid],
        dirs:[obj.srcdir,obj.dstdir],
        files:obj.topackage//.concat([$tint.path([obj.srcdir,obj.main])])
      };
      return obj;
    },
    reset:function() { this.tasks=[]; this.packageheader=[]; },
    tick:function(e) { if(e) this.onProgress(e); if(this.tasks.length){var task=this.tasks.shift(); setTimeout(function(){try{task.bind(this)();}catch(e){return this.onError(e);}}.bind(this),10);}},
    play:function() { this.onStart(this.tasks.length); this.tick(); },
    stop:function() { this.tasks = [function(e){this.onError('build was stopped.');}.bind(this)]; },
    running:function() { return this.tasks.length !== 0; },
    prepclean:function() {
      try {
        this.packageheader = [];
        this.checkdata();
        this.conf = this.config();
        var packclean = function(b){this.tasks.push(function(){
          //$tint.remove(b.absout+'.o');
          //this.tick("cleaning files "+b.absout+'.o');
          $tint.remove(b.absout);
          this.tick("cleaning files "+b.absout);
        }.bind(this));};
        this.conf.topackage.forEach(packclean.bind(this));
        this.tasks=this.tasks.concat([
          function(){ $tint.remove(this.conf.macapp); this.tick("cleaning macosx application"); }.bind(this),
          function(){ $tint.remove(this.conf.winapp); this.tick("cleaning windows application"); }.bind(this),
          function(){ $tint.remove(this.conf.pkgmid); this.tick("cleaning temporary package"); }.bind(this)
        ]);
      } catch(e) { this.onError(e); return false; }
      return true;
    },
    prepconfig:function() {
      try {
        this.checkdata();
        this.conf = this.config();
      } catch(e) { this.onError(e); return false; }
      return true;
    },
    prepobj:function () {
      try {
        // Get the configuration, this has already been validated.
        var prepfunc = function(b){
          this.tasks.push(function() {
            // If the input file is newer, or larger, rebuild. 
            var fin = $tint.minfo(b.absin);
            //var fout = ($tint.exists(b.absout+'.o')) ? $tint.minfo(b.absout+'.o') : null;
            var fout = ($tint.exists(b.absout)) ? $tint.minfo(b.absout) : null;
            if(fout === null || (fin.mtime.getTime() > fout.mtime.getTime())) {
              //$tint.remove(b.absout+'.o');
              $tint.remove(b.absout);
              $tint.makepath($tint.dotdot(b.absout));
              $tint.copy(b.absin,b.absout);
              //$tint.compress(b.absin,b.absout+'.o',
              //$tint.compress(b.absin,b.absout,
              //  function(){
              //    this.tick("packaging "+b.relin);
              //  }.bind(this),
              //  function(e){
              //    this.onError(e);
              //  }.bind(this)
              //);
              this.tick("packaging "+b.relin);
            } else 
              this.tick("skipped packing "+b.relin+ " (no changes)");
          }.bind(this));
        };
        var packfunc = function(b){
          this.tasks.push(function(){
            this.onProgress("linking "+b.relname); 
            //this.packageheader.push($tint.appendpkg(b.absout+'.o', b.relname, this.conf.pkgmid, this.packageExecSize)); 
            //this.packageheader.push($tint.appendpkg(b.absout, b.relname, this.conf.pkgmid, this.packageExecSize)); 
            this.tick();
          }.bind(this));
        };
        // Pre-package, read in data, write out temporary files, perform pre-checks to ensure a safe build.
        this.conf.prechecks.remove.forEach(function(e){
          this.tasks.push(function(){
            this.onProgress("validating to remove ["+e+"]");
            $tint.remove(e);
            this.tick();
          }.bind(this));
        }.bind(this));
        //this.tasks.push(function(){$tint.copy(this.conf.manifest,$tint.packagejson(this.data));this.tick("Writing Manifest");}.bind(this));
        this.conf.prechecks.dirs.forEach(function(e){
          this.tasks.push(function(){
            this.onProgress("validating directory ["+e+"]"); 
            $tint.exists(e,false,"Directory does not exist: %s");
            this.tick();
          }.bind(this));
        }.bind(this));
        this.conf.prechecks.files.forEach(function(e){
          this.tasks.push(function(){
            this.onProgress("validating file ["+e.absin+"]");
            $tint.exists(e.absin,true,"File does not exist: %s");
            this.tick();
          }.bind(this));
        }.bind(this));
        // Compress or 'prepare' the objects to the destination folder.
        this.conf.toprepare.forEach(prepfunc.bind(this));
        // Package these by appending them to a package location with the stamped magic key/file size.
        this.conf.topackage.forEach(packfunc.bind(this));
        // Remove temporary files
        //this.tasks=this.tasks.concat([
          //$tint.remove(this.conf.manifest); 
        //  function(){ this.tick("cleaning up"); }.bind(this)
        //]);
      } catch (e) { 
        this.onError(e); 
        return false; 
      }
      return true;
    },
    prepwin:function() {
      var winExec = new Buffer(tintExecutableWindows, 'base64');
      this.packageExecSize = winExec.length;
      try {
      this.tasks=this.tasks.concat([
        function(){ this.pngdata=$tint.read(this.data.icon.windows[0]);this.tick("reading windows icon");}.bind(this),
        function(){ $tint.parsepng(this.pngdata,function(e){this.onError(e);}.bind(this),function(e){this.windowsiconlrg=e;this.tick("creating icon data"); }.bind(this));}.bind(this),
        function(){ 
          this.onProgress("creating windows application");
          $tint.makedir($tint.dotdot(this.conf.winapp));
          fs.writeFileSync(this.conf.winapp,winExec);
          this.tick();
          //$tint.copy(this.conf.runtime+'.exe',this.conf.winapp); this.tick("Creating Windows Application"); 
        }.bind(this),
        function(){
          // Append package header.
          //var pkg = new Buffer(JSON.stringify(this.packageheader));
          //fs.appendFileSync(this.conf.pkgmid, pkg);
          //var buf = new Buffer(8); //[this.packageExecSize, 0xbeefbeef]
          //buf.writeUInt32LE(this.packageExecSize,0);
          //buf.writeUInt32LE(0xdeadbeef,4);
          //fs.appendFileSync(this.conf.pkgmid, buf);
          // copy the package.
          //$tint.append(this.conf.winapp, this.conf.pkgmid); 
          this.tick("finalizing windows");
        }.bind(this),
        function(){
          this.onProgress("writing icon for windows");
          if(typeof(this.windowsicon)=='undefined'||this.windowsicon==null)
            this.windowsicon=new Array();
          var sizes = [16,32,48,64,128,256];
          sizes.forEach(function(size) {
            if(typeof(this.windowsicon[size])=='undefined')
              this.windowsicon[size]=$tint.resizeicon(this.windowsiconlrg, 512, 512, size);
          }.bind(this));
          //try {
            $tint.stampwindows(this.windowsicon, this.conf.winapp);
          //} catch (e) {
          //  this.onWarning('Failed to stamp windows icon.');
          //}

          $tint.copy(resourceDirectory,$tint.path([outputDirectory,'Windows','Resources']));
          // Icon reset and cache is currently disabled.
          //$tint.iconcache(this.onWarning); 
          // Writing the manifest information is disabled and not, especiially functional..
          //try {
            this.onProgress("writing manifest for windows");
            $tint.winmanifest(this.conf.winapp, this.data);
          //} catch (e) {
          //  this.onWarning('Failed to write manifest data to windows application.');
          //}
          this.tick(); 
        }.bind(this)
      ]);
      } catch(e) { this.onError(e); return false; }
      return true;
    },
    prepmac:function() {
      var macExec = new Buffer(tintExecutableOSX, 'base64');
      this.packageExecSize = 0;//macExec.length;
      try {
      this.tasks=this.tasks.concat([
        function(){ this.macosxicon=$tint.read(this.data.icon.osx[0]);this.tick("reading macosx icon");}.bind(this),
        function(){ 
          this.onProgress("creating macosx application");
          //$tint.copy(this.conf.runtime+'.app',this.conf.macapp);
          $tint.makedir($tint.dotdot(this.conf.macapp));
          $tint.makedir(this.conf.macapp);
          $tint.makedir($tint.path([this.conf.macapp,'Contents']));
          //$tint.makedir($tint.path([this.conf.macapp,'Contents','Resources']));
          $tint.makedir($tint.path([this.conf.macapp,'Contents','MacOS']));
          $tint.makedir($tint.path([this.conf.macapp,'Contents','Frameworks']));
          fs.writeFileSync($tint.path([this.conf.macapp, 'Contents','MacOS','Runtime']), macExec);
          this.tick();
        }.bind(this),
        function(){
          this.onProgress("finalizing macosx");
          $tint.copy(resourceDirectory,$tint.path([this.conf.macapp,'Contents','Resources']));
          // Append package header.
          //var pos = fs.statSync(this.conf.pkgmid).size;
          //var pkg = new Buffer(JSON.stringify(this.packageheader));
          //fs.appendFileSync(this.conf.pkgmid, pkg);
          //var buf = new Buffer(8); //[this.packageExecSize, 0xbeefbeef]
          //buf.writeUInt32LE(pos,0);
          //buf.writeUInt32LE(0xdeadbeef,4);
          //fs.appendFileSync(this.conf.pkgmid, buf);
          // copy the package.
          //$tint.copy(this.conf.pkgmid, $tint.makepath($tint.dotdot(this.conf.macpkgdst))); 
          this.tick();
        }.bind(this),
        function(){ 
          this.onProgress("stamping macosx");
          $tint.write(this.conf.macinfo, $tint.manifest(this.data)); 
          this.tick(); 
        }.bind(this),
        function(){ if(os.platform()=='darwin') { this.conf.perms.forEach(function(e){ fs.chmodSync(e,'755'); }.bind(this)); } this.tick("fixing permissions"); }.bind(this),
        function(){ $tint.stampmacosx(this.macosxicon, this.conf.macicon); this.tick("writing icon for macosx"); }.bind(this)
      ]);
      } catch(e) { this.onError(e); return false; }
      return true;
    },
    preplinux:function() {
      // TODO...
    },
    postbuild:function() {
      try {
        this.tasks.push(function(){ this.onSuccess(); }.bind(this));
      } catch (e) { this.onError(e); return false; }
      return true;
    }
  };
}



/// Individual Helper Functions ///
$tint.objcopy=function(obj) {
  return JSON.parse(JSON.stringify(obj));
}
$tint.ndef=function(e){ 
  if(typeof(e)=='undefined' || e==null || e=='' || e==0 || e==false) return true; 
  else return false; 
}
$tint.def=function(e) {
  if(typeof(e)!='undefined' && e!=null && e!='' && e!=0 && e!=false) return true;
  else return false;
}
$tint.remove=function(path) {
  if(fs.existsSync(path)) {
    if(fs.statSync(path).isDirectory()) {
      var files = fs.readdirSync(path);
      files.forEach(function(file,index){ $tint.remove(pa.join(path,file)); });
      fs.rmdirSync(path);
    } else fs.unlinkSync(path);

    if(fs.existsSync(path)) throw new Error('File or directory could not be removed: '+path);
  }
  return path;
}
$tint.file=function(f) { return fs.existsSync(f) && fs.statSync(f).isFile(); }
$tint.dir=function(d) { return fs.existsSync(d) && fs.statSync(d).isDirectory(); }
$tint.issubdir=function(issub,isparent) {
  if($tint.isrelative(isparent)) 
    throw new Error('Determining parent and child sub directories when parent is relative is not allowed.');
  else if ($tint.isrelative(issub)) {
    var target = $tint.paths([isparent,issub]);
    return $tint.exists(target);
  } else {
    if( $tint.exists(pa.normalize(issub)) && 
      $tint.exists(pa.normalize(issub)) &&
      pa.normalize(isparent).indexOf(pa.normalize(issub))!=-1) 
    return true;
    else return false;
  }
}
$tint.isrelative=function(qdir) { return (qdir[1]==':'||qdir[0]=='/'||qdir[0]=='\\') ? false : true; }
$tint.read=function(___file) { return fs.readFileSync(___file); }
$tint.dotdot=function(e) { return pa.dirname(e); }
$tint.write=function(__file,_data) {
  $tint.makepath($tint.dotdot(__file));
  fs.writeFileSync(__file,_data);
}
$tint.copy=function(src,dst) {
  var filetodir=function(src,dst) {
    var paths=src.split(pa.sep);
    return filetofile(src,pa.join(dst,paths[paths.length-1]));
  };
  var filetofile=function(src,dst) {
    var bytes=1,buf=new Buffer(64*1024),fdr=fs.openSync(src,'r'),fdw=fs.openSync(dst,'w');
    while(fs.writeSync(fdw,buf,0,fs.readSync(fdr,buf,0,buf.length,null)));
    fs.fchmodSync(fdw,$tint.info(src).fileinfo.mode);
    fs.closeSync(fdr); fs.closeSync(fdw);
  };
  var dirtodir=function(src,dst) { 
    var files=$tint.getfiles(src);
    while(srcfile=files.pop()) { 
      var dstfile=pa.join(dst,srcfile.replace(src,''));
      $tint.makepath($tint.dotdot(dstfile));
      filetofile(srcfile,dstfile);
    }
  };
  if(fs.existsSync(dst) && fs.statSync(dst).isDirectory()) return (fs.statSync(src).isDirectory())?dirtodir(src,dst):filetodir(src,dst);
  else return (fs.statSync(src).isDirectory())?dirtodir(src,dst):filetofile(src,dst);
}
$tint.filesize=function(d) {
  var i = -1;
    var byteUnits = [' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];
    do { d = d / 1024; i++; } while (d > 1024);
    return Math.max(d, 0.1).toFixed(1) + byteUnits[i];
}
$tint.append=function(dst,src) {
  $tint.makepath($tint.dotdot(dst));
  var bytes=1,
    buf=new Buffer(64*1024),
    fdr=fs.openSync(src,'r'),
    fdw=fs.openSync(dst,'a+');
  while(fs.writeSync(fdw,buf,0,fs.readSync(fdr,buf,0,buf.length,null)))
    ;
  fs.closeSync(fdr); 
  fs.closeSync(fdw);
}
$tint.getfiles = function(dir) {
  var isdir=function(e){return fs.statSync(e).isDirectory();}, isfile=function(e){return !isdir(e);};
  var v=[], f=[dir];
  while(f.length) {
    var target=f.shift();
    var d=fs.readdirSync(target).map(function(e){
      return pa.join(target,e);
    });
    f = d.filter(isdir).concat(f);
    v = d.filter(isfile).concat(v);
  }
  return v;
}
$tint.exists=function(path,isfile,errormsg) {
  if($tint.ndef(isfile) && $tint.ndef(errormsg)) return fs.existsSync(path);
  if(!fs.existsSync(path) || fs.statSync(path).isDirectory() && isfile) throw new Error(errormsg.replace('%s',path));
  return path;
}
$tint.makedir=function(e){
  if(!fs.existsSync(e))
    fs.mkdirSync(e);return e;
}
$tint.makepath=function(path) {
  var dr = (path[1]==':') ? path.substring(0,2) : '';
  path = (path[1]==':') ? path.substring(2) : path;
  var paths = path.split(pa.sep), p=pa.sep;
  while(paths.length>1) {
    p=pa.join(p,paths.shift());
    $tint.makedir(dr+p);
  }
  return $tint.makedir(dr+pa.join(p,paths.shift()));
}
$tint.getpaths=function(file,dstdir,srcdir) {
  file = pa.normalize(file);
  dstdir = pa.normalize(dstdir);
  srcdir = pa.normalize(srcdir);
  return {
    absin:$tint.absolute(file,srcdir), 
    absout:$tint.absolute($tint.relative(file, srcdir), dstdir),
    relout:$tint.relative($tint.relative(file, srcdir), dstdir),
    relin:$tint.relative(file,srcdir),
    relname:$tint.relative(file,srcdir).replace(/\\/g,"/")
  };
}
$tint.path=function(ar) { return pa.normalize(ar.join(pa.sep)); }
$tint.relative2=function(file,base) {
  // FILE AND BASE MUST HAVE SOMETHING IN COMMON, OTHERWISE ITS
  // JUST THE FILE RETURNED.
  if((typeof(base)=='undefined' || base==null) && typeof(file)=='undefined' || file==null) throw new Error('Relative paths expected from no inputs.');
  if(typeof(base)=='undefined' || base==null) return file;
  if(typeof(file)=='undefined' || file==null) return base;

  var file_dr = (file[1]==':') ? file[0]+':' : ''; file=file.replace(file_dr, '');
  var base_dr = (base[1]==':') ? base[0]+':' : ''; base=base.replace(base_dr, '');
  if(file_dr!=base_dr) throw new Error('Cannot make a relative path from different drives.');

  file=file.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);
  base=base.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);

  if(fs.syncExists(file) && fs.statStync(file).isFile()) file = $tint.dotdot(file);
  if(fs.syncExists(base) && fs.statStync(base).isFile()) file = $tint.dotdot(base);

  if(base[0] != '/') throw new Error('Asked for a relative path where the base isnt absolute');
  if(file[0] != '/') throw new Error('Asked for a relative path where the file path isnt absolute');

  return file_dr+pa.relative(base,file);
}
$tint.relative=function(a,b) {
  if(typeof(b)=='undefined' || b==null) return a;
  a=a.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);
  b=b.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);
  if(a[0]==pa.sep || (a[1]==':' && b[1]==':')) {
    a=a.replace(b,'');
    if(a[0]==pa.sep) a=a.substring(1);
  }
  return pa.normalize(a);
}
$tint.absolute=function(a,b) {
  a=a.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);
  b=b.replace(/\\/g,pa.sep).replace(/\//g,pa.sep);
  if(a[0]!=pa.sep&&a[1]!=':') {
    a=pa.normalize(pa.join(b,a));
  }
  return a;
}
$tint.minfo=function(_file) { return fs.statSync(_file); }
$tint.info=function(_file,_base) { 
  return {
    fileinfo:fs.statSync(_file),
    full:_file,
    relative:$tint.relative(_file,_base)
  }; 
}
$tint.iconcache = function(warning) {
  if (os.platform() != 'darwin') {
    $tint.execute('C:\\windows\\system32\\ie4uinit4.exe',['-ClearIconCache'], false, false, function(e){},
      function(e){ if(warning) warning('Unable to refresh icon cache.\n\t'+e.toString()); },function(e){});
    $tint.execute('C:\\windows\\system32\\cmd.exe',['/e:on','/c','DEL','%localappdata%\\IconCache.db','/A'],false,false,function(e){},
      function(e){ if(warning) warning('Unable to delete icon cache.\n\t'+e.toString()); },function(e){});
  }
}
$tint.compress = function(src,dst,succ,err) {
  $tint.makepath($tint.dotdot(dst));
  if(fs.existsSync(dst)) throw new Error('Cannot compression file, it already exists ['+dst+']');
  var gzip=zlib.createGzip(),inp=fs.createReadStream(src),out=fs.createWriteStream(dst);
  inp.on('end',function(e){ succ(); }.bind(this)).on('error',function(e){ err(e); }.bind(this));
  inp.pipe(gzip).pipe(out);
}
$tint.appendpkg=function(file__,name__,pkgfile__,base) {
  throw new Error("currently incompatible");
  base = base || 0;
  //var keybf = new Buffer('\x20\x01\x77\x55\x66\x31'+name__+'\x20\x01\x77\x55\x66\x31');
  //var sizebf = new Buffer(8);
  var size = $tint.info(file__).fileinfo.size;
  var offset = base;
  if(fs.existsSync(pkgfile__))
    offset += $tint.info(pkgfile__).fileinfo.size;
  //sizebf.writeUInt32LE(size,0);
  //sizebf.writeUInt32LE(0,4);
  //fs.appendFileSync(pkgfile__,Buffer.concat([keybf,sizebf]));
  $tint.append(pkgfile__,file__);
  //console.log({packagefile:pkgfile__,name:name__,size:size,offset:offset});
  return {name:name__,size:size,offset:offset};
}
$tint.dirdiff = function(srcdir,dstdir,regfilt) {
  if(regfilt=='') regfilt=null;
  if(srcdir[srcdir.length-1]!=pa.sep)srcdir+=pa.sep;
  if(dstdir[dstdir.length-1]!=pa.sep)dstdir+=pa.sep;
  var compare = function(sfiles,dfiles,sbase,dbase) {
    var srconly = sfiles.filter(function(q){return !dfiles.some(function(w){return w==q;});});
    var srcnew = sfiles.forEach(function(q){return dfiles.some(function(w){ 
      return w==q && fs.statSync(pa.join(dbase,w)).ctime.getTime() < fs.statSync(pa.join(sbase,q)).ctime.getTime();
    });});
    if(!srconly) srconly=[]; if(!srcnew) srcnew=[];
    return srconly.concat(srcnew);
  };
  var srcfiles=$tint.getfiles(srcdir).filter(function(e){ return !e.match(regfilt); });
  var dstfiles=$tint.getfiles(dstdir).filter(function(e){ return !e.match(regfilt); });
  if(!srcfiles.length) return false;
  return compare(srcfiles,dstfiles,srcdir,dstdir);
}
//$tint.writepkg = function(files,base,pkgfile) {
//  $tint.remove(pkgfile);
//  while(file=files.shift())
//    $tint.appendpkg($tint.absolute(file,base)+'.o',$tint.relative(file,base),pkgfile);
//}
$tint.stampwindows = function(imgdata, dst) {
  var fd = fs.openSync(dst,'r+');
  var w = new WindowsExeFile(fd);
  w.WindowsExeRead();
  //var bf = new Buffer(4);
  //bf.writeUInt32LE(WindowsConst.SUBSYSTEM['WINDOWS_GUI'], 0);
  //fs.writeSync(fd, bf, 0, 4, w.SubsystemPosition);
  fs.closeSync(fd);

  var iconDb = w.Resources.Entries[0].Directory.Entries;
  for(var z=0; z < iconDb.length; z++) {
    var fd = fs.openSync(dst,'r+');
    var icon = iconDb[z].Directory.Entries[0].Data.Icon;
    var pos = icon.getDataPosition();
    var size = icon.biWidth;
    var dstBuffer = imgdata[size];
    var buf = new Buffer(size*size*4);
    for(var i=0; i < dstBuffer.length;i+=4) {
      var row = size-Math.floor(i/(4*size)), col = i%(size*4), index=(row-1)*(size*4)+col;
      r = dstBuffer[index];
      g = dstBuffer[index+1];
      b = dstBuffer[index+2];
      a = dstBuffer[index+3];
      buf.writeUInt8(b,i);
      buf.writeUInt8(g,i+1);
      buf.writeUInt8(r,i+2);
      buf.writeUInt8(a,i+3);
    }
    fs.writeSync(fd, buf, 0, buf.length, pos);
    fs.closeSync(fd);
  }
}
$tint.execute = function(exec,args,ischild,isapp,output,error,exit) {
  //var execd = (os.platform()=='darwin' && isapp) ? '/usr/bin/open' : exec;
  //var argsd = (os.platform()=='darwin' && isapp) ? ['-W',exec].concat(args) : args;
  var child = require('child_process').spawn(exec,args,{detached:ischild});
    child.stderr.on('data',error);
    child.stdout.on('data',output);
    child.on('exit',exit);
    child.on('error',error);
  if(!ischild) child.unref();
}
$tint.mergeobjs = function(obj1,obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}
$tint.stampmacosx = function(imgdata, dst) {
  var buffer = new Buffer(16);
  buffer.writeInt8(105,0);
  buffer.writeInt8(99,1);
  buffer.writeInt8(110,2);
  buffer.writeInt8(115,3);
  buffer.writeInt32BE(8+8+imgdata.length,4);
  buffer.writeInt8(105,8);
  buffer.writeInt8(99,9);
  buffer.writeInt8(48,10);
  buffer.writeInt8(57,11);
  buffer.writeInt32BE(8+imgdata.length,12);
  $tint.write(dst,Buffer.concat([buffer,new Buffer(imgdata)]));
}
$tint.parsepng = function(imgdata,errf,succf){ 
  var pngcodec = new PNG({filetype:4});
  pngcodec.on('metadata',function(meta) { 
    if(meta.width!=512 || meta.height!=512 || !meta.alpha) { 
      errf('Icon must be 512 by 512 pixels with an alpha channel.'); 
      throw new Error('PNGERR');
    } 
  });
  pngcodec.parse(imgdata, function(err,data) { 
    if(err) return errf('The specified icon could not be parsed: '+err); 
    succf(data.data);
  });
}
$tint.resizeicon = function(imgd_, h_, w_, dstw_) {
  var resizefunc = function(simg_, sw, sh, dw, dh, lobes) {
    var obj = {
      src:simg_,
      dst:{data:new Uint8Array(dw*dh*4)},
      lanczos:function(x) {
        if (x > lobes) return 0;
        x *= Math.PI;
        if (Math.abs(x) < 1e-16) return 1;
        var xx = x / lobes;
        return Math.sin(x) * Math.sin(xx) / x / xx;
      },
      ratio:sw / dw,
      rcp_ratio:2 / (sw / dw),
      range2:Math.ceil((sw / dw) * lobes / 2),
      cacheLanc:{},
      center:{},
      icenter:{},
      process:function(self, u) {
        self.center.x = (u + 0.5) * self.ratio;
        self.icenter.x = Math.floor(self.center.x);
        for (var v = 0; v < dh; v++) {
          self.center.y = (v + 0.5) * self.ratio;
          self.icenter.y = Math.floor(self.center.y);
          var a=0, r=0, g=0, b=0, z=0;
          for (var i = self.icenter.x - self.range2; i <= self.icenter.x + self.range2; i++) {
            if (i < 0 || i >= sw) continue;
            var f_x = Math.floor(1000 * Math.abs(i - self.center.x));
            if (!self.cacheLanc[f_x]) self.cacheLanc[f_x] = {};
            for (var j = self.icenter.y - self.range2; j <= self.icenter.y + self.range2; j++) {
              if (j < 0 || j >= sh) continue;
              var f_y = Math.floor(1000 * Math.abs(j - self.center.y));
              if (self.cacheLanc[f_x][f_y] == undefined) self.cacheLanc[f_x][f_y] = self.lanczos(Math.sqrt(Math.pow(f_x * self.rcp_ratio, 2) + Math.pow(f_y * self.rcp_ratio, 2)) / 1000);
              z += (self.cacheLanc[f_x][f_y] < 0) ? 0 : self.cacheLanc[f_x][f_y];
              r += (self.cacheLanc[f_x][f_y] < 0) ? 0 : self.cacheLanc[f_x][f_y] * self.src.data[(j * sw + i) * 4];
              g += (self.cacheLanc[f_x][f_y] < 0) ? 0 : self.cacheLanc[f_x][f_y] * self.src.data[(j * sw + i) * 4 + 1];
              b += (self.cacheLanc[f_x][f_y] < 0) ? 0 : self.cacheLanc[f_x][f_y] * self.src.data[(j * sw + i) * 4 + 2];
              a += (self.cacheLanc[f_x][f_y] < 0) ? 0 : self.cacheLanc[f_x][f_y] * self.src.data[(j * sw + i) * 4 + 3];
            }
          }
          self.dst.data[(v * dw + u) * 4] = r / z;
          self.dst.data[(v * dw + u) * 4 + 1] = g / z;
          self.dst.data[(v * dw + u) * 4 + 2] = b / z;
          self.dst.data[(v * dw + u) * 4 + 3] = a / z;
        }
        if (++u < dw) return self.process(self, u);
        else return self.dst.data;
      }
    };
    return obj.process(obj,0);
  };
  var dsth_ = Math.round(h_*dstw_/w_);
  return resizefunc({data:imgd_},w_,h_,dstw_,dsth_,3);
}

$tint.convtowinversion = function(str) {
  var v = str.split(".");
  var major = parseInt(v[0]);
  var minor = parseInt(v[1]);
  var patch = parseInt(v[2]);
  var build = 0;

  var ls = ((patch << 16) & 0xFFFF0000) + (build & 0x0000FFFF);
  var ms = ((major << 16) & 0xFFFF0000) + (minor & 0x0000FFFF);

  var buf = new Buffer(8);
  buf.writeUInt32LE(ms,0);
  buf.writeUInt32LE(ls,4);

  return buf;
}

$tint.writebindata = function(buf,target,pos) {
  var fd = fs.openSync(target,'r+');
  fs.writeSync(fd, buf, 0, buf.length, pos);
  fs.closeSync(fd);
}
$tint.convtoucs2 = function(str) {
  var z = [];
  for(var i=0; i < str.length && i < 111; i++) {
    z.push(str.charCodeAt(i));
    z.push(0);
  }
  for(var i=0; i < (110 - 2*z.length); i++) z.push(0);
  return new Buffer(z);
}

function recurseManifest(point, target, values) {
  for(var i=0; i < point.length ; i++) {
    var key = point[i].szKey.map(function(e){
      if(e[1] != '\u0000')
        return e[0] + e[1];
      else
        return e[0];
    }).join('');
    var pos = point[i].ValuePosition;
    switch(key)
    {
      case 'CompanyName':
        if(!values.author) console.warn('Warning: No author was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.author.substring(0,50)),target,pos);
        break;
      case 'FileDescription':
        if(!values.description) console.warn('Warning: No description was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.description.substring(0,50)),target,pos);
        break;
      case 'FileVersion':
        if(!values.version) console.warn('Warning: No version was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.version.substring(0,50)),target,pos);
        break;
      case 'InternalName':
        if(!values.name) throw new Error('A name for the product is required.');
        else $tint.writebindata($tint.convtoucs2(values.name.substring(0,50)),target,pos);
        break;
      case 'LegalCopyright':
        if(!values.copyright) console.warn('Warning: No copyright was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.copyright.substring(0,50)),target,pos);
        break;
      case 'OriginalFilename':
        if(!values.name) throw new Error('A name for the product is required.');
        else $tint.writebindata($tint.convtoucs2(values.name.substring(0,50)),target,pos);
        break;
      case 'ProductName':
        if(!values.longname) console.warn('No product name (longname) was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.longname.substring(0,50)),target,pos);
        break;
      case 'ProductVersion':
        if(!values.version) console.warn('No version was found in manifest.');
        else $tint.writebindata($tint.convtoucs2(values.version.substring(0,50)),target,pos);
        break;
      default:
        console.log('Unknown key found, unable to write value for ', key);
        break;
    }
    if(point[i].Children) recurseManifest(point[i].Children,target,values);
  }
}

$tint.winmanifest = function(target, values) {
  var fd = fs.openSync(target,'r+');
  var winexe = new WindowsExeFile(fd);
  winexe.WindowsExeRead();
  fs.closeSync(fd);
  var container = winexe.Resources.Entries[2].Directory.Entries[0].Directory.Entries[0].Data.VersionInfo.Children[0].Children[0].Children; //[0].Children
  recurseManifest(container,target,values);
  
}
$tint.manifest = function (data) {
    var infoPlist = '<?xml version="1.0" encoding="UTF-8"?>'+
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'+
    '<plist version="1.0">'+
    '<dict>'+
    ' <key>CFBundleDevelopmentRegion</key>'+
    ' <string>en</string>'+
    ' <key>CFBundleDocumentTypes</key>'+
    ' <array>'+
    '   <dict>'+
    '     <key>CFBundleTypeExtensions</key>'+
    '     <array>'+
    '       <string>{{extension}}</string>'+
    '     </array>'+
    '     <key>CFBundleTypeIconFile</key>'+
    '     <string>app.icns</string>'+
    '     <key>CFBundleTypeName</key>'+
    '     <string>{{displayname}} Document</string>'+
    '     <key>CFBundleTypeRole</key>'+
    '     <string>Viewer</string>'+
    '     <key>LSHandlerRank</key>'+
    '     <string>Owner</string>'+
    '   </dict>'+
    ' </array>'+
    ' <key>CFBundleExecutable</key>'+
    ' <string>Runtime</string>'+
    ' <key>CFBundleGetInfoString</key>'+
    ' <string>{{displayversion}} ({{buildnumber}})</string>'+
    ' <key>CFBundleIconFile</key>'+
    ' <string>app.icns</string>'+
    ' <key>CFBundleIdentifier</key>'+
    ' <string>{{namespace}}</string>'+
    ' <key>CFBundleInfoDictionaryVersion</key>'+
    ' <string>6.0</string>'+
    ' <key>CFBundleName</key>'+
    ' <string>{{bundlename}}</string>'+
    ' <key>CFBundlePackageType</key>'+
    ' <string>APPL</string>'+
    ' <key>CFBundleShortVersionString</key>'+
    ' <string>{{displayversion}}</string>'+
    ' <key>CFBundleVersion</key>'+
    ' <string>{{buildnumber}}</string>'+
    ' <key>LSMinimumSystemVersion</key>'+
    ' <string>10.6.0</string>'+
    ' <key>NSAppleScriptEnabled</key>'+
    ' <string>YES</string>'+
    ' <key>NSHumanReadableCopyright</key>'+
    ' <string>{{copyright}}</string>'+
  ' <key>NSMainNibFile</key>'+
  ' <string>MainMenu</string>'+ 
    // '  <key>LSUIElement</key>\n' +
  // '  <string>' + ((data.Dockless==true) ? '1' : '0') + '</string>\n' +
  ' <key>LSMultipleInstancesProhibited</key>\n' +
  ((data['single-instance']==true) ? '\t<true/>\n' : '\t<false/>\n') +
  ' <key>NSPrincipalClass</key>'+
  ' <string>NSApplication</string>'+
    ' <key>UTExportedTypeDeclarations</key>'+
    ' <array>'+
    '   <dict>'+
    '     <key>UTTypeConformsTo</key>'+
    '     <array>'+
    '       <string>public.data</string>'+
    '       <string>public.item</string>'+
    '       <string>{{namespace}}</string>'+
    '     </array>'+
    '     <key>UTTypeDescription</key>'+
    '     <string>{{displayname}} Document</string>'+
    '     <key>UTTypeIconFile</key>'+
    '     <string>app.icns</string>'+
    '     <key>UTTypeIdentifier</key>'+
    '     <string>{{namespace}}</string>'+
    '     <key>UTTypeReferenceURL</key>'+
    '     <string>{{website}}</string>'+
    '     <key>UTTypeTagSpecification</key>'+
    '     <dict>'+
    '       <key>com.apple.ostype</key>'+
    '       <string>{{extension-upper}}</string>'+
    '       <key>public.filename-extension</key>'+
    '       <array>'+
    '         <string>{{extension}}</string>'+
    '       </array>'+
    '       <key>public.mime-type</key>'+
    '       <string>application/x-{{extension}}</string>'+
    '     </dict>'+
    '   </dict>'+
    ' </array>'+
    '</dict>'+
    '</plist>';

    infoPlist=infoPlist.replace(/{{extension}}/g,data.extensions);
    infoPlist=infoPlist.replace(/{{namespace}}/g,data.namespace);
    infoPlist=infoPlist.replace(/{{displayname}}/g,data.longname);
    infoPlist=infoPlist.replace(/{{displayversion}}/g,data.version);
    infoPlist=infoPlist.replace(/{{copyright}}/g,data.copyright);
    infoPlist=infoPlist.replace(/{{website}}/g,data.website);
    infoPlist=infoPlist.replace(/{{bundlename}}/g,data.name);
    infoPlist=infoPlist.replace(/{{buildnumber}}/g,data.version.replace('.','').replace('.','').replace('.','').replace('-',''));
    if(data.extensions)
      infoPlist=infoPlist.replace(/{{extension-upper}}/g,data.extensions.toUpperCase());
    
    return infoPlist;
}
$tint.resources = [];




/// Reading and Writing PNG Files ///

var PngConsts = {
    PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    TYPE_IHDR: 0x49484452,
    TYPE_IEND: 0x49454e44,
    TYPE_IDAT: 0x49444154,
    TYPE_PLTE: 0x504c5445,
    TYPE_tRNS: 0x74524e53,
    TYPE_gAMA: 0x67414d41,
    COLOR_PALETTE: 1,
    COLOR_COLOR: 2,
    COLOR_ALPHA: 4
}
var ChunkStream = function() {
    Stream.call(this);
    this._buffers = [];
    this._buffered = 0;
    this._reads = [];
    this._paused = false;
    this._encoding = 'utf8';
    this.writable = true;
};
util.inherits(ChunkStream, Stream);
ChunkStream.prototype.read = function(length, callback) {
    this._reads.push({
        length: Math.abs(length),  // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
    });
    this._process();
    if (this._paused && this._reads.length > 0) {
        this._paused = false;
        this.emit('drain');
    }
};
ChunkStream.prototype.write = function(data, encoding) {
    if (!this.writable) {
        this.emit('error', new Error('Stream not writable'));
        return false;
    }
    if (!Buffer.isBuffer(data)) data = new Buffer(data, encoding || this._encoding);
    this._buffers.push(data);
    this._buffered += data.length;
    this._process();
    if (this._reads && this._reads.length == 0)
        this._paused = true;
    return this.writable && !this._paused;
};
ChunkStream.prototype.end = function(data, encoding) {
    if (data) this.write(data, encoding);
    this.writable = false;
    if (!this._buffers) return;
    if (this._buffers.length == 0) {
        this._end();
    } else {
        this._buffers.push(null);
        this._process();
    }
};
ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
ChunkStream.prototype._end = function() {
    if (this._reads.length > 0)
        this.emit('error',  new Error('There are some read requests waitng on finished stream'));
    this.destroy();
};
ChunkStream.prototype.destroy = function() {
    if (!this._buffers) return;
    this.writable = false;
    this._reads = null;
    this._buffers = null;
    this.emit('close');
};
ChunkStream.prototype._process = function() {
  while (this._buffered > 0 && this._reads && this._reads.length > 0) {
    var read = this._reads[0];
    if (read.allowLess) {
      this._reads.shift(); // == read
      var buf = this._buffers[0];
      if (buf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = buf.slice(read.length);
        read.func.call(this, buf.slice(0, read.length));
      } else {
        this._buffered -= buf.length;
        this._buffers.shift(); // == buf
        read.func.call(this, buf);
      }
    } else if (this._buffered >= read.length) {
      this._reads.shift(); // == read
      var pos = 0, count = 0, data = new Buffer(read.length);
      while (pos < read.length) {
        var buf = this._buffers[count++],
            len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len != buf.length) this._buffers[--count] = buf.slice(len);
      }
      if (count > 0) this._buffers.splice(0, count);
      this._buffered -= read.length;
      read.func.call(this, data);
    } else {
        break;
    }
  }
  if (this._buffers && this._buffers.length > 0 && this._buffers[0] == null) {
    this._end();
  }
};
var CrcStream = function() {
  Stream.call(this);
  this._crc = -1;
  this.writable = true;
};
util.inherits(CrcStream, Stream);
CrcStream.prototype.write = function(data) {
  for (var i = 0; i < data.length; i++)
    this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ (this._crc >>> 8);
  return true;
};
CrcStream.prototype.end = function(data) {
  if (data) this.write(data);
  this.emit('crc', this.crc32());
};
CrcStream.prototype.crc32 = function() { return this._crc ^ -1; };
CrcStream.crc32 = function(buf) {
  var crc = -1;
  for (var i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
};
var crcTable = [];
for (var i = 0; i < 256; i++) {
  var c = i;
  for (var j = 0; j < 8; j++) {
      if (c & 1)  c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
  }
  crcTable[i] = c;
}
var Filter = function(width, height, Bpp, data, options) {
  ChunkStream.call(this);
  this._width = width;
  this._height = height;
  this._Bpp = Bpp;
  this._data = data;
  this._options = options;
  this._line = 0;
  if (!('filterType' in options) || options.filterType == -1) options.filterType = [0, 1, 2, 3, 4];
  else if (typeof options.filterType == 'number') options.filterType = [options.filterType];
  this._filters = {
    0: this._filterNone.bind(this),
    1: this._filterSub.bind(this),
    2: this._filterUp.bind(this),
    3: this._filterAvg.bind(this),
    4: this._filterPaeth.bind(this)
  };
  this.read(this._width * Bpp + 1, this._reverseFilterLine.bind(this));
};
util.inherits(Filter, ChunkStream);
var pixelBppMap = {
  1: { // L
    0: 0,
    1: 0,
    2: 0,
    3: 0xff
  },
  2: { // LA
    0: 0,
    1: 0,
    2: 0,
    3: 1
  },
  3: { // RGB
    0: 0,
    1: 1,
    2: 2,
    3: 0xff
  },
  4: { // RGBA
    0: 0,
    1: 1,
    2: 2,
    3: 3
  }
};
Filter.prototype._reverseFilterLine = function(rawData) {
  var pxData = this._data, pxLineLength = this._width << 2, pxRowPos = this._line * pxLineLength, filter = rawData[0];
  if (filter == 0) {
    for (var x = 0; x < this._width; x++) {
      var pxPos = pxRowPos + (x << 2), rawPos = 1 + x * this._Bpp;
      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[this._Bpp][i];
        pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] : 0xff;
      }
    }
  } else if (filter == 1) {
    for (var x = 0; x < this._width; x++) {
      var pxPos = pxRowPos + (x << 2), rawPos = 1 + x * this._Bpp;
      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[this._Bpp][i], left = x > 0 ? pxData[pxPos + i - 4] : 0;
        pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] + left : 0xff;
      }
    }
  } else if (filter == 2) {
    for (var x = 0; x < this._width; x++) {
      var pxPos = pxRowPos + (x << 2), rawPos = 1 + x * this._Bpp;
      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[this._Bpp][i],
          up = this._line > 0 ? pxData[pxPos - pxLineLength + i] : 0;
        pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] + up : 0xff;
      }
    }
  } else if (filter == 3) {
    for (var x = 0; x < this._width; x++) {
      var pxPos = pxRowPos + (x << 2), rawPos = 1 + x * this._Bpp;
      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[this._Bpp][i],
            left = x > 0 ? pxData[pxPos + i - 4] : 0,
            up = this._line > 0 ? pxData[pxPos - pxLineLength + i] : 0,
            add = Math.floor((left + up) / 2);
         pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] + add : 0xff;
      }
    }
  } else if (filter == 4) {
    for (var x = 0; x < this._width; x++) {
      var pxPos = pxRowPos + (x << 2), rawPos = 1 + x * this._Bpp;
      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[this._Bpp][i],
            left = x > 0 ? pxData[pxPos + i - 4] : 0,
            up = this._line > 0 ? pxData[pxPos - pxLineLength + i] : 0,
            upLeft = x > 0 && this._line > 0 ? pxData[pxPos - pxLineLength + i - 4] : 0,
            add = PaethPredictor(left, up, upLeft);
        pxData[pxPos + i] = idx != 0xff ? rawData[rawPos + idx] + add : 0xff;
      }
    }
  }
  this._line++;
  if (this._line < this._height) this.read(this._width * this._Bpp + 1, this._reverseFilterLine.bind(this));
  else this.emit('complete', this._data, this._width, this._height);
};
Filter.prototype.filter = function() {
  var pxData = this._data, rawData = new Buffer(((this._width << 2) + 1) * this._height);
  for (var y = 0; y < this._height; y++) {
    var filterTypes = this._options.filterType, min = Infinity, sel = 0;
    for (var i = 0; i < filterTypes.length; i++) {
      var sum = this._filters[filterTypes[i]](pxData, y, null);
      if (sum < min) {
        sel = filterTypes[i];
        min = sum;
      }
    }
    this._filters[sel](pxData, y, rawData);
  }
  return rawData;
};
Filter.prototype._filterNone = function(pxData, y, rawData) {
    var pxRowLength = this._width << 2, rawRowLength = pxRowLength + 1, sum = 0;
    if (!rawData) {
        for (var x = 0; x < pxRowLength; x++) sum += Math.abs(pxData[y * pxRowLength + x]);
    } else {
        rawData[y * rawRowLength] = 0;
        pxData.copy(rawData, rawRowLength * y + 1, pxRowLength * y, pxRowLength * (y + 1));
    }
    return sum;
};
Filter.prototype._filterSub = function(pxData, y, rawData) {
    var pxRowLength = this._width << 2, rawRowLength = pxRowLength + 1, sum = 0;
    if (rawData) rawData[y * rawRowLength] = 1;
    for (var x = 0; x < pxRowLength; x++) {
        var left = x >= 4 ? pxData[y * pxRowLength + x - 4] : 0, val = pxData[y * pxRowLength + x] - left;
        if (!rawData) sum += Math.abs(val);
        else rawData[y * rawRowLength + 1 + x] = val;
    }
    return sum;
};
Filter.prototype._filterUp = function(pxData, y, rawData) {
    var pxRowLength = this._width << 2, rawRowLength = pxRowLength + 1, sum = 0;
    if (rawData) rawData[y * rawRowLength] = 2;
    for (var x = 0; x < pxRowLength; x++) {
        var up = y > 0 ? pxData[(y - 1) * pxRowLength + x] : 0, val = pxData[y * pxRowLength + x] - up;
        if (!rawData) sum += Math.abs(val);
        else rawData[y * rawRowLength + 1 + x] = val;
    }
    return sum;
};
Filter.prototype._filterAvg = function(pxData, y, rawData) {
    var pxRowLength = this._width << 2, rawRowLength = pxRowLength + 1, sum = 0;
    if (rawData) rawData[y * rawRowLength] = 3;
    for (var x = 0; x < pxRowLength; x++) {
        var left = x >= 4 ? pxData[y * pxRowLength + x - 4] : 0,
            up = y > 0 ? pxData[(y - 1) * pxRowLength + x] : 0,
            val = pxData[y * pxRowLength + x] - ((left + up) >> 1);
        if (!rawData) sum += Math.abs(val);
        else rawData[y * rawRowLength + 1 + x] = val;
    }
    return sum;
};
Filter.prototype._filterPaeth = function(pxData, y, rawData) {
    var pxRowLength = this._width << 2, rawRowLength = pxRowLength + 1, sum = 0;
    if (rawData) rawData[y * rawRowLength] = 4;
    for (var x = 0; x < pxRowLength; x++) {
        var left = x >= 4 ? pxData[y * pxRowLength + x - 4] : 0,
            up = y > 0 ? pxData[(y - 1) * pxRowLength + x] : 0,
            upLeft = x >= 4 && y > 0 ? pxData[(y - 1) * pxRowLength + x - 4] : 0,
            val = pxData[y * pxRowLength + x] - PaethPredictor(left, up, upLeft);

        if (!rawData) sum += Math.abs(val);
        else rawData[y * rawRowLength + 1 + x] = val;
    }
    return sum;
};
var PaethPredictor = function(left, above, upLeft) {
    var p = left + above - upLeft,
        pLeft = Math.abs(p - left),
        pAbove = Math.abs(p - above),
        pUpLeft = Math.abs(p - upLeft);
    if (pLeft <= pAbove && pLeft <= pUpLeft) return left;
    else if (pAbove <= pUpLeft) return above;
    else return upLeft;
};
var Packer = function(options) {
    Stream.call(this);
    this._options = options;
    options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
    options.deflateLevel = options.deflateLevel || 9;
    options.deflateStrategy = options.deflateStrategy || 3;
    this.readable = true;
};
util.inherits(Packer, Stream);
Packer.prototype.pack = function(data, width, height) {
    this.emit('data', new Buffer(PngConsts.PNG_SIGNATURE));
    this.emit('data', this._packIHDR(width, height));
    var filter = new Filter(width, height, 4, data, this._options);
    var data = filter.filter();
    var deflate = zlib.createDeflate({
            chunkSize: this._options.deflateChunkSize,
            level: this._options.deflateLevel,
            strategy: this._options.deflateStrategy
        });
    deflate.on('error', this.emit.bind(this, 'error'));
    deflate.on('data', function(data) { this.emit('data', this._packIDAT(data)); }.bind(this));
    deflate.on('end', function() { this.emit('data', this._packIEND());  this.emit('end');}.bind(this));
    deflate.end(data);
};
Packer.prototype._packChunk = function(type, data) {
    var len = (data ? data.length : 0), buf = new Buffer(len + 12);
    buf.writeUInt32BE(len, 0);
    buf.writeUInt32BE(type, 4);
    if (data) data.copy(buf, 8);
    buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
    return buf;
};
Packer.prototype._packIHDR = function(width, height) {
    var buf = new Buffer(13);
    buf.writeUInt32BE(width, 0);
    buf.writeUInt32BE(height, 4);
    buf[8] = 8;
    buf[9] = 6; // colorType
    buf[10] = 0; // compression
    buf[11] = 0; // filter
    buf[12] = 0; // interlace
    return this._packChunk(PngConsts.TYPE_IHDR, buf);
};
Packer.prototype._packIDAT = function(data) { return this._packChunk(PngConsts.TYPE_IDAT, data); };
Packer.prototype._packIEND = function() { return this._packChunk(PngConsts.TYPE_IEND, null); };
var Parser = function(options) {
    ChunkStream.call(this);
    this._options = options;
    options.checkCRC = options.checkCRC !== false;
    this._hasIHDR = false;
    this._hasIEND = false;
    this._inflate = null;
    this._filter = null;
    this._crc = null;
    this._palette = [];
    this._colorType = 0;
    this._chunks = {};
    this._chunks[PngConsts.TYPE_IHDR] = this._handleIHDR.bind(this);
    this._chunks[PngConsts.TYPE_IEND] = this._handleIEND.bind(this);
    this._chunks[PngConsts.TYPE_IDAT] = this._handleIDAT.bind(this);
    this._chunks[PngConsts.TYPE_PLTE] = this._handlePLTE.bind(this);
    this._chunks[PngConsts.TYPE_tRNS] = this._handleTRNS.bind(this);
    this._chunks[PngConsts.TYPE_gAMA] = this._handleGAMA.bind(this);
    this.writable = true;
    this.on('error', this._handleError.bind(this));
    this._handleSignature();
};
util.inherits(Parser, ChunkStream);
Parser.prototype._handleError = function() {
    this.writable = false;
    this.destroy();
    if (this._inflate) this._inflate.destroy();
};
Parser.prototype._handleSignature = function() { this.read(PngConsts.PNG_SIGNATURE.length, this._parseSignature.bind(this));};
Parser.prototype._parseSignature = function(data) {
    var signature = PngConsts.PNG_SIGNATURE;
    for (var i = 0; i < signature.length; i++) {
        if (data[i] != signature[i]) {
            this.emit('error', new Error('Invalid file signature'));
            return;
        }
    }
    this.read(8, this._parseChunkBegin.bind(this));
};
Parser.prototype._parseChunkBegin = function(data) {
    var length = data.readUInt32BE(0);
    var type = data.readUInt32BE(4), name = '';
    for (var i = 4; i < 8; i++) name += String.fromCharCode(data[i]);
    var ancillary = !!(data[4] & 0x20), priv= !!(data[5] & 0x20), safeToCopy = !!(data[7] & 0x20);
    if (!this._hasIHDR && type != PngConsts.TYPE_IHDR) {
        this.emit('error', new Error('Expected IHDR on beggining'));
        return;
    }
    this._crc = new CrcStream();
    this._crc.write(new Buffer(name));
    if (this._chunks[type]) return this._chunks[type](length);
  else if (!ancillary) this.emit('error', new Error('Unsupported critical chunk type ' + name));
    else this.read(length + 4, this._skipChunk.bind(this));
};
Parser.prototype._skipChunk = function(data) {this.read(8, this._parseChunkBegin.bind(this));};
Parser.prototype._handleChunkEnd = function() { this.read(4, this._parseChunkEnd.bind(this));};
Parser.prototype._parseChunkEnd = function(data) {
    var fileCrc = data.readInt32BE(0), calcCrc = this._crc.crc32();
    if (this._options.checkCRC && calcCrc != fileCrc) {
        this.emit('error', new Error('Crc error'));
        return;
    }
    if (this._hasIEND) this.destroySoon();
  else this.read(8, this._parseChunkBegin.bind(this));
};
Parser.prototype._handleIHDR = function(length) { this.read(length, this._parseIHDR.bind(this));};
Parser.prototype._parseIHDR = function(data) {
    this._crc.write(data);
    var width = data.readUInt32BE(0), height = data.readUInt32BE(4), depth = data[8],
        colorType = data[9], compr = data[10], filter = data[11], interlace = data[12];
    if (depth != 8) {
        this.emit('error', new Error('Unsupported bit depth ' + depth));
        return;
    }
    if (!(colorType in colorTypeToBppMap)) {
        this.emit('error', new Error('Unsupported color type'));
        return;
    }
    if (compr != 0) {
        this.emit('error', new Error('Unsupported compression method'));
        return;
    }
    if (filter != 0) {
        this.emit('error', new Error('Unsupported filter method'));
        return;
    }
    if (interlace != 0) {
        this.emit('error', new Error('Unsupported interlace method'));
        return;
    }
    this._colorType = colorType;
    this._data = new Buffer(width * height * 4);
    this._filter = new Filter(
        width, height,
        colorTypeToBppMap[this._colorType],
        this._data,
        this._options
    );
    this._hasIHDR = true;
    this.emit('metadata', {
        width: width,
        height: height,
        palette: !!(colorType & PngConsts.COLOR_PALETTE),
        color: !!(colorType & PngConsts.COLOR_COLOR),
        alpha: !!(colorType & PngConsts.COLOR_ALPHA),
        data: this._data
    });
    this._handleChunkEnd();
};
Parser.prototype._handlePLTE = function(length) { this.read(length, this._parsePLTE.bind(this)); };
Parser.prototype._parsePLTE = function(data) {
    this._crc.write(data);
    var entries = Math.floor(data.length / 3);
    for (var i = 0; i < entries; i++)
        this._palette.push([ data.readUInt8(i * 3), data.readUInt8(i * 3 + 1), data.readUInt8(i * 3 + 2 ), 0xff]);
    this._handleChunkEnd();
};
Parser.prototype._handleTRNS = function(length) { this.read(length, this._parseTRNS.bind(this)); };
Parser.prototype._parseTRNS = function(data) {
    this._crc.write(data);
    if (this._colorType == 3) {
        if (this._palette.length == 0) {
            this.emit('error', new Error('Transparency chunk must be after palette'));
            return;
        }
        if (data.length > this._palette.length) {
            this.emit('error', new Error('More transparent colors than palette size'));
            return;
        }
        for (var i = 0; i < this._palette.length; i++) { this._palette[i][3] = i < data.length ? data.readUInt8(i) : 0xff; }
    }
    this._handleChunkEnd();
};
Parser.prototype._handleGAMA = function(length) { this.read(length, this._parseGAMA.bind(this)); };
Parser.prototype._parseGAMA = function(data) {
    this._crc.write(data);
    this.emit('gamma', data.readUInt32BE(0) / 100000);
    this._handleChunkEnd();
};
Parser.prototype._handleIDAT = function(length) { this.read(-length, this._parseIDAT.bind(this, length)); };
Parser.prototype._parseIDAT = function(length, data) {
    this._crc.write(data);
    if (this._colorType == 3 && this._palette.length == 0) throw new Error('Expected palette not found');
    if (!this._inflate) {
        this._inflate = zlib.createInflate();
        this._inflate.on('error', this.emit.bind(this, 'error'));
        this._filter.on('complete', this._reverseFiltered.bind(this));
        this._inflate.pipe(this._filter);
    }
    this._inflate.write(data);
    length -= data.length;
    if (length > 0) this._handleIDAT(length); else this._handleChunkEnd();
};
Parser.prototype._handleIEND = function(length) { this.read(length, this._parseIEND.bind(this)); };
Parser.prototype._parseIEND = function(data) {
    this._crc.write(data);
    this._inflate.end();
    this._hasIEND = true;
    this._handleChunkEnd();
};
var colorTypeToBppMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
Parser.prototype._reverseFiltered = function(data, width, height) {
    if (this._colorType == 3) {
        var pxLineLength = width << 2;
        for (var y = 0; y < height; y++) {
            var pxRowPos = y * pxLineLength;
            for (var x = 0; x < width; x++) {
                var pxPos = pxRowPos + (x << 2), color = this._palette[data[pxPos]];
                for (var i = 0; i < 4; i++) data[pxPos + i] = color[i];
            }
        }
    }
    this.emit('parsed', data);
};
var PNG = function(options) {
    Stream.call(this);
    options = options || {};
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.data = this.width > 0 && this.height > 0 ? new Buffer(4 * this.width * this.height) : null;
    this.gamma = 0;
    this.readable = this.writable = true;
    this._parser = new Parser(options || {});
    this._parser.on('error', this.emit.bind(this, 'error'));
    this._parser.on('close', this._handleClose.bind(this));
    this._parser.on('metadata', this._metadata.bind(this));
    this._parser.on('gamma', this._gamma.bind(this));
    this._parser.on('parsed', function(data) { this.data = data; this.emit('parsed', data);}.bind(this));
    this._packer = new Packer(options);
    this._packer.on('data', this.emit.bind(this, 'data'));
    this._packer.on('end', this.emit.bind(this, 'end'));
    this._parser.on('close', this._handleClose.bind(this));
    this._packer.on('error', this.emit.bind(this, 'error'));
};
util.inherits(PNG, Stream);
PNG.prototype.pack = function() {
    process.nextTick(function() { this._packer.pack(this.data, this.width, this.height); }.bind(this));
    return this;
};
PNG.prototype.parse = function(data, callback) {
    if (callback) {
        var onParsed = null, onError = null;
        this.once('parsed', onParsed = function(data) {
            this.removeListener('error', onError);
            this.data = data;
            callback(null, this);
        }.bind(this));
        this.once('error', onError = function(err) {
            this.removeListener('parsed', onParsed);
            callback(err, null);
        }.bind(this));
    }
    this.end(data);
    return this;
};
PNG.prototype.write = function(data) {
    this._parser.write(data);
    return true;
};
PNG.prototype.end = function(data) { this._parser.end(data); };
PNG.prototype._metadata = function(metadata) {
    this.width = metadata.width;
    this.height = metadata.height;
    this.data = metadata.data;
    delete metadata.data;
    this.emit('metadata', metadata);
};
PNG.prototype._gamma = function(gamma) { this.gamma = gamma; };
PNG.prototype._handleClose = function() { if (!this._parser.writable && !this._packer.readable)  this.emit('close');};
PNG.prototype.bitblt = function(dst, sx, sy, w, h, dx, dy) {
    var src = this;
    if (sx > src.width || sy > src.height || sx + w > src.width || sy + h > src.height) throw new Error('bitblt reading outside image');
    if (dx > dst.width || dy > dst.height || dx + w > dst.width || dy + h > dst.height) throw new Error('bitblt writing outside image');
    for (var y = 0; y < h; y++) {
        src.data.copy(dst.data, ((dy + y) * dst.width + dx) << 2, ((sy + y) * src.width + sx) << 2, ((sy + y) * src.width + sx + w) << 2 );
    }
    return this;
};


/// Traversing Windows PE Executable Headers ///

/** Constants **/
var WindowsConst={};
WindowsConst.RESOURCE_ENTRY_TYPES = [
  RT_UNKNOWN = {value:0,name:'RT_UNKNOWN'}, RT_CURSOR = {value:1,name:'RT_CURSOR'}, 
  RT_BITMAP = {value:2,name:'RT_BITMAP'}, RT_ICON = {value:3,name:'RT_ICON'}, 
  RT_MENU = {value:4,name:'RT_MENU'}, RT_DIALOG = {value:5,name:'RT_DIALOG'}, 
  RT_STRING = {value:6,name:'RT_STRING'}, RT_FONTDIR = {value:7,name:'RT_FONTDIR'},
  RT_FONT = {value:8,name:'RT_FONT'}, RT_ACCELERATOR=  {value:9,name:'RT_ACCELERATOR'},
  RT_RCDATA = {value:10,position:-1,name:'RT_RCDATA'}, RT_MESSAGETABLE = {value:11,name:'RT_MESSAGETABLE'},
  RT_GROUP_CURSOR = {value:12,name:'RT_GROUP_CURSOR'}, RT_UNKNOWN = {value:0,name:'RT_UNKNOWN'}, 
  RT_GROUP_ICON = {value:14,name:'RT_GROUP_ICON'}, RT_UNKNOWN = {value:0,name:'RT_UNKNOWN'}, 
  RT_VERSION = {value:16,name:'RT_VERSION'}, RT_DLGINCLUDE = {value:17,name:'RT_DLGINCLUDE'}, 
  RT_UNKNOWN= {value:0,name:'RT_UNKNOWN'}, RT_PLUGPLAY = {value:19,name:'RT_PLUGPLAY'},
  RT_VXD = {value:20,name:'RT_VXD'}, RT_ANICURSOR = {value:21,name:'RT_ANICURSOR'}, 
  RT_ANIICON = {value:22,name:'RT_ANIICON'}, RT_HTML= {value:23,name:'RT_HTML'}, 
  RT_MANIFEST = {value:24,name:'RT_MANIFEST'}
];
WindowsConst.IMAGE_DOS_SIGNATURE        = {value:23117, name:'MSDOS'};
WindowsConst.IMAGE_OS2_SIGNATURE        = {value:17742, name:'OS2'};
WindowsConst.IMAGE_OS2_SIGNATURE_LE         = {value:17740, name:'OS2 LE'};
WindowsConst.IMAGE_NT_SIGNATURE           = {value:17744, name:'NT'};
WindowsConst.IMAGE_FILE_MACHINE_I386        = {value:332, name:'i386'};
WindowsConst.IMAGE_FILE_MACHINE_IA64        = {value:512, name:'ia64'};
WindowsConst.IMAGE_FILE_MACHINE_AMD64     = {value:34404, name:'amd64'};
WindowsConst.IMAGE_DIRECTORY_ENTRY_EXPORT     = 0;    // Export Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_IMPORT     = 1;    // Import Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_RESOURCE     = 2;    // Resource Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_EXCEPTION  = 3;    // Exception Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_SECURITY     = 4;    // Security Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_BASERELOC  = 5;    // Base Relocation Table
WindowsConst.IMAGE_DIRECTORY_ENTRY_DEBUG    = 6;    // Debug Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_COPYRIGHT  = 7;    // Description String
WindowsConst.IMAGE_DIRECTORY_ENTRY_GLOBALPTR  = 8;    // Machine Value (MIPS GP)
WindowsConst.IMAGE_DIRECTORY_ENTRY_TLS      = 9;    // TLS Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_LOAD_CONFIG  = 10;   // Load Configuration Directory
WindowsConst.IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT = 11;
WindowsConst.IMAGE_DIRECTORY_ENTRY_IAT      = 12;
WindowsConst.IMAGE_DIRECTORY_ENTRY_DELAY_IMPORT = 13;
WindowsConst.IMAGE_DIRECTORY_ENTRY_CLR_RUNTIME  = 14;
WindowsConst.IMAGE_DIRECTORY_ENTRY_RESERVED   = 15;
WindowsConst.IMAGE_SIZEOF_SHORT_NAME      = 8;
WindowsConst.IMAGE_NUMBEROF_DIRECTORY_ENTRIES   = 16;
WindowsConst.SIZE_OF_NT_SIGNATURE         = 4;
WindowsConst.WINDOWS_VERSIONS = [
  {Name:'Windows 8', MajorOperatingSystemVersion:6, MinorOperatingSystemVersion:2 },
  {Name:'Windows 7', MajorOperatingSystemVersion:6, MinorOperatingSystemVersion:1 },
  {Name:'Windows Vista', MajorOperatingSystemVersion:6, MinorOperatingSystemVersion:0 },
  {Name:'Windows XP 64-Bit Edition', MajorOperatingSystemVersion:5, MinorOperatingSystemVersion:2 },
  {Name:'Windows XP', MajorOperatingSystemVersion:5, MinorOperatingSystemVersion:1 },
  {Name:'Windows 2000', MajorOperatingSystemVersion:5, MinorOperatingSystemVersion:0 }
];
WindowsConst.SUBSYSTEM = {};
WindowsConst.SUBSYSTEM['NATIVE'] = 1;   // dll or driver.
WindowsConst.SUBSYSTEM['WINDOWS_GUI'] = 2; // Follow symbol resolution for windows gui app (no console wWinMain).
WindowsConst.SUBSYSTEM['WINDOWS_CUI'] = 3; // Open a console window and run main.
WindowsConst.SUBSYSTEM['OS2_GUI'] = 5;  // OS2 symbol conventions, unknown.
WindowsConst.SUBSYSTEM['POSIX_CUI'] = 7;  // Follow posix conventions, aligned argv mem, and run main.


/** Helper Functions **/
WindowsConst.LOWORD = function(e) { return (e.value & 0x0000ffff); }
WindowsConst.HIGHBIT = function(e) { return (0x80000000 & e) != 0; }
WindowsConst.STRIPHIGHBIT = function(e) { return ((~0x80000000) & e); }
WindowsConst.GETOFFSETBYADDRESS = function(address, winObj) {
  for(var i=0; i < winObj.SectionHeaders.length; i++)
  {
    var VABegin = winObj.SectionHeaders[i].VirtualAddress;
    var VAEnd = winObj.SectionHeaders[i].SizeOfRawData + VABegin;
    if( VABegin <= address && VAEnd > address )
      return address - winObj.SectionHeaders[i].VirtualOffset;
  }
  return 0; 
}
WindowsConst.GETOFFSETBYDIRECTORY = function(directory, winObj) {
  return WindowsConst.GETOFFSETBYADDRESS(winObj.OptionalHeader.DataDirectory[directory].VirtualAddress, winObj);
}
WindowsConst.READ = function(size, wef) {
  var buf = new Buffer(size);
  fs.readSync(wef.FileDescriptor, buf, 0, size, wef.Position);
  wef.Increment(size);
  return buf;
}


/** Objects and Structures **/
var WindowsExeFile = function(fd)
{
  this.name = 'WindowsPEFile';
  this.FileDescriptor = fd;
  this.Position = 0;
}
// Yes, microsoft considers a "BOOL" to be 4 bytes. It's a typedef int.
WindowsExeFile.prototype.BOOL = function() { return WindowsConst.READ(4, this).readUInt32LE(0); }
WindowsExeFile.prototype.BOOLEAN = function() { return WindowsConst.READ(1, this).readUInt8(0); }
WindowsExeFile.prototype.BYTE = function() { return WindowsConst.READ(1, this).readUInt8(0); };
WindowsExeFile.prototype.UCHAR = function() { return WindowsConst.READ(1, this).toString('ascii'); }
WindowsExeFile.prototype.USHORT = function() { return WindowsConst.READ(2, this).readUInt16LE(0); }
WindowsExeFile.prototype.LONG = function() { return WindowsConst.READ(4, this).readInt32LE(0); }
WindowsExeFile.prototype.ULONG = function() { return WindowsConst.READ(4, this).readUInt32LE(0); }
WindowsExeFile.prototype.LONG64 = function() {
  var buf = WindowsConst.READ(8, this);
  var bufInt = (buf.readUInt32BE(0) << 8) + buf.readUInt32BE(4);
  return bufInt;
}
WindowsExeFile.prototype.WCHAR =  function() { return WindowsConst.READ(2, this).toString('utf8'); }
WindowsExeFile.prototype.DWORD = function() { return WindowsConst.READ(4, this).readUInt32LE(0); }
WindowsExeFile.prototype.WORD = function() { return WindowsConst.READ(2, this).readUInt16LE(0); }
WindowsExeFile.prototype.Increment = function(e) { return (this.Position = this.Position + e); }
WindowsExeFile.prototype.ResourceDataIconRead = function() {
  var obj = {};
  obj.biSize      = this.DWORD();
  obj.biWidth     = this.LONG();
  obj.biHeight    = this.LONG();
  obj.biPlanes    = this.WORD();
  obj.biBitCount    = this.WORD();
  obj.biCompression = this.DWORD();
  obj.biSizeImage   = this.DWORD();
  obj.biXPelsPerMeter = this.LONG();
  obj.biYPelsPerMeter = this.LONG();
  obj.biClrUsed   = this.DWORD();
  obj.biClrImportant  = this.DWORD();
  obj.Position    = this.Position;
  obj.getDataPosition = function() { return this.Position; };
  obj.getDataSize   = function() { return (this.biSizeImage == 0) ? obj.biWidth*(obj.biHeight/2)*(obj.biBitCount/8) : this.biSizeImage; };
  return obj;
};

WindowsExeFile.UTF16toJSString =function(str) {
  var s = "";
  str.forEach(function(e) { s += e[0]; });
  return s;
}

WindowsExeFile.prototype.ReadUnicodeUTF16 = function() {
  var str = [];
  var data = this.WCHAR();
  var key = "";
  while(data != "\u0000\u0000") {
    key += data[0];
    str.push(data);
    data = this.WCHAR();
  }
  return str;
}

WindowsExeFile.prototype.ReadPadding = function() {
  // expect to be padded with 0's until we hit a 32 bit boundary.
  // We must (by microsofts spec) read in 2 bytes, which is unusual,
  // as it implies we will never end up on an odd boundary, and if we
  // somehow do, we'll spin until the end of the file.
  var beginPos = this.Position;
  while(((this.Position) % 4) != 0)
    console.assert(this.WORD() === 0, 
      'Padding values should be 0, at position: ', this.Position, ' with ', (this.Position%4),' offset');
  return this.Position - beginPos;
}

// Note this "String" does not mean what you think it does, String is a 
// special term in the microsoft PE format, its a string in the PE version data, see:
// http://msdn.microsoft.com/en-us/library/windows/desktop/ms646987(v=vs.85).aspx
WindowsExeFile.prototype.StringRead = function() {
  var obj = {};
  obj.wLength = this.WORD();
  obj.wValueLength = this.WORD();
  obj.wType = this.WORD();
  obj.szKey = this.ReadUnicodeUTF16();
  var paddingSize = this.ReadPadding();
  obj.ValuePosition = this.Position;
  obj.Value = this.ReadUnicodeUTF16();

  var key = WindowsExeFile.UTF16toJSString(obj.szKey);

  // Supported values, see the url above.
  switch(key) {
    case 'Comments':
    case 'CompanyName':
    case 'FileDescription':
    case 'FileVersion':
    case 'InternalName':
    case 'LegalCopyright':
    case 'LegalTrademarks':
    case 'OriginalFilename':
    case 'PrivateBuild':
    case 'ProductName':
    case 'ProductVersion':
    case 'SpecialBuild':
      // TODO: Add .. something.. position and value to .. something.
      if(!this.VersionInfo) this.VersionInfo = {};
      this.VersionInfo[key] = WindowsExeFile.UTF16toJSString(obj.Value);
      this.VersionInfo[key+'Position'] = obj.ValuePosition;
      break;
    default:
      console.warn('Unknown version string: '+key+', hoepfully well be ok.');
  }
  return obj;
}

WindowsExeFile.prototype.StringTableRead = function() {
  var obj = {}
  obj.wLength = this.WORD();
  obj.wValueLength = this.WORD();
  obj.wType = this.WORD();
  obj.Children = [];
  // see http://msdn.microsoft.com/en-us/library/windows/desktop/ms646992(v=vs.85).aspx
  // Microsoft doesn't seem to tell us what these are, other than they are an 8 digit 
  // hexadecimal string encoded as a unicode string.
  obj.szKey = this.ReadUnicodeUTF16();
  var key = WindowsExeFile.UTF16toJSString(obj.szKey);
  
  console.assert(obj.wValueLength == 0, 'The value length was not equal to 0, it should be for StringTableRead');
  console.assert(obj.wType === 1 || obj.wType === 0, 'The String Table type was not 1 or 0, it was: ', obj.wType);
  console.assert(key.length == 8, 'The String Table key should be an 8 digit hexidecimal as unicode string, it was: ', key.length);

  var paddingSize = this.ReadPadding();
  var lengthOfChildren = obj.wLength - 6 - ((key.length)*2) - paddingSize;
  while(lengthOfChildren != 0) {
    var tmp = this.StringRead();
    obj.Children.push(tmp);
    lengthOfChildren = lengthOfChildren - tmp.wLength;
    // This is not documented, but mentioned by a user that padding is necessary
    // after or inbetween each child array member, it turns out they're right.
    paddingSize = this.ReadPadding();
    lengthOfChildren = lengthOfChildren - paddingSize;
  }
  return obj;

}

// See: http://msdn.microsoft.com/en-us/library/windows/desktop/ms646994(v=vs.85).aspx
WindowsExeFile.prototype.VarRead = function() {
  var obj = {}
  obj.wLength = this.WORD();
  obj.wValueLength = this.WORD();
  obj.wType = this.WORD();
  obj.Children = [];
  console.assert(obj.wType === 1 || obj.wType === 0, 'The String Table type was not 1 or 0, it was: ', obj.wType);

  // see http://msdn.microsoft.com/en-us/library/windows/desktop/ms646992(v=vs.85).aspx
  // Microsoft doesn't seem to tell us what these are, other than they are an 8 digit 
  // hexadecimal string encoded as a unicode string.
  obj.szKey = this.ReadUnicodeUTF16();
  
  var key = WindowsExeFile.UTF16toJSString(obj.szKey);
  console.assert(key == "Translation", 'The Var key did not match expected value Translation, instead it was: ', key);

  var paddingSize = this.ReadPadding();
  var lengthOfChildren = obj.wValueLength;
  while(lengthOfChildren != 0) {
    obj.Children.push(this.DWORD()); // low order word is MS language id, high order word is  IBM code page.
    lengthOfChildren = lengthOfChildren - 4;
  }
  return obj;

}

// This is either VarFileInfo or StringFileInfo structure, we wont know until we check the
// szKey value, at that point we'll diverge. See:
//   VarFileInfo: http://msdn.microsoft.com/en-us/library/windows/desktop/ms646995(v=vs.85).aspx
//   StringFileInfo: http://msdn.microsoft.com/en-us/library/windows/desktop/ms646989(v=vs.85).aspx
WindowsExeFile.prototype.VarFileOrStringFileInfoRead = function() {
  var obj = {}
  obj.wLength = this.WORD();
  obj.wValueLength = this.WORD();
  console.assert(obj.wValueLength == 0, 'The value length was not equal to 0, it should be for VarFileInfo or StringFileInfo');
  obj.wType = this.WORD();
  obj.szKey = this.ReadUnicodeUTF16();

  var key = WindowsExeFile.UTF16toJSString(obj.szKey);

  var paddingSize = this.ReadPadding();

  obj.Children = [];

  if(key == "VarFileInfo") {
    // children are of type "Var", a strange localization structure.
    // http://msdn.microsoft.com/en-us/library/windows/desktop/ms646994(v=vs.85).aspx
    obj.Children.push(this.VarRead());
  } else if (key == "StringFileInfo") {
    // Children are of type "StringTable", the array is determined by the remaining
    // bytes available. We loop into StringTableRead and if everything works out we
    // should return with a wLength that is valid.
    // http://msdn.microsoft.com/en-us/library/windows/desktop/ms646992(v=vs.85).aspx
    var lengthOfChildren = obj.wLength - ((key.length+1)*2) - 6 - paddingSize;
    while(lengthOfChildren != 0) {
      var tmp = this.StringTableRead();
      obj.Children.push(tmp);
      lengthOfChildren = lengthOfChildren - tmp.wLength;
      // This is not documented, but mentioned by a user that padding is necessary
      // after or inbetween each child array member, it turns out they're right.
      paddingSize = this.ReadPadding();
      lengthOfChildren = lengthOfChildren - paddingSize;
    }
  } else
    console.assert(false, 'Invalid child key found: ', key);
  return obj;
}

// Read in the Resource Data VS_VERSIONINFO Structure
// See: http://msdn.microsoft.com/en-us/library/windows/desktop/ms647001(v=vs.85).aspx
WindowsExeFile.prototype.ResourceDataVersionRead = function() {
  var obj = {};
  obj.wLength     = this.WORD();
  obj.wValueLength  = this.WORD();
  obj.wType     = this.WORD();
  obj.szKey     = this.ReadUnicodeUTF16();
  
  var key = WindowsExeFile.UTF16toJSString(obj.szKey);
  // Ensure we match the key expected.
  console.assert(key == "VS_VERSION_INFO", 'Expected VS_VERSION_INFO got ', key);

  var paddingSize = this.ReadPadding();

  obj.ValuePosition = this.Position;
  if(obj.wValueLength != 0) {
    obj.Value = {
      dwSignature:this.DWORD(),
      dwStrucVersion:this.DWORD(),
      dwFileVersionMS:this.DWORD(),
      dwFileVersionLS:this.DWORD(),
      dwProductVersionMS:this.DWORD(),
      dwProductVersionLS:this.DWORD(),
      dwFileFlagsMask:this.DWORD(),
      dwFileFlags:this.DWORD(),
      dwFileOS:this.DWORD(),
      dwFileType:this.DWORD(),
      dwFileSubtype:this.DWORD(),
      dwFileDateMS:this.DWORD(),
      dwFileDateLS:this.DWORD(),
    };
    
    // It's always good to expect certain things to be true,
    // keeps our program honest.
    console.assert((this.Position - obj.ValuePosition) === obj.wValueLength, 
      'VSVERSION_INFO.Value structure was ',(this.Position - obj.ValuePosition),' size, but size expected ', obj.wValueLength);
    console.assert(obj.Value.dwSignature == 0xFEEF04BD, 
      'VSVERSION_INFO.dwSignature should have been 0xFEEF04BD, instead we got', obj.Value.dwSignature.toString(16));
  }

  paddingSize = paddingSize + this.ReadPadding();

  obj.Children = [];

  var lengthOfChildren = obj.wLength - 6 - ((key.length+1)*2) - paddingSize - obj.wValueLength;
  // Note if you refer to the microsoft documentation it notes Children as a type word at the end.
  // it's unclear what this value is, but it seems to be the amount of children that can be seeked
  // to based on the wLength, either way we break with 2 bytes (the size of a WORD) rather than 0.
  while(lengthOfChildren != 2) {
    var tmp = this.VarFileOrStringFileInfoRead();
    obj.Children.push(tmp);
    lengthOfChildren = lengthOfChildren - tmp.wLength;
    // This is not documented, but mentioned by a user that padding is necessary
    // after or inbetween each child array member, it turns out they're right.
    paddingSize = this.ReadPadding();
    lengthOfChildren = lengthOfChildren - paddingSize;
  }
  obj.ChildrenItem = this.WORD();
  return obj;
}
WindowsExeFile.prototype.ResourceDataGroupIconRead = function() {
  var obj = {};
  obj.wReserved       = this.WORD();    // Currently zero 
  obj.wType       = this.WORD();    // 1 for icons 
  obj.wCount        = this.WORD();    // Number of components 
  obj.Entries       = new Array();
  for(var i=0; i < obj.wCount; i++) {
    var sObj = {};
    sObj.bWidth     = this.BYTE();
    sObj.bHeight    = this.BYTE();
    sObj.bColorCount  = this.BYTE();
    sObj.bReserved    = this.BYTE();
    sObj.wPlanes    = this.WORD();
    sObj.wBitCount    = this.WORD();
    sObj.lBytesInRes  = this.DWORD();
    sObj.wNameOrdinal   = this.WORD();
    obj.Entries.push(sObj);
  }
  return obj;
}
WindowsExeFile.prototype.ResourceDataRead = function(p) {
  var obj = {}
  obj.parent      = p;
  obj.OffsetToData  = this.ULONG();
  obj.Size      = this.ULONG();
  obj.CodePage    = this.ULONG();
  obj.Reserved    = this.ULONG();
  obj.PhysicalAddress = WindowsConst.GETOFFSETBYADDRESS(obj.OffsetToData, this);
  try {
    /* Crawl up the chain to get our type and language */
    var index = obj.parent.parent.parent.parent.parent.Name;
    if(index > WindowsConst.RESOURCE_ENTRY_TYPES.length) obj.ResourceType = WindowsConst.RT_UNKNOWN;
    else obj.ResourceType = WindowsConst.RESOURCE_ENTRY_TYPES[index];
    var SavePosition = this.Position;
    this.Position = obj.PhysicalAddress;

    switch(obj.ResourceType.value) {
      case RT_ICON.value:
        if(!this.Icon) this.Icon = [];
        obj.Icon = this.ResourceDataIconRead();
        this.Icon.push(obj.Icon);
        break;
      case RT_GROUP_ICON.value:
        if(!this.GroupIcon) this.GroupIcon = [];
        obj.GroupIcon = this.ResourceDataGroupIconRead();
        this.GroupIcon.push(obj.GroupIcon);
        break;
      case RT_VERSION.value:
        if(!this.VersionInfo) this.VersionInfo = [];
        obj.VersionInfo = this.ResourceDataVersionRead();
        this.VersionInfo.push(obj.VersionInfo);
        break;
      // TOOD: Manifest?
      //case RT_MANIFEST.value:
      //  if(!this.Manifest) this.Manifest = [];
      //  obj.Manifest = this.ResourceManifestRead();
      //  this.Manifest.push(obj.Manifest);
      default:
      //  console.log('unknown resource type: ',obj.ResourceType.value);
    }
    
    this.Position = SavePosition;
  } catch(e) {
    obj.ResourceType = WindowsConst.RT_UNKNOWN;
    obj.ErrorOccured = 'Cannot read resources, an unknown type was encountered.';
    console.log(e.message);
    console.log(e.stack);
    console.error(e);
  }
  return obj;
}
WindowsExeFile.prototype.ResourceStringRead = function(p) {
  var obj     = {};
  obj.Length    = this.ULONG();
  obj.NameString  = this.WCHAR();
  return obj;
}
WindowsExeFile.prototype.ResourceEntryRead = function(p) {
  var obj = {};
  obj.parent      = p;
  obj.Name      = this.ULONG();
  obj.OffsetToData  = this.ULONG();

  var SavePosition  = this.Position;
  this.Position     = this.ResourcePosition + WindowsConst.STRIPHIGHBIT(obj.OffsetToData);
  
  if(WindowsConst.HIGHBIT(obj.OffsetToData)) obj.Directory = this.ResourceDirectoryRead(obj);
  else obj.Data = this.ResourceDataRead(obj);
  
  this.Position     = SavePosition;
  
  return obj;
}
WindowsExeFile.prototype.ResourceDirectoryRead = function(p) {
  var obj = {};
  obj.parent          = p;
  obj.Characteristics     = this.ULONG();
  obj.TimeDateStamp       = new Date(this.ULONG()*1000);
  obj.MajorVersion      = this.USHORT();
  obj.MinorVersion      = this.USHORT();
  obj.NumberOfNamedEntries  = this.USHORT();
  obj.NumberOfIdEntries   = this.USHORT();
  obj.Entries         = new Array();
  
  var SavePosition      = this.Position;

  for(var i=0; i < obj.NumberOfNamedEntries + obj.NumberOfIdEntries; i++)
    obj.Entries.push( this.ResourceEntryRead(obj) );

  this.Position = SavePosition;
  
  return obj;
}
WindowsExeFile.prototype.SectionHeaderRead = function() {
  var obj = {};
  obj.Name = ''.concat(
    this.UCHAR(), this.UCHAR(), this.UCHAR(), this.UCHAR(),
    this.UCHAR(), this.UCHAR(), this.UCHAR(), this.UCHAR()
  );
  obj.Misc = this.ULONG();
  obj.PhysicalAddress = obj.Misc;
  obj.VirtualSize = obj.Misc;
  obj.VirtualAddress = this.ULONG();
  obj.SizeOfRawData = this.ULONG();
  obj.PointerToRawData = this.ULONG();
  obj.PointerToRelocations = this.ULONG();
  obj.PointerToLinenumbers = this.ULONG();
  obj.NumberOfRelocations = this.USHORT();
  obj.NumberOfLinenumbers = this.USHORT();
  obj.Characteristics = this.ULONG(); 
  obj.VirtualOffset = obj.VirtualAddress - obj.PointerToRawData;
  return obj;
}
WindowsExeFile.prototype.SectionHeadersRead = function() {
  var SectionHeaders = new Array();
  for(var i=0; i < this.FileHeader.NumberOfSections; i++)
    SectionHeaders.push( this.SectionHeaderRead() );
  return SectionHeaders;
}
WindowsExeFile.prototype.DataDirectoryRead = function() {
  var obj = {};
  obj.VirtualAddress = this.ULONG();
  obj.Size = this.ULONG();
  return obj;
}
WindowsExeFile.prototype.OptionalHeaderRead = function() {
  var obj = {};
  obj.Magic = this.USHORT();
    obj.MajorLinkerVersion = this.UCHAR();
    obj.MinorLinkerVersion = this.UCHAR();
    obj.SizeOfCode = this.ULONG();
    obj.SizeOfInitializedData = this.ULONG();
    obj.SizeOfUninitializedData = this.ULONG();
    obj.AddressOfEntryPoint = this.ULONG();
    obj.BaseOfCode = this.ULONG();
    if(obj.Magic == 0x10b) { // Is 32-bit PE32
      obj.BaseOfData = this.ULONG();
      obj.ImageBase = this.ULONG();
  } else if (obj.Magic == 0x20b) { // Is 64-bit PE32+
      obj.ImageBase = this.LONG64(); // pray we don't hit over 53 bits.
  } else
    throw new Error("UNSUPPORTED BIT TYPE.");
    obj.SectionAlignment = this.ULONG();
    obj.FileAlignment = this.ULONG();
    obj.MajorOperatingSystemVersion = this.USHORT();
    obj.MinorOperatingSystemVersion = this.USHORT();
    obj.MajorImageVersion = this.USHORT();
    obj.MinorImageVersion = this.USHORT();
    obj.MajorSubsystemVersion = this.USHORT();
    obj.MinorSubsystemVersion = this.USHORT();
    obj.Reserved1 = this.ULONG();
    obj.SizeOfImage = this.ULONG();
    obj.SizeOfHeaders = this.ULONG();
    obj.CheckSum = this.ULONG();
    this.SubsystemPosition = this.Position;
    obj.Subsystem = this.USHORT();
    obj.DllCharacteristics = this.USHORT();
    if(obj.Magic == 0x10b) {
    obj.SizeOfStackReserve = this.ULONG();
      obj.SizeOfStackCommit = this.ULONG();
      obj.SizeOfHeapReserve = this.ULONG();
      obj.SizeOfHeapCommit = this.ULONG();
  } else {
    obj.SizeOfStackReserve = this.LONG64();
      obj.SizeOfStackCommit = this.LONG64();
      obj.SizeOfHeapReserve = this.LONG64();
      obj.SizeOfHeapCommit = this.LONG64();
  }
    obj.LoaderFlags = this.ULONG();
    obj.NumberOfRvaAndSizes = this.ULONG();
    obj.DataDirectory = new Array();
  
  for(var i=0; i < WindowsConst.WINDOWS_VERSIONS.length; i++)
    if(WindowsConst.WINDOWS_VERSIONS[i].MajorOperatingSystemVersion == obj.MajorOperatingSystemVersion &&
      WindowsConst.WINDOWS_VERSIONS[i].MinorOperatingSystemVersion == obj.MinorOperatingSystemVersion )
      obj.WindowsVersion = WindowsConst.WINDOWS_VERSIONS[i];

  for(var i=0; i < WindowsConst.IMAGE_NUMBEROF_DIRECTORY_ENTRIES; i++)
    obj.DataDirectory.push(this.DataDirectoryRead());

  return obj;
}
WindowsExeFile.prototype.FileHeaderRead = function() {
  var obj = {}
  obj.Machine = this.USHORT();
  obj.Machine = (WindowsConst.IMAGE_FILE_MACHINE_I386.value == obj.Machine) ? WindowsConst.IMAGE_FILE_MACHINE_I386 : 
    ( (WindowsConst.IMAGE_FILE_MACHINE_IA64.value == obj.Machine) ? WindowsConst.IMAGE_FILE_MACHINE_IA64 : WindowsConst.IMAGE_FILE_MACHINE_AMD64 );
  obj.NumberOfSections = this.USHORT();
  obj.TimeDateStamp = new Date(this.ULONG()*1000);
  obj.PointerToSymbolTable = this.ULONG();
  obj.NumberOfSymbols = this.ULONG();
  obj.SizeOfOptionalHeader = this.USHORT();
  obj.Characteristics = this.USHORT();
  return obj;
}
WindowsExeFile.prototype.FileTypeRead = function() {
  var ImageFileTypeWord = this.DWORD();
  
  // Determine the type of PE executable
  if(WindowsConst.LOWORD(ImageFileTypeWord) == WindowsConst.IMAGE_OS2_SIGNATURE.value) return WindowsConst.IMAGE_OS2_SIGNATURE;
  else if (WindowsConst.LOWORD(ImageFileTypeWord) == WindowsConst.IMAGE_OS2_SIGNATURE_LE.value) return WindowsConst.IMAGE_OS2_SIGNATURE_LE;
  else if (ImageFileTypeWord == WindowsConst.IMAGE_NT_SIGNATURE.value) return WindowsConst.IMAGE_NT_SIGNATURE;
  else if (ImageFileTypeWord == WindowsConst.IMAGE_DOS_SIGNATURE.value) return WindowsConst.IMAGE_DOS_SIGNATURE;
  else return {value:ImageFileTypeWord, name:'UNKNOWN'};
}
WindowsExeFile.prototype.DosHeaderRead = function() {
  var obj = {}
  obj.e_magic = this.USHORT();  // Magic number
  if(obj.e_magic != WindowsConst.IMAGE_DOS_SIGNATURE.value) 
    throw new {name:'NotWindowsPEFile', message:'This does not appear to be a valid Windows PE file.'};

  obj.e_cblp = this.USHORT();   // Bytes on last page of file
  obj.e_cp = this.USHORT();   // Pages in file
  obj.e_crlc = this.USHORT();   // Relocations
  obj.e_cparhdr = this.USHORT();  // Size of header in paragraphs
  obj.e_minalloc = this.USHORT(); // Minimum extra paragraphs needed
  obj.e_maxalloc = this.USHORT(); // Maximum extra paragraphs needed
  obj.e_ss = this.USHORT();   // Initial (relative) SS value
  obj.e_sp = this.USHORT();   // Initial SP value
  obj.e_csum = this.USHORT();   // Checksum
  obj.e_ip = this.USHORT();   // Initial IP value
  obj.e_cs = this.USHORT();   // Initial (relative) CS value
  obj.e_lfarlc = this.USHORT(); // File address of relocation table
  obj.e_ovno = this.USHORT();   // Overlay number
  obj.e_res = [ this.USHORT(), this.USHORT(), this.USHORT(), this.USHORT() ]; // Reserved words
  obj.e_oemid = this.USHORT();  // OEM identifier (for e_oeminfo)
  obj.e_oeminfo = this.USHORT();  // OEM information; e_oemid specific
  obj.e_res2 = [
        this.USHORT(), this.USHORT(), this.USHORT(), this.USHORT(), this.USHORT(),
        this.USHORT(), this.USHORT(), this.USHORT(), this.USHORT(), this.USHORT()
      ];              // Reserved words
  obj.e_lfanew = this.LONG();   // File address of new exe header
  return obj;
}
WindowsExeFile.prototype.WindowsExeRead = function() {
  this.DosHeader    = this.DosHeaderRead();     // Read the MSDOS 2 Legacy Header then Jump
  this.Position     = this.DosHeader.e_lfanew;    // Set the position
  this.FileType     = this.FileTypeRead();      // Read the file type information for NT PE
  this.FileHeader   = this.FileHeaderRead();    // Read the file headers
  this.OptionalHeader = this.OptionalHeaderRead();  // Read the optional headers
  this.SectionHeaders = this.SectionHeadersRead();  // Read the section headers
  
  this.ResourcePosition = WindowsConst.GETOFFSETBYDIRECTORY(WindowsConst.IMAGE_DIRECTORY_ENTRY_RESOURCE, this);
  this.Position     = this.ResourcePosition;
  this.Resources    = this.ResourceDirectoryRead(this); // Read resource headers
  delete this.ResourcePosition; 
}

/// MINIMIST ///
var minimist = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {} };
    
    [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
        flags.bools[key] = true;
    });
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function setArg (key, val) {
        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }
    
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            setArg(m[1], m[2]);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
                setArg(key, next);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true');
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next)
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2));
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
                    setArg(key, args[i+1]);
                    i++;
                }
                else if (args[i+1] && /true|false/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true');
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true);
                }
            }
        }
        else {
            argv._.push(
                flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
            );
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    notFlags.forEach(function(key) {
        argv._.push(key);
    });

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function setKey (obj, keys, value) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        if (o[key] === undefined) o[key] = {};
        o = o[key];
    });
    
    var key = keys[keys.length - 1];
    if (o[key] === undefined || typeof o[key] === 'boolean') {
        o[key] = value;
    }
    else if (Array.isArray(o[key])) {
        o[key].push(value);
    }
    else {
        o[key] = [ o[key], value ];
    }
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

/// WORDWRAP ///
var wordwrap = function (start, stop, params) {
    if (typeof start === 'object') {
        params = start;
        start = params.start;
        stop = params.stop;
    }
    
    if (typeof stop === 'object') {
        params = stop;
        start = start || params.start;
        stop = undefined;
    }
    
    if (!stop) {
        stop = start;
        start = 0;
    }
    
    if (!params) params = {};
    var mode = params.mode || 'soft';
    var re = mode === 'hard' ? /\b/ : /(\S+\s+)/;
    
    return function (text) {
        var chunks = text.toString()
            .split(re)
            .reduce(function (acc, x) {
                if (mode === 'hard') {
                    for (var i = 0; i < x.length; i += stop - start) {
                        acc.push(x.slice(i, i + stop - start));
                    }
                }
                else acc.push(x)
                return acc;
            }, [])
        ;
        
        return chunks.reduce(function (lines, rawChunk) {
            if (rawChunk === '') return lines;
            
            var chunk = rawChunk.replace(/\t/g, '    ');
            
            var i = lines.length - 1;
            if (lines[i].length + chunk.length > stop) {
                lines[i] = lines[i].replace(/\s+$/, '');
                
                chunk.split(/\n/).forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else if (chunk.match(/\n/)) {
                var xs = chunk.split(/\n/);
                lines[i] += xs.shift();
                xs.forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else {
                lines[i] += chunk;
            }
            
            return lines;
        }, [ new Array(start + 1).join(' ') ]).join('\n');
    };
};

wordwrap.soft = wordwrap;

wordwrap.hard = function (start, stop) {
    return wordwrap(start, stop, { mode : 'hard' });
};

/// OPTIMIST ///
var path = require('path');

/*  Hack an instance of Argv with process.argv into Argv
    so people can do
        require('optimist')(['--beeble=1','-z','zizzle']).argv
    to parse a list of args and
        require('optimist').argv
    to get a parsed version of process.argv.
*/

var optimist = Argv(process.argv.slice(2));
Object.keys(optimist).forEach(function (key) {
    Argv[key] = typeof optimist[key] == 'function'
        ? optimist[key].bind(optimist)
        : optimist[key];
});

function Argv (processArgs, cwd) {
    var self = {};
    if (!cwd) cwd = process.cwd();
    
    self.$0 = process.argv
        .slice(0,2)
        .map(function (x) {
            var b = rebase(cwd, x);
            return x.match(/^\//) && b.length < x.length
                ? b : x
        })
        .join(' ')
    ;
    
    if (process.env._ != undefined && process.argv[1] == process.env._) {
        self.$0 = process.env._.replace(
            path.dirname(process.execPath) + '/', ''
        );
    }
    
    var options = {
        boolean: [],
        string: [],
        alias: {},
        default: []
    };
    
    self.boolean = function (bools) {
        options.boolean.push.apply(options.boolean, [].concat(bools));
        return self;
    };
    
    self.string = function (strings) {
        options.string.push.apply(options.string, [].concat(strings));
        return self;
    };
    
    self.default = function (key, value) {
        if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                self.default(k, key[k]);
            });
        }
        else {
            options.default[key] = value;
        }
        return self;
    };
    
    self.alias = function (x, y) {
        if (typeof x === 'object') {
            Object.keys(x).forEach(function (key) {
                self.alias(key, x[key]);
            });
        }
        else {
            options.alias[x] = (options.alias[x] || []).concat(y);
        }
        return self;
    };
    
    var demanded = {};
    self.demand = function (keys) {
        if (typeof keys == 'number') {
            if (!demanded._) demanded._ = 0;
            demanded._ += keys;
        }
        else if (Array.isArray(keys)) {
            keys.forEach(function (key) {
                self.demand(key);
            });
        }
        else {
            demanded[keys] = true;
        }
        
        return self;
    };
    
    var usage;
    self.usage = function (msg, opts) {
        if (!opts && typeof msg === 'object') {
            opts = msg;
            msg = null;
        }
        
        usage = msg;
        
        if (opts) self.options(opts);
        
        return self;
    };
    
    function fail (msg) {
        self.showHelp();
        if (msg) console.error(msg);
        process.exit(1);
    }
    
    var checks = [];
    self.check = function (f) {
        checks.push(f);
        return self;
    };
    
    var descriptions = {};
    self.describe = function (key, desc) {
        if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                self.describe(k, key[k]);
            });
        }
        else {
            descriptions[key] = desc;
        }
        return self;
    };
    
    self.parse = function (args) {
        return parseArgs(args);
    };
    
    self.option = self.options = function (key, opt) {
        if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                self.options(k, key[k]);
            });
        }
        else {
            if (opt.alias) self.alias(key, opt.alias);
            if (opt.demand) self.demand(key);
            if (typeof opt.default !== 'undefined') {
                self.default(key, opt.default);
            }
            
            if (opt.boolean || opt.type === 'boolean') {
                self.boolean(key);
            }
            if (opt.string || opt.type === 'string') {
                self.string(key);
            }
            
            var desc = opt.describe || opt.description || opt.desc;
            if (desc) {
                self.describe(key, desc);
            }
        }
        
        return self;
    };
    
    var wrap = null;
    self.wrap = function (cols) {
        wrap = cols;
        return self;
    };
    
    self.showHelp = function (fn) {
        if (!fn) fn = console.error;
        fn(self.help());
    };
    
    self.help = function () {
        var keys = Object.keys(
            Object.keys(descriptions)
            .concat(Object.keys(demanded))
            .concat(Object.keys(options.default))
            .reduce(function (acc, key) {
                if (key !== '_') acc[key] = true;
                return acc;
            }, {})
        );
        
        var help = keys.length ? [ 'Options:' ] : [];
        
        if (usage) {
            help.unshift(usage.replace(/\$0/g, self.$0), '');
        }
        
        var switches = keys.reduce(function (acc, key) {
            acc[key] = [ key ].concat(options.alias[key] || [])
                .map(function (sw) {
                    return (sw.length > 1 ? '--' : '-') + sw
                })
                .join(', ')
            ;
            return acc;
        }, {});
        
        var switchlen = longest(Object.keys(switches).map(function (s) {
            return switches[s] || '';
        }));
        
        var desclen = longest(Object.keys(descriptions).map(function (d) { 
            return descriptions[d] || '';
        }));
        
        keys.forEach(function (key) {
            var kswitch = switches[key];
            var desc = descriptions[key] || '';
            
            if (wrap) {
                desc = wordwrap(switchlen + 4, wrap)(desc)
                    .slice(switchlen + 4)
                ;
            }
            
            var spadding = new Array(
                Math.max(switchlen - kswitch.length + 3, 0)
            ).join(' ');
            
            var dpadding = new Array(
                Math.max(desclen - desc.length + 1, 0)
            ).join(' ');
            
            var type = null;
            
            if (options.boolean[key]) type = '[boolean]';
            if (options.string[key]) type = '[string]';
            
            if (!wrap && dpadding.length > 0) {
                desc += dpadding;
            }
            
            var prelude = '  ' + kswitch + spadding;
            var extra = [
                type,
                demanded[key]
                    ? '[required]'
                    : null
                ,
                options.default[key] !== undefined
                    ? '[default: ' + JSON.stringify(options.default[key]) + ']'
                    : null
                ,
            ].filter(Boolean).join('  ');
            
            var body = [ desc, extra ].filter(Boolean).join('  ');
            
            if (wrap) {
                var dlines = desc.split('\n');
                var dlen = dlines.slice(-1)[0].length
                    + (dlines.length === 1 ? prelude.length : 0)
                
                body = desc + (dlen + extra.length > wrap - 2
                    ? '\n'
                        + new Array(wrap - extra.length + 1).join(' ')
                        + extra
                    : new Array(wrap - extra.length - dlen + 1).join(' ')
                        + extra
                );
            }
            
            help.push(prelude + body);
        });
        
        help.push('');
        return help.join('\n');
    };
    
    Object.defineProperty(self, 'argv', {
        get : function () { return parseArgs(processArgs) },
        enumerable : true,
    });
    
    function parseArgs (args) {
        var argv = minimist(args, options);
        argv.$0 = self.$0;
        
        if (demanded._ && argv._.length < demanded._) {
            fail('Not enough non-option arguments: got '
                + argv._.length + ', need at least ' + demanded._
            );
        }
        
        var missing = [];
        Object.keys(demanded).forEach(function (key) {
            if (!argv[key]) missing.push(key);
        });
        
        if (missing.length) {
            fail('Missing required arguments: ' + missing.join(', '));
        }
        
        checks.forEach(function (f) {
            try {
                if (f(argv) === false) {
                    fail('Argument check failed: ' + f.toString());
                }
            }
            catch (err) {
                fail(err)
            }
        });
        
        return argv;
    }
    
    function longest (xs) {
        return Math.max.apply(
            null,
            xs.map(function (x) { return x.length })
        );
    }
    
    return self;
};

// rebase an absolute path to a relative one with respect to a base directory
// exported for tests
function rebase (base, dir) {
    var ds = path.normalize(dir).split('/').slice(1);
    var bs = path.normalize(base).split('/').slice(1);
    
    for (var i = 0; ds[i] && ds[i] == bs[i]; i++);
    ds.splice(0, i); bs.splice(0, i);
    
    var p = path.normalize(
        bs.map(function () { return '..' }).concat(ds).join('/')
    ).replace(/\/$/,'').replace(/^$/, '.');
    return p.match(/^[.\/]/) ? p : './' + p;
};


/// Begin execution. ///

var argv = optimist
    .argv;

if(!argv._[0]) {
  console.log(
    'usage: '+process.argv[0]+' [options] package.json\n' + 
    '\t[--clean]\n'+
    '\t[--no-windows-build]\n'+
    '\t[--no-osx-build]\n'+
    '\t[--windows-runtime=tint.exe]\n'+
    '\t[--osx-runtime=tint]'
  );
  process.exit(0);
}

function readToBase64(e) {
  return fs.readFileSync(e).toString('base64');
}

var build = $tint.loadbuilder(
  argv._[0],
  function error(e, msg) {
    if(msg) console.error(msg);
    if(e.stack) console.error(e.stack);
    else if(!e) throw new Error('unknown');
    console.error(e);
    process.exit(1);
  }, 
  function warning(e) { console.warn(e); }, 
  function progress(e) { console.log(e); }, 
  function success(e) { process.exit(0); }, 
  function start() { }
);
build.reset();
build.prepconfig();
if(argv.clean) build.prepclean();
build.prepobj();
if(argv['windows-runtime']) tintExecutableWindows = readToBase64(argv['windows-runtime']);
if(argv['osx-runtime']) tintExecutableOSX = readToBase64(argv['osx-runtime']);
if(!argv['no-windows-build']) build.prepwin();
if(!argv['no-osx-build']) build.prepmac();
build.postbuild();
build.play();



