#!/usr/local/bin/tint
var assert = require('assert');
var tintVersion = '@@@TINT_VERSION@@@', 
  tintExecutableWindows = '@@@TINT_WINDOWS_EXECUTABLE@@@',
  tintExecutableOSX = '@@@TINT_OSX_EXECUTABLE@@@',
  tintExecutableLinux = '@@@TINT_LINUX_EXECUTABLE@@@',
  baseDirectory = process.cwd(),
  pa = require('path'),
  sourceDirectory = null,
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
  sourceDirectory = $tint.absolute($tint.absolute($tint.dotdot(path),b.data.sources.directory),baseDirectory);
  if(b.data.icon && b.data.icon.osx) b.data.icon.osx[0]=$tint.absolute(b.data.icon.osx[0],sourceDirectory);
  if(b.data.icon && b.data.icon.windows) b.data.icon.windows[0]=$tint.absolute(b.data.icon.windows[0],sourceDirectory);
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
      if ($tint.ndef(this.data.icon))
        throw new Error("The key 'icon' was not found in package.json.");
      if ($tint.ndef(this.data.icon.osx[0]))
        throw new Error("No icon for OSX was found in the package.json, add {icon:{osx:['appicons.png']}} to your package.json.");
      if (!$tint.file(this.data.icon.osx[0]))
        throw new Error("The specified icon for OSX is not a file or could not be read. ["+this.data.icon.osx[0]+"]");
      if (this.data.icon.osx[0].indexOf(".png") == -1)
        throw new Error("The specified icon for OSX is not a png file. ["+this.data.icon.osx[0]+"]");
      if ($tint.ndef(this.data.icon.windows))
        throw new Error("No icon for Windows was found in package.json, add { icon: { windows: ['appicons.png'] } } to package.json.");
      if ($tint.ndef(this.data.icon.windows[0]))
        throw new Error("No icon was found for Windows (note, the { icon: { windows } } entry was found, but it wasnt an array) inpackage.json.");
      if (!$tint.file(this.data.icon.windows[0]))
        throw new Error("The specified icon for windows is not a file or could not be read. ["+this.data.icon.windows[0]+"]");
      if (this.data.icon.windows[0].indexOf(".png") == -1)
        throw new Error("The specified icon for windows is not a png file. ["+this.data.icon.windows[0]+"]");
      if (!this.data.namespace || this.data.namespace.trim() == "")
        throw new Error("The value for namespace was not found in package.json.");
      if (!$tint.exists($tint.path([sourceDirectory,this.data.sources.directory.trim(),this.data.main.trim()])))
        throw new Error("The value for main in package.json was not found or does not exist. ["+this.data.main+"]");
    },
    config:function() {
      var obj = {};
      // Determine from our process where the resources directory may be, 
      // give a few options to check before giving up.
      var runproc = process.execPath.split(pa.sep);
      // Create build configuration
      obj.obsfucate = this.data.obsfucate;
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
              if($tint.file(b.absin) && 
                this.conf.obsfucate && 
                b.absin.toLowerCase().indexOf('.js') === (b.absin.length - 3)) 
              {
                var src = path.normalize(b.absin);
                var dst = path.normalize(b.absout);
                var data = fs.readFileSync(src.toString(), {encoding:'utf8'}).toString('utf8');
                // uglify chokes on beginning tabs in code.
                data = data.replace(/\n\t/g,'\n  ');
                fs.writeFileSync(dst, UglifyJS.minify(data, {mangle:true, fromString:true}).code);
              } else {
                $tint.copy(b.absin,b.absout);
              }
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
      // To prevent escaping both the first and second macro, we'll "add this"
      assert(tintExecutableWindows !== ('@@@' + 'TINT_WINDOWS_EXECUTABLE' + '@@@'), 'The runtime for windows could not be found.');
      var winExec = new Buffer(tintExecutableWindows, 'base64');
      this.packageExecSize = winExec.length;
      try {
      this.tasks=this.tasks.concat([
        function(){ 
          this.pngdata=$tint.read(this.data.icon.windows[0]);
          this.tick("reading windows icon");
        }.bind(this),
        function(){
          try {
            $tint.parsepng(this.pngdata,function(e){
                this.onError(e);
                return false;
              }.bind(this),
              function(e){
                try {
                  this.windowsiconlrg=e;
                  this.tick("creating icon data"); 
                } catch(e) {
                  this.onError(e);
                  return false;
                }
              }.bind(this));
          } catch (e) {
            this.onError(e); 
            return false; 
          }
        }.bind(this),
        function(){ 
          this.onProgress("creating windows application");
          $tint.makedir($tint.dotdot(this.conf.winapp));
          fs.writeFileSync(this.conf.winapp, winExec);
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
        function(){ if(os.platform() === 'darwin' || os.platform() === 'mac') { this.conf.perms.forEach(function(e){ fs.chmodSync(e,'755'); }.bind(this)); } this.tick("fixing permissions"); }.bind(this),
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
  src = path.normalize(src);
  dst = path.normalize(dst);
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
  if (os.platform() !== 'darwin' && os.platform() !== 'mac') {
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
    if(meta.width!=512 || meta.height!=512) {
      errf('Icon must be 512 by 512 pixels. ['+JSON.stringify(meta)+']');
      //throw new Error('PNGERR');
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
  //var subsystemPos = winexe.SubsystemPosition;
  fs.closeSync(fd);
  //var buf = new Buffer(2);
  //buf.writeUInt16LE(WindowsConst.IMAGE_SUBSYSTEM_WINDOWS_GUI,0);
  //$tint.writebindata(buf,target,subsystemPos);
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
      ' <key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><true/></dict>' +
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
WindowsConst.IMAGE_SUBSYSTEM_WINDOWS_GUI = 2; // GUI application
WindowsConst.IMAGE_SUBSYSTEM_WINDOWS_CUI = 3; // Conosle application
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
// IMAGE_OPTIONAL_HEADER
// https://msdn.microsoft.com/en-us/library/windows/desktop/ms680339(v=vs.85).aspx
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
    throw new Error('The runtime given for Tint appears to be corrupted, expected legacy MSDOS Signature: ['+WindowsConst.IMAGE_DOS_SIGNATURE.value+'] but got: ['+obj.e_magic+']');

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
  .boolean(['clean','no-windows-build','no-osx-build'])
  .usage(
    'Tint Build Tool ('+tintVersion+')\n'+
    'usage: tntbuild [options] package.json\n')
  .string(['out',0])
  .describe('out', 'The directory to write the output to instead of the default \'build\'')
  .describe('clean', 'Clean the build directory, removing any application files before beginning.')
  .describe('no-windows-build', 'Do not compile a windows version of the application.')
  .describe('no-osx-build', 'Do not compile an OS X version of the application')
  .describe('windows-runtime', 'The runtime to use for Windows (instead of the built-in)')
  .describe('osx-runtime', 'The runtime to use for OS X (instead of the built-in)')
  .demand(1)
  .argv;


function readToBase64(e) {
  try {
    return fs.readFileSync(e).toString('base64');
  } catch (err) {
    console.error('Cannot open (or find) file '+e+'.');
    process.exit(1);
  }
}
var totaltickamount = 0;
var tickamount = 0;
var build = $tint.loadbuilder(
  argv._[0],
  function error(e, msg) {

    if(msg) console.error("Error: "+msg);
    if(e.stack) console.error(e.stack);
   // else if(!e) throw new Error('unknown');
    if(e.message) console.error("Error: "+e.message);
    if(!msg && !e.message) {
      console.error("Error: "+e+" "+ (msg ? msg : ""));
    }
    process.exit(1);
  }, 
  function warning(e) { console.warn(e); }, 
  function progress(e) { 
    totaltickamount = build.tasks.length > totaltickamount ? build.tasks.length : totaltickamount;
    console.log('[' + tickamount + ' of ' + totaltickamount + '] ' + e);
    tickamount++;
  }, 
  function success(e) { process.exit(0); }, 
  function start() { }
);


if(argv['out']) {
  outputDirectory = argv['out'];
  if(outputDirectory[0] !== '/') {
    outputDirectory = $tint.absolute(outputDirectory,process.cwd());
  }
  baseDirectory = $tint.dotdot(outputDirectory);
} else {
  outputDirectory = baseDirectory+pa.sep+'build';
}
resourceDirectory = outputDirectory+pa.sep+'tmp';

build.reset();
build.prepconfig();

if(argv.clean) build.prepclean();
build.prepobj();
if(argv['windows-runtime']) tintExecutableWindows = readToBase64(path.normalize(argv['windows-runtime']));
if(argv['osx-runtime']) tintExecutableOSX = readToBase64(path.normalize(argv['osx-runtime']));
if(!argv['no-windows-build'] && argv['windows-build'] !== false) {
  build.prepwin();
}
if(!argv['no-osx-build'] && argv['osx-build'] !== false) {
  build.prepmac();
}
build.postbuild();
build.play();



///// minified uglifyjs2 /////
var path=require("path"),fs=require("fs"),vm=require("vm");exports=function(n,e){function t(n){for(var e=Object.create(null),t=0;t<n.length;++t)e[n[t]]=!0;return e}function r(n,e){return Array.prototype.slice.call(n,e||0)}function o(n){return n.split("")}function i(n,e){for(var t=e.length;--t>=0;)if(e[t]==n)return!0;return!1}function a(n,e){for(var t=0,r=e.length;r>t;++t)if(n(e[t]))return e[t]}function u(n,e){if(0>=e)return"";if(1==e)return n;var t=u(n,e>>1);return t+=t,1&e&&(t+=n),t}function s(n,e){Error.call(this,n),this.msg=n,this.defs=e}function c(n,e,t){n===!0&&(n={});var r=n||{};if(t)for(var o in r)r.hasOwnProperty(o)&&!e.hasOwnProperty(o)&&s.croak("`"+o+"` is not a supported option",e);for(var o in e)e.hasOwnProperty(o)&&(r[o]=n&&n.hasOwnProperty(o)?n[o]:e[o]);return r}function f(n,e){var t=0;for(var r in e)e.hasOwnProperty(r)&&(n[r]=e[r],t++);return t}function l(){}function p(n,e){n.indexOf(e)<0&&n.push(e)}function d(n,e){return n.replace(/\{(.+?)\}/g,function(n,t){return e[t]})}function h(n,e){for(var t=n.length;--t>=0;)n[t]===e&&n.splice(t,1)}function m(n,e){function t(n,t){for(var r=[],o=0,i=0,a=0;o<n.length&&i<t.length;)e(n[o],t[i])<=0?r[a++]=n[o++]:r[a++]=t[i++];return o<n.length&&r.push.apply(r,n.slice(o)),i<t.length&&r.push.apply(r,t.slice(i)),r}function r(n){if(n.length<=1)return n;var e=Math.floor(n.length/2),o=n.slice(0,e),i=n.slice(e);return o=r(o),i=r(i),t(o,i)}return n.length<2?n.slice():r(n)}function _(n,e){return n.filter(function(n){return e.indexOf(n)<0})}function v(n,e){return n.filter(function(n){return e.indexOf(n)>=0})}function g(n){function e(n){if(1==n.length)return t+="return str === "+JSON.stringify(n[0])+";";t+="switch(str){";for(var e=0;e<n.length;++e)t+="case "+JSON.stringify(n[e])+":";t+="return true}return false;"}n instanceof Array||(n=n.split(" "));var t="",r=[];n:for(var o=0;o<n.length;++o){for(var i=0;i<r.length;++i)if(r[i][0].length==n[o].length){r[i].push(n[o]);continue n}r.push([n[o]])}if(r.length>3){r.sort(function(n,e){return e.length-n.length}),t+="switch(str.length){";for(var o=0;o<r.length;++o){var a=r[o];t+="case "+a[0].length+":",e(a)}t+="}"}else e(n);return new Function("str",t)}function b(n,e){for(var t=n.length;--t>=0;)if(!e(n[t]))return!1;return!0}function y(){this._values=Object.create(null),this._size=0}function A(n,e,t,r){arguments.length<4&&(r=X),e=e?e.split(/\s+/):[];var o=e;r&&r.PROPS&&(e=e.concat(r.PROPS));for(var i="return function AST_"+n+"(props){ if (props) { ",a=e.length;--a>=0;)i+="this."+e[a]+" = props."+e[a]+";";var u=r&&new r;(u&&u.initialize||t&&t.initialize)&&(i+="this.initialize();"),i+="}}";var s=new Function(i)();if(u&&(s.prototype=u,s.BASE=r),r&&r.SUBCLASSES.push(s),s.prototype.CTOR=s,s.PROPS=e||null,s.SELF_PROPS=o,s.SUBCLASSES=[],n&&(s.prototype.TYPE=s.TYPE=n),t)for(a in t)t.hasOwnProperty(a)&&(/^\$/.test(a)?s[a.substr(1)]=t[a]:s.prototype[a]=t[a]);return s.DEFMETHOD=function(n,e){this.prototype[n]=e},s}function w(n,e){n.body instanceof G?n.body._walk(e):n.body.forEach(function(n){n._walk(e)})}function E(n){this.visit=n,this.stack=[]}function D(n){return n>=97&&122>=n||n>=65&&90>=n||n>=170&&Pe.letter.test(String.fromCharCode(n))}function F(n){return n>=48&&57>=n}function S(n){return F(n)||D(n)}function C(n){return Pe.digit.test(String.fromCharCode(n))}function k(n){return Pe.non_spacing_mark.test(n)||Pe.space_combining_mark.test(n)}function B(n){return Pe.connector_punctuation.test(n)}function x(n){return!xe(n)&&/^[a-z_$][a-z0-9_$]*$/i.test(n)}function T(n){return 36==n||95==n||D(n)}function O(n){var e=n.charCodeAt(0);return T(e)||F(e)||8204==e||8205==e||k(n)||B(n)||C(e)}function $(n){return/^[a-z_$][a-z0-9_$]*$/i.test(n)}function M(n){return $e.test(n)?parseInt(n.substr(2),16):Me.test(n)?parseInt(n.substr(1),8):qe.test(n)?parseFloat(n):void 0}function q(n,e,t,r,o){this.message=n,this.filename=e,this.line=t,this.col=r,this.pos=o,this.stack=(new Error).stack}function N(n,e,t,r,o){throw new q(n,e,t,r,o)}function z(n,e,t){return n.type==e&&(null==t||n.value==t)}function R(n,e,t){function r(){return D.text.charAt(D.pos)}function o(n,e){var t=D.text.charAt(D.pos++);if(n&&!t)throw Ie;return"\r\n\u2028\u2029".indexOf(t)>=0?(D.newline_before=D.newline_before||!e,++D.line,D.col=0,e||"\r"!=t||"\n"!=r()||(++D.pos,t="\n")):++D.col,t}function i(n){for(;n-->0;)o()}function a(n){return D.text.substr(D.pos,n.length)==n}function u(n,e){var t=D.text.indexOf(n,D.pos);if(e&&-1==t)throw Ie;return t}function s(){D.tokline=D.line,D.tokcol=D.col,D.tokpos=D.pos}function c(n,t,r){D.regex_allowed="operator"==n&&!Le(t)||"keyword"==n&&Te(t)||"punc"==n&&Re(t),C="punc"==n&&"."==t;var o={type:n,value:t,line:D.tokline,col:D.tokcol,pos:D.tokpos,endline:D.line,endcol:D.col,endpos:D.pos,nlb:D.newline_before,file:e};if(!r){o.comments_before=D.comments_before,D.comments_before=[];for(var i=0,a=o.comments_before.length;a>i;i++)o.nlb=o.nlb||o.comments_before[i].nlb}return D.newline_before=!1,new Y(o)}function f(){for(var n;ze(n=r())||"\u2028"==n||"\u2029"==n;)o()}function l(n){for(var e,t="",i=0;(e=r())&&n(e,i++);)t+=o();return t}function p(n){N(n,e,D.tokline,D.tokcol,D.tokpos)}function d(n){var e=!1,t=!1,r=!1,o="."==n,i=l(function(i,a){var u=i.charCodeAt(0);switch(u){case 120:case 88:return r?!1:r=!0;case 101:case 69:return r?!0:e?!1:e=t=!0;case 45:return t||0==a&&!n;case 43:return t;case t=!1,46:return o||r||e?!1:o=!0}return S(u)});n&&(i=n+i);var a=M(i);return isNaN(a)?void p("Invalid syntax: "+i):c("num",a)}function h(n){var e=o(!0,n);switch(e.charCodeAt(0)){case 110:return"\n";case 114:return"\r";case 116:return" ";case 98:return"\b";case 118:return"";case 102:return"\f";case 48:return"\x00";case 120:return String.fromCharCode(m(2));case 117:return String.fromCharCode(m(4));case 10:return"";case 13:if("\n"==r())return o(!0,n),""}return e}function m(n){for(var e=0;n>0;--n){var t=parseInt(o(!0),16);isNaN(t)&&p("Invalid hex-character pattern in string"),e=e<<4|t}return e}function _(n){var e,t=D.regex_allowed,r=u("\n");return-1==r?(e=D.text.substr(D.pos),D.pos=D.text.length):(e=D.text.substring(D.pos,r),D.pos=r),D.col=D.tokcol+(D.pos-D.tokpos),D.comments_before.push(c(n,e,!0)),D.regex_allowed=t,E()}function v(){for(var n,e,t=!1,i="",a=!1;null!=(n=r());)if(t)"u"!=n&&p("Expecting UnicodeEscapeSequence -- uXXXX"),n=h(),O(n)||p("Unicode char: "+n.charCodeAt(0)+" is not valid in identifier"),i+=n,t=!1;else if("\\"==n)a=t=!0,o();else{if(!O(n))break;i+=o()}return ke(i)&&a&&(e=i.charCodeAt(0).toString(16).toUpperCase(),i="\\u"+"0000".substr(e.length)+e+i.slice(1)),i}function g(n){function e(n){if(!r())return n;var t=n+r();return Ne(t)?(o(),e(t)):n}return c("operator",e(n||o()))}function b(){switch(o(),r()){case"/":return o(),_("comment1");case"*":return o(),B()}return D.regex_allowed?x(""):g("/")}function y(){return o(),F(r().charCodeAt(0))?d("."):c("punc",".")}function A(){var n=v();return C?c("name",n):Be(n)?c("atom",n):ke(n)?Ne(n)?c("operator",n):c("keyword",n):c("name",n)}function w(n,e){return function(t){try{return e(t)}catch(r){if(r!==Ie)throw r;p(n)}}}function E(n){if(null!=n)return x(n);if(f(),s(),t){if(a("<!--"))return i(4),_("comment3");if(a("-->")&&D.newline_before)return i(3),_("comment4")}var e=r();if(!e)return c("eof");var u=e.charCodeAt(0);switch(u){case 34:case 39:return k(e);case 46:return y();case 47:return b()}return F(u)?d():He(e)?c("punc",o()):Oe(e)?g():92==u||T(u)?A():void p("Unexpected character '"+e+"'")}var D={text:n,filename:e,pos:0,tokpos:0,line:1,tokline:0,col:0,tokcol:0,newline_before:!1,regex_allowed:!1,comments_before:[]},C=!1,k=w("Unterminated string constant",function(n){for(var e=o(),t="";;){var r=o(!0,!0);if("\\"==r){var i=0,a=null;r=l(function(n){if(n>="0"&&"7">=n){if(!a)return a=n,++i;if("3">=a&&2>=i)return++i;if(a>="4"&&1>=i)return++i}return!1}),r=i>0?String.fromCharCode(parseInt(r,8)):h(!0)}else if(r==e)break;t+=r}var u=c("string",t);return u.quote=n,u}),B=w("Unterminated multiline comment",function(){var n=D.regex_allowed,e=u("*/",!0),t=D.text.substring(D.pos,e),r=t.split("\n"),o=r.length;D.pos=e+2,D.line+=o-1,o>1?D.col=r[o-1].length:D.col+=r[o-1].length,D.col+=2;var i=D.newline_before=D.newline_before||t.indexOf("\n")>=0;return D.comments_before.push(c("comment2",t,!0)),D.regex_allowed=n,D.newline_before=i,E()}),x=w("Unterminated regular expression",function(n){for(var e,t=!1,r=!1;e=o(!0);)if(t)n+="\\"+e,t=!1;else if("["==e)r=!0,n+=e;else if("]"==e&&r)r=!1,n+=e;else{if("/"==e&&!r)break;"\\"==e?t=!0:n+=e}var i=v();return c("regexp",new RegExp(n,i))});return E.context=function(n){return n&&(D=n),D},E}function H(n,e){function t(n,e){return z(I.token,n,e)}function r(){return I.peeked||(I.peeked=I.input())}function o(){return I.prev=I.token,I.peeked?(I.token=I.peeked,I.peeked=null):I.token=I.input(),I.in_directives=I.in_directives&&("string"==I.token.type||t("punc",";")),I.token}function i(){return I.prev}function u(n,e,t,r){var o=I.input.context();N(n,o.filename,null!=e?e:o.tokline,null!=t?t:o.tokcol,null!=r?r:o.tokpos)}function s(n,e){u(e,n.line,n.col)}function f(n){null==n&&(n=I.token),s(n,"Unexpected token: "+n.type+" ("+n.value+")")}function l(n,e){return t(n,e)?o():void s(I.token,"Unexpected token "+I.token.type+" «"+I.token.value+"», expected "+n+" «"+e+"»")}function p(n){return l("punc",n)}function d(){return!e.strict&&(I.token.nlb||t("eof")||t("punc","}"))}function h(){t("punc",";")?o():d()||f()}function m(){p("(");var n=bn(!0);return p(")"),n}function _(n){return function(){var e=I.token,t=n(),r=i();return t.start=e,t.end=r,t}}function v(){(t("operator","/")||t("operator","/="))&&(I.peeked=null,I.token=I.input(I.token.value.substr(1)))}function g(){var n=M(le);a(function(e){return e.name==n.name},I.labels)&&u("Label "+n.name+" defined twice"),p(":"),I.labels.push(n);var e=U();return I.labels.pop(),e instanceof an||n.references.forEach(function(e){e instanceof Fn&&(e=e.label.start,u("Continue label `"+n.name+"` refers to non-IterationStatement.",e.line,e.col,e.pos))}),new on({body:e,label:n})}function b(n){return new Q({body:(n=bn(!0),h(),n)})}function y(n){var e,t=null;d()||(t=M(de,!0)),null!=t?(e=a(function(n){return n.name==t.name},I.labels),e||u("Undefined label "+t.name),t.thedef=e):0==I.in_loop&&u(n.TYPE+" not inside a loop or switch"),h();var r=new n({label:t});return e&&e.references.push(r),r}function A(){p("(");var n=null;return!t("punc",";")&&(n=t("keyword","var")?(o(),V(!0)):bn(!0,!0),t("operator","in"))?(n instanceof qn&&n.definitions.length>1&&u("Only one variable declaration allowed in for..in loop"),o(),E(n)):w(n)}function w(n){p(";");var e=t("punc",";")?null:bn(!0);p(";");var r=t("punc",")")?null:bn(!0);return p(")"),new fn({init:n,condition:e,step:r,body:P(U)})}function E(n){var e=n instanceof qn?n.definitions[0].name:null,t=bn(!0);return p(")"),new ln({init:n,name:e,object:t,body:P(U)})}function D(){var n=m(),e=U(),r=null;return t("keyword","else")&&(o(),r=U()),new Sn({condition:n,body:e,alternative:r})}function F(){p("{");for(var n=[];!t("punc","}");)t("eof")&&f(),n.push(U());return o(),n}function S(){p("{");for(var n,e=[],r=null,a=null;!t("punc","}");)t("eof")&&f(),t("keyword","case")?(a&&(a.end=i()),r=[],a=new xn({start:(n=I.token,o(),n),expression:bn(!0),body:r}),e.push(a),p(":")):t("keyword","default")?(a&&(a.end=i()),r=[],a=new Bn({start:(n=I.token,o(),p(":"),n),body:r}),e.push(a)):(r||f(),r.push(U()));return a&&(a.end=i()),o(),e}function C(){var n=F(),e=null,r=null;if(t("keyword","catch")){var a=I.token;o(),p("(");var s=M(fe);p(")"),e=new On({start:a,argname:s,body:F(),end:i()})}if(t("keyword","finally")){var a=I.token;o(),r=new $n({start:a,body:F(),end:i()})}return e||r||u("Missing catch/finally blocks"),new Tn({body:n,bcatch:e,bfinally:r})}function k(n,e){for(var r=[];r.push(new zn({start:I.token,name:M(e?ae:ie),value:t("operator","=")?(o(),bn(!1,n)):null,end:i()})),t("punc",",");)o();return r}function B(){var n,e=I.token;switch(e.type){case"name":case"keyword":n=$(pe);break;case"num":n=new ve({start:e,end:e,value:e.value});break;case"string":n=new _e({start:e,end:e,value:e.value,quote:e.quote});break;case"regexp":n=new ge({start:e,end:e,value:e.value});break;case"atom":switch(e.value){case"false":n=new Se({start:e,end:e});break;case"true":n=new Ce({start:e,end:e});break;case"null":n=new ye({start:e,end:e})}}return o(),n}function x(n,e,r){for(var i=!0,a=[];!t("punc",n)&&(i?i=!1:p(","),!e||!t("punc",n));)t("punc",",")&&r?a.push(new Ee({start:I.token,end:I.token})):a.push(bn(!1));return o(),a}function T(){var n=I.token;switch(o(),n.type){case"num":case"string":case"name":case"operator":case"keyword":case"atom":return n.value;default:f()}}function O(){var n=I.token;switch(o(),n.type){case"name":case"operator":case"keyword":case"atom":return n.value;default:f()}}function $(n){var e=I.token.value;return new("this"==e?he:n)({name:String(e),start:I.token,end:I.token})}function M(n,e){if(!t("name"))return e||u("Name expected"),null;var r=$(n);return o(),r}function q(n,e,t){return"++"!=e&&"--"!=e||j(t)||u("Invalid use of "+e+" operator"),new n({operator:e,expression:t})}function H(n){return un(rn(!0),0,n)}function j(n){return e.strict?n instanceof he?!1:n instanceof Pn||n instanceof te:!0}function P(n){++I.in_loop;var e=n();return--I.in_loop,e}e=c(e,{strict:!1,filename:null,toplevel:null,expression:!1,html5_comments:!0,bare_returns:!1});var I={input:"string"==typeof n?R(n,e.filename,e.html5_comments):n,token:null,prev:null,peeked:null,in_function:0,in_directives:!0,in_loop:0,labels:[]};I.token=o();var U=_(function(){var n;switch(v(),I.token.type){case"string":var a=I.in_directives,s=b();return a&&s.body instanceof _e&&!t("punc",",")?new Z({start:s.body.start,end:s.body.end,quote:s.body.quote,value:s.body.value}):s;case"num":case"regexp":case"operator":case"atom":return b();case"name":return z(r(),"punc",":")?g():b();case"punc":switch(I.token.value){case"{":return new en({start:I.token,body:F(),end:i()});case"[":case"(":return b();case";":return o(),new tn;default:f()}case"keyword":switch(n=I.token.value,o(),n){case"break":return y(Dn);case"continue":return y(Fn);case"debugger":return h(),new K;case"do":return new sn({body:P(U),condition:(l("keyword","while"),n=m(),h(),n)});case"while":return new cn({condition:m(),body:P(U)});case"for":return A();case"function":return L(gn);case"if":return D();case"return":return 0!=I.in_function||e.bare_returns||u("'return' outside of function"),new An({value:t("punc",";")?(o(),null):d()?null:(n=bn(!0),h(),n)});case"switch":return new Cn({expression:m(),body:P(S)});case"throw":return I.token.nlb&&u("Illegal newline after 'throw'"),new wn({value:(n=bn(!0),h(),n)});case"try":return C();case"var":return n=V(),h(),n;case"const":return n=W(),h(),n;case"with":return new pn({expression:m(),body:U()});default:f()}}}),L=function(n){var e=n===gn,r=t("name")?M(e?se:ce):null;return e&&!r&&f(),p("("),new n({name:r,argnames:function(n,e){for(;!t("punc",")");)n?n=!1:p(","),e.push(M(ue));return o(),e}(!0,[]),body:function(n,e){++I.in_function,I.in_directives=!0,I.in_loop=0,I.labels=[];var t=F();return--I.in_function,I.in_loop=n,I.labels=e,t}(I.in_loop,I.labels)})},V=function(n){return new qn({start:i(),definitions:k(n,!1),end:i()})},W=function(){return new Nn({start:i(),definitions:k(!1,!0),end:i()})},J=function(){var n=I.token;l("operator","new");var e,r=Y(!1);return t("punc","(")?(o(),e=x(")")):e=[],nn(new Hn({start:n,expression:r,args:e,end:i()}),!0)},Y=function(n){if(t("operator","new"))return J();var e=I.token;if(t("punc")){switch(e.value){case"(":o();var r=bn(!0);return r.start=e,r.end=I.token,p(")"),nn(r,n);case"[":return nn(X(),n);case"{":return nn(G(),n)}f()}if(t("keyword","function")){o();var a=L(vn);return a.start=e,a.end=i(),nn(a,n)}return Ye[I.token.type]?nn(B(),n):void f()},X=_(function(){return p("["),new Gn({elements:x("]",!e.strict,!0)})}),G=_(function(){p("{");for(var n=!0,r=[];!t("punc","}")&&(n?n=!1:p(","),e.strict||!t("punc","}"));){var a=I.token,u=a.type,s=T();if("name"==u&&!t("punc",":")){if("get"==s){r.push(new ee({start:a,key:B(),value:L(_n),end:i()}));continue}if("set"==s){r.push(new ne({start:a,key:B(),value:L(_n),end:i()}));continue}}p(":"),r.push(new Qn({start:a,quote:a.quote,key:s,value:bn(!1),end:i()}))}return o(),new Kn({properties:r})}),nn=function(n,e){var r=n.start;if(t("punc","."))return o(),nn(new In({start:r,expression:n,property:O(),end:i()}),e);if(t("punc","[")){o();var a=bn(!0);return p("]"),nn(new Un({start:r,expression:n,property:a,end:i()}),e)}return e&&t("punc","(")?(o(),nn(new Rn({start:r,expression:n,args:x(")"),end:i()}),!0)):n},rn=function(n){var e=I.token;if(t("operator")&&Ue(e.value)){o(),v();var r=q(Vn,e.value,rn(n));return r.start=e,r.end=i(),r}for(var a=Y(n);t("operator")&&Le(I.token.value)&&!I.token.nlb;)a=q(Wn,I.token.value,a),a.start=e,a.end=I.token,o();return a},un=function(n,e,r){var i=t("operator")?I.token.value:null;"in"==i&&r&&(i=null);var a=null!=i?We[i]:null;if(null!=a&&a>e){o();var u=un(rn(!0),a,r);return un(new Jn({start:n.start,left:n,operator:i,right:u,end:u.end}),e,r)}return n},dn=function(n){var e=I.token,r=H(n);if(t("operator","?")){o();var a=bn(!1);return p(":"),new Yn({start:e,condition:r,consequent:a,alternative:bn(!1,n),end:i()})}return r},mn=function(n){var e=I.token,r=dn(n),a=I.token.value;if(t("operator")&&Ve(a)){if(j(r))return o(),new Xn({start:e,left:r,operator:a,right:mn(n),end:i()});u("Invalid assignment")}return r},bn=function(n,e){var i=I.token,a=mn(e);return n&&t("punc",",")?(o(),new jn({start:i,car:a,cdr:bn(!0,e),end:r()})):a};return e.expression?bn(!0):function(){for(var n=I.token,r=[];!t("eof");)r.push(U());var o=i(),a=e.toplevel;return a?(a.body=a.body.concat(r),a.end=o):a=new hn({start:n,body:r,end:o}),a}()}function j(n,e){E.call(this),this.before=n,this.after=e}function P(n,e,t){this.name=t.name,this.orig=[t],this.scope=n,this.references=[],this.global=!1,this.mangled_name=null,this.undeclared=!1,this.constant=!1,this.index=e}function I(n){function e(n,e){return n.replace(/[\u0080-\uffff]/g,function(n){var t=n.charCodeAt(0).toString(16);if(t.length<=2&&!e){for(;t.length<2;)t="0"+t;return"\\x"+t}for(;t.length<4;)t="0"+t;return"\\u"+t})}function t(t,r){function o(){return"'"+t.replace(/\x27/g,"\\'")+"'"}function i(){return'"'+t.replace(/\x22/g,'\\"')+'"'}var a=0,u=0;switch(t=t.replace(/[\\\b\f\n\r\t\x22\x27\u2028\u2029\0\ufeff]/g,function(n){switch(n){case"\\":return"\\\\";case"\b":return"\\b";case"\f":return"\\f";case"\n":return"\\n";case"\r":return"\\r";case"\u2028":return"\\u2028";case"\u2029":return"\\u2029";case'"':return++a,'"';case"'":return++u,"'";case"\x00":return"\\x00";case"\ufeff":return"\\ufeff"}return n}),n.ascii_only&&(t=e(t)),n.quote_style){case 1:return o();case 2:return i();case 3:return"'"==r?o():i();default:return a>u?o():i()}}function r(e,r){var o=t(e,r);return n.inline_script&&(o=o.replace(/<\x2fscript([>\/\t\n\f\r ])/gi,"<\\/script$1")),o}function o(t){return t=t.toString(),n.ascii_only&&(t=e(t,!0)),t}function i(e){return u(" ",n.indent_start+A-e*n.indent_level)}function a(){return k.charAt(k.length-1)}function s(){n.max_line_len&&w>n.max_line_len&&f("\n")}function f(e){e=String(e);var t=e.charAt(0);if(C&&(t&&!(";}".indexOf(t)<0)||/[;]$/.test(k)||(n.semicolons||B(t)?(F+=";",w++,D++):(F+="\n",D++,E++,w=0),n.beautify||(S=!1)),C=!1),!n.beautify&&n.preserve_line&&z[z.length-1])for(var r=z[z.length-1].start.line;r>E;)F+="\n",D++,E++,w=0,S=!1;if(S){var o=a();(O(o)&&(O(t)||"\\"==t)||/^[\+\-\/]$/.test(t)&&t==o)&&(F+=" ",w++,D++),S=!1}var i=e.split(/\r?\n/),u=i.length-1;E+=u,0==u?w+=i[u].length:w=i[u].length,D+=e.length,k=e,F+=e}function p(){C=!1,f(";")}function d(){return A+n.indent_level}function h(n){var e;return f("{"),M(),$(d(),function(){e=n()}),T(),f("}"),e}function m(n){f("(");var e=n();return f(")"),e}function _(n){f("[");var e=n();return f("]"),e}function v(){f(","),x()}function b(){f(":"),n.space_colon&&x()}function y(){return F}n=c(n,{indent_start:0,indent_level:4,quote_keys:!1,space_colon:!0,ascii_only:!1,unescape_regexps:!1,inline_script:!1,width:80,max_line_len:32e3,beautify:!1,source_map:null,bracketize:!1,semicolons:!0,comments:!1,preserve_line:!1,screw_ie8:!1,preamble:null,quote_style:0},!0);var A=0,w=0,E=1,D=0,F="",S=!1,C=!1,k=null,B=g("( [ + * / - , ."),x=n.beautify?function(){f(" ")}:function(){S=!0},T=n.beautify?function(e){n.beautify&&f(i(e?.5:0))}:l,$=n.beautify?function(n,e){n===!0&&(n=d());var t=A;A=n;var r=e();return A=t,r}:function(n,e){return e()},M=n.beautify?function(){f("\n")}:s,q=n.beautify?function(){f(";")}:function(){C=!0},N=n.source_map?function(e,t){try{e&&n.source_map.add(e.file||"?",E,w,e.line,e.col,t||"name"!=e.type?t:e.value)}catch(r){X.warn("Couldn't figure out mapping for {file}:{line},{col} → {cline},{ccol} [{name}]",{file:e.file,line:e.line,col:e.col,cline:E,ccol:w,name:t||""})}}:l;n.preamble&&f(n.preamble.replace(/\r\n?|[\n\u2028\u2029]|\s*$/g,"\n"));var z=[];return{get:y,toString:y,indent:T,indentation:function(){return A},current_width:function(){return w-A},should_break:function(){return n.width&&this.current_width()>=n.width},newline:M,print:f,space:x,comma:v,colon:b,last:function(){return k},semicolon:q,force_semicolon:p,to_ascii:e,print_name:function(n){f(o(n))},print_string:function(n,e){f(r(n,e))},next_indent:d,with_indent:$,with_block:h,with_parens:m,with_square:_,add_mapping:N,option:function(e){return n[e]},line:function(){return E},col:function(){return w},pos:function(){return D},push_node:function(n){z.push(n)},pop_node:function(){return z.pop()},stack:function(){return z},parent:function(n){return z[z.length-2-(n||0)]}}}function U(n,e){return this instanceof U?(j.call(this,this.before,this.after),void(this.options=c(n,{sequences:!e,properties:!e,dead_code:!e,drop_debugger:!e,unsafe:!1,unsafe_comps:!1,conditionals:!e,comparisons:!e,evaluate:!e,booleans:!e,loops:!e,unused:!e,hoist_funs:!e,keep_fargs:!1,keep_fnames:!1,hoist_vars:!1,if_return:!e,join_vars:!e,cascade:!e,side_effects:!e,pure_getters:!1,pure_funcs:null,negate_iife:!e,screw_ie8:!1,drop_console:!1,angular:!1,warnings:!0,global_defs:{}},!0))):new U(n,e)}function L(n){function e(e,o,i,a,u,s){if(r){var c=r.originalPositionFor({line:a,column:u});if(null===c.source)return;e=c.source,a=c.line,u=c.column,s=c.name||s}t.addMapping({generated:{line:o+n.dest_line_diff,column:i},original:{line:a+n.orig_line_diff,column:u},source:e,name:s})}n=c(n,{file:null,root:null,orig:null,orig_line_diff:0,dest_line_diff:0});var t,r=n.orig&&new MOZ_SourceMap.SourceMapConsumer(n.orig);return t=r?MOZ_SourceMap.SourceMapGenerator.fromSourceMap(r):new MOZ_SourceMap.SourceMapGenerator({file:n.file,sourceRoot:n.root}),{add:e,get:function(){return t},toString:function(){return JSON.stringify(t.toJSON())}}}function V(){function n(n){p(e,n)}var e=[];return[Object,Array,Function,Number,String,Boolean,Error,Math,Date,RegExp].forEach(function(e){Object.getOwnPropertyNames(e).map(n),e.prototype&&Object.getOwnPropertyNames(e.prototype).map(n)}),e}function W(n,e){function t(n){return s.indexOf(n)>=0?!1:e.only_cache?f.props.has(n):/^[0-9.]+$/.test(n)?!1:!0}function r(n){return l&&!l.test(n)?!1:s.indexOf(n)>=0?!1:f.props.has(n)||d.indexOf(n)>=0}function o(n){t(n)&&p(d,n)}function i(n){var e=f.props.get(n);if(!e){do e=Xe(++f.cname);while(!t(e));f.props.set(n,e)}return e}function a(n){var e={};try{!function r(n){n.walk(new E(function(n){if(n instanceof jn)return r(n.cdr),!0;if(n instanceof _e)return o(n.value),!0;if(n instanceof Yn)return r(n.consequent),r(n.alternative),!0;throw e}))}(n)}catch(t){if(t!==e)throw t}}function u(n){return n.transform(new j(function(n){return n instanceof jn?n.cdr=u(n.cdr):n instanceof _e?r(n.value)&&(n.value=i(n.value)):n instanceof Yn&&(n.consequent=u(n.consequent),n.alternative=u(n.alternative)),n}))}e=c(e,{reserved:null,cache:null,only_cache:!1,regex:null});var s=e.reserved;null==s&&(s=V());var f=e.cache;null==f&&(f={cname:-1,props:new y});var l=e.regex,d=[];return n.walk(new E(function(n){n instanceof Qn?o(n.key):n instanceof Zn?o(n.key.name):n instanceof In?this.parent()instanceof Xn&&o(n.property):n instanceof Un&&this.parent()instanceof Xn&&a(n.property)})),n.transform(new j(function(n){n instanceof Qn?r(n.key)&&(n.key=i(n.key)):n instanceof Zn?r(n.key.name)&&(n.key.name=i(n.key.name)):n instanceof In?r(n.property)&&(n.property=i(n.property)):n instanceof Un&&(n.property=u(n.property))}))}e.UglifyJS=n,n.minify=function(n,e){e=UglifyJS.defaults(e,{spidermonkey:!1,outSourceMap:null,sourceRoot:null,inSourceMap:null,fromString:!1,warnings:!1,mangle:{},output:null,compress:{}}),UglifyJS.base54.reset();var t=null,r={};if(e.spidermonkey?t=UglifyJS.AST_Node.from_mozilla_ast(n):("string"==typeof n&&(n=[n]),n.forEach(function(n,o){var i=e.fromString?n:fs.readFileSync(n,"utf8");r[n]=i,t=UglifyJS.parse(i,{filename:e.fromString?o:n,toplevel:t})})),e.wrap&&(t=t.wrap_commonjs(e.wrap,e.exportAll)),e.compress){var o={warnings:e.warnings};UglifyJS.merge(o,e.compress),t.figure_out_scope();var i=UglifyJS.Compressor(o);t=t.transform(i)}e.mangle&&(t.figure_out_scope(e.mangle),t.compute_char_frequency(e.mangle),t.mangle_names(e.mangle));var a=e.inSourceMap,u={};if("string"==typeof e.inSourceMap&&(a=fs.readFileSync(e.inSourceMap,"utf8")),e.outSourceMap&&(u.source_map=UglifyJS.SourceMap({file:e.outSourceMap,orig:a,root:e.sourceRoot}),e.sourceMapIncludeSources))for(var s in r)r.hasOwnProperty(s)&&u.source_map.get().setSourceContent(s,r[s]);e.output&&UglifyJS.merge(u,e.output);var c=UglifyJS.OutputStream(u);t.print(c),e.outSourceMap&&(c+="\n//# sourceMappingURL="+e.outSourceMap);var f=u.source_map;return f&&(f+=""),{code:c+"",map:f}},s.prototype=Object.create(Error.prototype),s.prototype.constructor=s,s.croak=function(n,e){throw new s(n,e)};var J=function(){function n(n,i,a){function u(){var u=i(n[s],s),l=u instanceof r;return l&&(u=u.v),u instanceof e?(u=u.v,u instanceof t?f.push.apply(f,a?u.v.slice().reverse():u.v):f.push(u)):u!==o&&(u instanceof t?c.push.apply(c,a?u.v.slice().reverse():u.v):c.push(u)),l}var s,c=[],f=[];if(n instanceof Array)if(a){for(s=n.length;--s>=0&&!u(););c.reverse(),f.reverse()}else for(s=0;s<n.length&&!u();++s);else for(s in n)if(n.hasOwnProperty(s)&&u())break;return f.concat(c)}function e(n){this.v=n}function t(n){this.v=n}function r(n){this.v=n}n.at_top=function(n){return new e(n)},n.splice=function(n){return new t(n)},n.last=function(n){return new r(n)};var o=n.skip={};return n}();y.prototype={set:function(n,e){return this.has(n)||++this._size,this._values["$"+n]=e,this},add:function(n,e){return this.has(n)?this.get(n).push(e):this.set(n,[e]),this},get:function(n){return this._values["$"+n]},del:function(n){return this.has(n)&&(--this._size,delete this._values["$"+n]),this},has:function(n){return"$"+n in this._values},each:function(n){for(var e in this._values)n(this._values[e],e.substr(1))},size:function(){return this._size},map:function(n){var e=[];for(var t in this._values)e.push(n(this._values[t],t.substr(1)));return e},toObject:function(){return this._values}},y.fromObject=function(n){var e=new y;return e._size=f(e._values,n),e};var Y=A("Token","type value line col pos endline endcol endpos nlb comments_before file",{},null),X=A("Node","start end",{clone:function(){return new this.CTOR(this)},$documentation:"Base class of all AST nodes",$propdoc:{start:"[AST_Token] The first token of this node",end:"[AST_Token] The last token of this node"},_walk:function(n){return n._visit(this)},walk:function(n){return this._walk(n)}},null);X.warn_function=null,X.warn=function(n,e){X.warn_function&&X.warn_function(d(n,e))};var G=A("Statement",null,{$documentation:"Base class of all statements"}),K=A("Debugger",null,{$documentation:"Represents a debugger statement"},G),Z=A("Directive","value scope quote",{$documentation:'Represents a directive, like "use strict";',$propdoc:{value:"[string] The value of this directive as a plain string (it's not an AST_String!)",scope:"[AST_Scope/S] The scope that this directive affects",quote:"[string] the original quote character"}},G),Q=A("SimpleStatement","body",{$documentation:"A statement consisting of an expression, i.e. a = 1 + 2",$propdoc:{body:"[AST_Node] an expression node (should not be instanceof AST_Statement)"},_walk:function(n){return n._visit(this,function(){this.body._walk(n)})}},G),nn=A("Block","body",{$documentation:"A body of statements (usually bracketed)",$propdoc:{body:"[AST_Statement*] an array of statements"},_walk:function(n){return n._visit(this,function(){w(this,n)})}},G),en=A("BlockStatement",null,{$documentation:"A block statement"},nn),tn=A("EmptyStatement",null,{$documentation:"The empty statement (empty block or simply a semicolon)",_walk:function(n){return n._visit(this)}},G),rn=A("StatementWithBody","body",{$documentation:"Base class for all statements that contain one nested body: `For`, `ForIn`, `Do`, `While`, `With`",$propdoc:{body:"[AST_Statement] the body; this should always be present, even if it's an AST_EmptyStatement"},_walk:function(n){return n._visit(this,function(){this.body._walk(n)})}},G),on=A("LabeledStatement","label",{$documentation:"Statement with a label",$propdoc:{label:"[AST_Label] a label definition"},_walk:function(n){return n._visit(this,function(){this.label._walk(n),this.body._walk(n)})}},rn),an=A("IterationStatement",null,{$documentation:"Internal class.  All loops inherit from it."},rn),un=A("DWLoop","condition",{$documentation:"Base class for do/while statements",$propdoc:{condition:"[AST_Node] the loop condition.  Should not be instanceof AST_Statement"}},an),sn=A("Do",null,{$documentation:"A `do` statement",_walk:function(n){return n._visit(this,function(){this.body._walk(n),this.condition._walk(n)})}},un),cn=A("While",null,{$documentation:"A `while` statement",_walk:function(n){return n._visit(this,function(){this.condition._walk(n),this.body._walk(n)})}},un),fn=A("For","init condition step",{$documentation:"A `for` statement",$propdoc:{init:"[AST_Node?] the `for` initialization code, or null if empty",condition:"[AST_Node?] the `for` termination clause, or null if empty",step:"[AST_Node?] the `for` update clause, or null if empty"},_walk:function(n){return n._visit(this,function(){this.init&&this.init._walk(n),this.condition&&this.condition._walk(n),this.step&&this.step._walk(n),this.body._walk(n)})}},an),ln=A("ForIn","init name object",{$documentation:"A `for ... in` statement",$propdoc:{init:"[AST_Node] the `for/in` initialization code",name:"[AST_SymbolRef?] the loop variable, only if `init` is AST_Var",object:"[AST_Node] the object that we're looping through"},_walk:function(n){return n._visit(this,function(){this.init._walk(n),this.object._walk(n),this.body._walk(n)})}},an),pn=A("With","expression",{$documentation:"A `with` statement",$propdoc:{expression:"[AST_Node] the `with` expression"},_walk:function(n){return n._visit(this,function(){this.expression._walk(n),this.body._walk(n)})}},rn),dn=A("Scope","directives variables functions uses_with uses_eval parent_scope enclosed cname",{$documentation:"Base class for all statements introducing a lexical scope",$propdoc:{directives:"[string*/S] an array of directives declared in this scope",variables:"[Object/S] a map of name -> SymbolDef for all variables/functions defined in this scope",functions:"[Object/S] like `variables`, but only lists function declarations",uses_with:"[boolean/S] tells whether this scope uses the `with` statement",uses_eval:"[boolean/S] tells whether this scope contains a direct call to the global `eval`",parent_scope:"[AST_Scope?/S] link to the parent scope",enclosed:"[SymbolDef*/S] a list of all symbol definitions that are accessed from this scope or any subscopes",cname:"[integer/S] current index for mangling variables (used internally by the mangler)"}},nn),hn=A("Toplevel","globals",{$documentation:"The toplevel scope",$propdoc:{globals:"[Object/S] a map of name -> SymbolDef for all undeclared names"},wrap_enclose:function(n){var e=this,t=[],r=[];n.forEach(function(n){var e=n.lastIndexOf(":");t.push(n.substr(0,e)),r.push(n.substr(e+1))});var o="(function("+r.join(",")+"){ '$ORIG'; })("+t.join(",")+")";
return o=H(o),o=o.transform(new j(function(n){return n instanceof Z&&"$ORIG"==n.value?J.splice(e.body):void 0}))},wrap_commonjs:function(n,e){var t=this,r=[];e&&(t.figure_out_scope(),t.walk(new E(function(n){n instanceof oe&&n.definition().global&&(a(function(e){return e.name==n.name},r)||r.push(n))})));var o="(function(exports, global){ global['"+n+"'] = exports; '$ORIG'; '$EXPORTS'; }({}, (function(){return this}())))";return o=H(o),o=o.transform(new j(function(n){if(n instanceof Q&&(n=n.body,n instanceof _e))switch(n.getValue()){case"$ORIG":return J.splice(t.body);case"$EXPORTS":var e=[];return r.forEach(function(n){e.push(new Q({body:new Xn({left:new Un({expression:new pe({name:"exports"}),property:new _e({value:n.name})}),operator:"=",right:new pe(n)})}))}),J.splice(e)}}))}},dn),mn=A("Lambda","name argnames uses_arguments",{$documentation:"Base class for functions",$propdoc:{name:"[AST_SymbolDeclaration?] the name of this function",argnames:"[AST_SymbolFunarg*] array of function arguments",uses_arguments:"[boolean/S] tells whether this function accesses the arguments array"},_walk:function(n){return n._visit(this,function(){this.name&&this.name._walk(n),this.argnames.forEach(function(e){e._walk(n)}),w(this,n)})}},dn),_n=A("Accessor",null,{$documentation:"A setter/getter function.  The `name` property is always null."},mn),vn=A("Function",null,{$documentation:"A function expression"},mn),gn=A("Defun",null,{$documentation:"A function definition"},mn),bn=A("Jump",null,{$documentation:"Base class for “jumps” (for now that's `return`, `throw`, `break` and `continue`)"},G),yn=A("Exit","value",{$documentation:"Base class for “exits” (`return` and `throw`)",$propdoc:{value:"[AST_Node?] the value returned or thrown by this statement; could be null for AST_Return"},_walk:function(n){return n._visit(this,this.value&&function(){this.value._walk(n)})}},bn),An=A("Return",null,{$documentation:"A `return` statement"},yn),wn=A("Throw",null,{$documentation:"A `throw` statement"},yn),En=A("LoopControl","label",{$documentation:"Base class for loop control statements (`break` and `continue`)",$propdoc:{label:"[AST_LabelRef?] the label, or null if none"},_walk:function(n){return n._visit(this,this.label&&function(){this.label._walk(n)})}},bn),Dn=A("Break",null,{$documentation:"A `break` statement"},En),Fn=A("Continue",null,{$documentation:"A `continue` statement"},En),Sn=A("If","condition alternative",{$documentation:"A `if` statement",$propdoc:{condition:"[AST_Node] the `if` condition",alternative:"[AST_Statement?] the `else` part, or null if not present"},_walk:function(n){return n._visit(this,function(){this.condition._walk(n),this.body._walk(n),this.alternative&&this.alternative._walk(n)})}},rn),Cn=A("Switch","expression",{$documentation:"A `switch` statement",$propdoc:{expression:"[AST_Node] the `switch` “discriminant”"},_walk:function(n){return n._visit(this,function(){this.expression._walk(n),w(this,n)})}},nn),kn=A("SwitchBranch",null,{$documentation:"Base class for `switch` branches"},nn),Bn=A("Default",null,{$documentation:"A `default` switch branch"},kn),xn=A("Case","expression",{$documentation:"A `case` switch branch",$propdoc:{expression:"[AST_Node] the `case` expression"},_walk:function(n){return n._visit(this,function(){this.expression._walk(n),w(this,n)})}},kn),Tn=A("Try","bcatch bfinally",{$documentation:"A `try` statement",$propdoc:{bcatch:"[AST_Catch?] the catch block, or null if not present",bfinally:"[AST_Finally?] the finally block, or null if not present"},_walk:function(n){return n._visit(this,function(){w(this,n),this.bcatch&&this.bcatch._walk(n),this.bfinally&&this.bfinally._walk(n)})}},nn),On=A("Catch","argname",{$documentation:"A `catch` node; only makes sense as part of a `try` statement",$propdoc:{argname:"[AST_SymbolCatch] symbol for the exception"},_walk:function(n){return n._visit(this,function(){this.argname._walk(n),w(this,n)})}},nn),$n=A("Finally",null,{$documentation:"A `finally` node; only makes sense as part of a `try` statement"},nn),Mn=A("Definitions","definitions",{$documentation:"Base class for `var` or `const` nodes (variable declarations/initializations)",$propdoc:{definitions:"[AST_VarDef*] array of variable definitions"},_walk:function(n){return n._visit(this,function(){this.definitions.forEach(function(e){e._walk(n)})})}},G),qn=A("Var",null,{$documentation:"A `var` statement"},Mn),Nn=A("Const",null,{$documentation:"A `const` statement"},Mn),zn=A("VarDef","name value",{$documentation:"A variable declaration; only appears in a AST_Definitions node",$propdoc:{name:"[AST_SymbolVar|AST_SymbolConst] name of the variable",value:"[AST_Node?] initializer, or null of there's no initializer"},_walk:function(n){return n._visit(this,function(){this.name._walk(n),this.value&&this.value._walk(n)})}}),Rn=A("Call","expression args",{$documentation:"A function call expression",$propdoc:{expression:"[AST_Node] expression to invoke as function",args:"[AST_Node*] array of arguments"},_walk:function(n){return n._visit(this,function(){this.expression._walk(n),this.args.forEach(function(e){e._walk(n)})})}}),Hn=A("New",null,{$documentation:"An object instantiation.  Derives from a function call since it has exactly the same properties"},Rn),jn=A("Seq","car cdr",{$documentation:"A sequence expression (two comma-separated expressions)",$propdoc:{car:"[AST_Node] first element in sequence",cdr:"[AST_Node] second element in sequence"},$cons:function(n,e){var t=new jn(n);return t.car=n,t.cdr=e,t},$from_array:function(n){if(0==n.length)return null;if(1==n.length)return n[0].clone();for(var e=null,t=n.length;--t>=0;)e=jn.cons(n[t],e);for(var r=e;r;){if(r.cdr&&!r.cdr.cdr){r.cdr=r.cdr.car;break}r=r.cdr}return e},to_array:function(){for(var n=this,e=[];n;){if(e.push(n.car),n.cdr&&!(n.cdr instanceof jn)){e.push(n.cdr);break}n=n.cdr}return e},add:function(n){for(var e=this;e;){if(!(e.cdr instanceof jn)){var t=jn.cons(e.cdr,n);return e.cdr=t}e=e.cdr}},_walk:function(n){return n._visit(this,function(){this.car._walk(n),this.cdr&&this.cdr._walk(n)})}}),Pn=A("PropAccess","expression property",{$documentation:'Base class for property access expressions, i.e. `a.foo` or `a["foo"]`',$propdoc:{expression:"[AST_Node] the “container” expression",property:"[AST_Node|string] the property to access.  For AST_Dot this is always a plain string, while for AST_Sub it's an arbitrary AST_Node"}}),In=A("Dot",null,{$documentation:"A dotted property access expression",_walk:function(n){return n._visit(this,function(){this.expression._walk(n)})}},Pn),Un=A("Sub",null,{$documentation:'Index-style property access, i.e. `a["foo"]`',_walk:function(n){return n._visit(this,function(){this.expression._walk(n),this.property._walk(n)})}},Pn),Ln=A("Unary","operator expression",{$documentation:"Base class for unary expressions",$propdoc:{operator:"[string] the operator",expression:"[AST_Node] expression that this unary operator applies to"},_walk:function(n){return n._visit(this,function(){this.expression._walk(n)})}}),Vn=A("UnaryPrefix",null,{$documentation:"Unary prefix expression, i.e. `typeof i` or `++i`"},Ln),Wn=A("UnaryPostfix",null,{$documentation:"Unary postfix expression, i.e. `i++`"},Ln),Jn=A("Binary","left operator right",{$documentation:"Binary expression, i.e. `a + b`",$propdoc:{left:"[AST_Node] left-hand side expression",operator:"[string] the operator",right:"[AST_Node] right-hand side expression"},_walk:function(n){return n._visit(this,function(){this.left._walk(n),this.right._walk(n)})}}),Yn=A("Conditional","condition consequent alternative",{$documentation:"Conditional expression using the ternary operator, i.e. `a ? b : c`",$propdoc:{condition:"[AST_Node]",consequent:"[AST_Node]",alternative:"[AST_Node]"},_walk:function(n){return n._visit(this,function(){this.condition._walk(n),this.consequent._walk(n),this.alternative._walk(n)})}}),Xn=A("Assign",null,{$documentation:"An assignment expression — `a = b + 5`"},Jn),Gn=A("Array","elements",{$documentation:"An array literal",$propdoc:{elements:"[AST_Node*] array of elements"},_walk:function(n){return n._visit(this,function(){this.elements.forEach(function(e){e._walk(n)})})}}),Kn=A("Object","properties",{$documentation:"An object literal",$propdoc:{properties:"[AST_ObjectProperty*] array of properties"},_walk:function(n){return n._visit(this,function(){this.properties.forEach(function(e){e._walk(n)})})}}),Zn=A("ObjectProperty","key value",{$documentation:"Base class for literal object properties",$propdoc:{key:"[string] the property name converted to a string for ObjectKeyVal.  For setters and getters this is an arbitrary AST_Node.",value:"[AST_Node] property value.  For setters and getters this is an AST_Function."},_walk:function(n){return n._visit(this,function(){this.value._walk(n)})}}),Qn=A("ObjectKeyVal","quote",{$documentation:"A key: value object property",$propdoc:{quote:"[string] the original quote character"}},Zn),ne=A("ObjectSetter",null,{$documentation:"An object setter property"},Zn),ee=A("ObjectGetter",null,{$documentation:"An object getter property"},Zn),te=A("Symbol","scope name thedef",{$propdoc:{name:"[string] name of this symbol",scope:"[AST_Scope/S] the current scope (not necessarily the definition scope)",thedef:"[SymbolDef/S] the definition of this symbol"},$documentation:"Base class for all symbols"}),re=A("SymbolAccessor",null,{$documentation:"The name of a property accessor (setter/getter function)"},te),oe=A("SymbolDeclaration","init",{$documentation:"A declaration symbol (symbol in var/const, function name or argument, symbol in catch)",$propdoc:{init:"[AST_Node*/S] array of initializers for this declaration."}},te),ie=A("SymbolVar",null,{$documentation:"Symbol defining a variable"},oe),ae=A("SymbolConst",null,{$documentation:"A constant declaration"},oe),ue=A("SymbolFunarg",null,{$documentation:"Symbol naming a function argument"},ie),se=A("SymbolDefun",null,{$documentation:"Symbol defining a function"},oe),ce=A("SymbolLambda",null,{$documentation:"Symbol naming a function expression"},oe),fe=A("SymbolCatch",null,{$documentation:"Symbol naming the exception in catch"},oe),le=A("Label","references",{$documentation:"Symbol naming a label (declaration)",$propdoc:{references:"[AST_LoopControl*] a list of nodes referring to this label"},initialize:function(){this.references=[],this.thedef=this}},te),pe=A("SymbolRef",null,{$documentation:"Reference to some symbol (not definition/declaration)"},te),de=A("LabelRef",null,{$documentation:"Reference to a label symbol"},te),he=A("This",null,{$documentation:"The `this` symbol"},te),me=A("Constant",null,{$documentation:"Base class for all constants",getValue:function(){return this.value}}),_e=A("String","value quote",{$documentation:"A string literal",$propdoc:{value:"[string] the contents of this string",quote:"[string] the original quote character"}},me),ve=A("Number","value",{$documentation:"A number literal",$propdoc:{value:"[number] the numeric value"}},me),ge=A("RegExp","value",{$documentation:"A regexp literal",$propdoc:{value:"[RegExp] the actual regexp"}},me),be=A("Atom",null,{$documentation:"Base class for atoms"},me),ye=A("Null",null,{$documentation:"The `null` atom",value:null},be),Ae=A("NaN",null,{$documentation:"The impossible value",value:NaN},be),we=A("Undefined",null,{$documentation:"The `undefined` value",value:void 0},be),Ee=A("Hole",null,{$documentation:"A hole in an array",value:void 0},be),De=A("Infinity",null,{$documentation:"The `Infinity` value",value:1/0},be),Fe=A("Boolean",null,{$documentation:"Base class for booleans"},be),Se=A("False",null,{$documentation:"The `false` atom",value:!1},Fe),Ce=A("True",null,{$documentation:"The `true` atom",value:!0},Fe);E.prototype={_visit:function(n,e){this.stack.push(n);var t=this.visit(n,e?function(){e.call(n)}:l);return!t&&e&&e.call(n),this.stack.pop(),t},parent:function(n){return this.stack[this.stack.length-2-(n||0)]},push:function(n){this.stack.push(n)},pop:function(){return this.stack.pop()},self:function(){return this.stack[this.stack.length-1]},find_parent:function(n){for(var e=this.stack,t=e.length;--t>=0;){var r=e[t];if(r instanceof n)return r}},has_directive:function(n){return this.find_parent(dn).has_directive(n)},in_boolean_context:function(){for(var n=this.stack,e=n.length,t=n[--e];e>0;){var r=n[--e];if(r instanceof Sn&&r.condition===t||r instanceof Yn&&r.condition===t||r instanceof un&&r.condition===t||r instanceof fn&&r.condition===t||r instanceof Vn&&"!"==r.operator&&r.expression===t)return!0;if(!(r instanceof Jn)||"&&"!=r.operator&&"||"!=r.operator)return!1;t=r}},loopcontrol_target:function(n){var e=this.stack;if(n)for(var t=e.length;--t>=0;){var r=e[t];if(r instanceof on&&r.label.name==n.name)return r.body}else for(var t=e.length;--t>=0;){var r=e[t];if(r instanceof Cn||r instanceof an)return r}}};var ke="break case catch const continue debugger default delete do else finally for function if in instanceof new return switch throw try typeof var void while with",Be="false null true",xe="abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized this throws transient volatile yield "+Be+" "+ke,Te="return new delete throw else case";ke=g(ke),xe=g(xe),Te=g(Te),Be=g(Be);var Oe=g(o("+-*&%=<>!?|~^")),$e=/^0x[0-9a-f]+$/i,Me=/^0[0-7]+$/,qe=/^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i,Ne=g(["in","instanceof","typeof","new","void","delete","++","--","+","-","!","~","&","|","^","*","/","%",">>","<<",">>>","<",">","<=",">=","==","===","!=","!==","?","=","+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&=","&&","||"]),ze=g(o("  \n\r  \f​᠎             　\ufeff")),Re=g(o("[{(,.;:")),He=g(o("[]{}(),;:")),je=g(o("gmsiy")),Pe={letter:new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),digit:new RegExp("[\\u0030-\\u0039\\u0660-\\u0669\\u06F0-\\u06F9\\u07C0-\\u07C9\\u0966-\\u096F\\u09E6-\\u09EF\\u0A66-\\u0A6F\\u0AE6-\\u0AEF\\u0B66-\\u0B6F\\u0BE6-\\u0BEF\\u0C66-\\u0C6F\\u0CE6-\\u0CEF\\u0D66-\\u0D6F\\u0DE6-\\u0DEF\\u0E50-\\u0E59\\u0ED0-\\u0ED9\\u0F20-\\u0F29\\u1040-\\u1049\\u1090-\\u1099\\u17E0-\\u17E9\\u1810-\\u1819\\u1946-\\u194F\\u19D0-\\u19D9\\u1A80-\\u1A89\\u1A90-\\u1A99\\u1B50-\\u1B59\\u1BB0-\\u1BB9\\u1C40-\\u1C49\\u1C50-\\u1C59\\uA620-\\uA629\\uA8D0-\\uA8D9\\uA900-\\uA909\\uA9D0-\\uA9D9\\uA9F0-\\uA9F9\\uAA50-\\uAA59\\uABF0-\\uABF9\\uFF10-\\uFF19]"),non_spacing_mark:new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),space_combining_mark:new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),connector_punctuation:new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")};q.prototype.toString=function(){return this.message+" (line: "+this.line+", col: "+this.col+", pos: "+this.pos+")\n\n"+this.stack};var Ie={},Ue=g(["typeof","void","delete","--","++","!","~","-","+"]),Le=g(["--","++"]),Ve=g(["=","+=","-=","/=","*=","%=",">>=","<<=",">>>=","|=","^=","&="]),We=function(n,e){for(var t=0;t<n.length;++t)for(var r=n[t],o=0;o<r.length;++o)e[r[o]]=t+1;return e}([["||"],["&&"],["|"],["^"],["&"],["==","===","!=","!=="],["<",">","<=",">=","in","instanceof"],[">>","<<",">>>"],["+","-"],["*","/","%"]],{}),Je=t(["for","do","while","switch"]),Ye=t(["atom","num","string","regexp","name"]);j.prototype=new E,function(n){function e(e,t){e.DEFMETHOD("transform",function(e,r){var o,i;return e.push(this),e.before&&(o=e.before(this,t,r)),o===n&&(e.after?(e.stack[e.stack.length-1]=o=this.clone(),t(o,e),i=e.after(o,r),i!==n&&(o=i)):(o=this,t(o,e))),e.pop(),o})}function t(n,e){return J(n,function(n){return n.transform(e,!0)})}e(X,l),e(on,function(n,e){n.label=n.label.transform(e),n.body=n.body.transform(e)}),e(Q,function(n,e){n.body=n.body.transform(e)}),e(nn,function(n,e){n.body=t(n.body,e)}),e(un,function(n,e){n.condition=n.condition.transform(e),n.body=n.body.transform(e)}),e(fn,function(n,e){n.init&&(n.init=n.init.transform(e)),n.condition&&(n.condition=n.condition.transform(e)),n.step&&(n.step=n.step.transform(e)),n.body=n.body.transform(e)}),e(ln,function(n,e){n.init=n.init.transform(e),n.object=n.object.transform(e),n.body=n.body.transform(e)}),e(pn,function(n,e){n.expression=n.expression.transform(e),n.body=n.body.transform(e)}),e(yn,function(n,e){n.value&&(n.value=n.value.transform(e))}),e(En,function(n,e){n.label&&(n.label=n.label.transform(e))}),e(Sn,function(n,e){n.condition=n.condition.transform(e),n.body=n.body.transform(e),n.alternative&&(n.alternative=n.alternative.transform(e))}),e(Cn,function(n,e){n.expression=n.expression.transform(e),n.body=t(n.body,e)}),e(xn,function(n,e){n.expression=n.expression.transform(e),n.body=t(n.body,e)}),e(Tn,function(n,e){n.body=t(n.body,e),n.bcatch&&(n.bcatch=n.bcatch.transform(e)),n.bfinally&&(n.bfinally=n.bfinally.transform(e))}),e(On,function(n,e){n.argname=n.argname.transform(e),n.body=t(n.body,e)}),e(Mn,function(n,e){n.definitions=t(n.definitions,e)}),e(zn,function(n,e){n.name=n.name.transform(e),n.value&&(n.value=n.value.transform(e))}),e(mn,function(n,e){n.name&&(n.name=n.name.transform(e)),n.argnames=t(n.argnames,e),n.body=t(n.body,e)}),e(Rn,function(n,e){n.expression=n.expression.transform(e),n.args=t(n.args,e)}),e(jn,function(n,e){n.car=n.car.transform(e),n.cdr=n.cdr.transform(e)}),e(In,function(n,e){n.expression=n.expression.transform(e)}),e(Un,function(n,e){n.expression=n.expression.transform(e),n.property=n.property.transform(e)}),e(Ln,function(n,e){n.expression=n.expression.transform(e)}),e(Jn,function(n,e){n.left=n.left.transform(e),n.right=n.right.transform(e)}),e(Yn,function(n,e){n.condition=n.condition.transform(e),n.consequent=n.consequent.transform(e),n.alternative=n.alternative.transform(e)}),e(Gn,function(n,e){n.elements=t(n.elements,e)}),e(Kn,function(n,e){n.properties=t(n.properties,e)}),e(Zn,function(n,e){n.value=n.value.transform(e)})}(),P.prototype={unmangleable:function(n){return n||(n={}),this.global&&!n.toplevel||this.undeclared||!n.eval&&(this.scope.uses_eval||this.scope.uses_with)||n.keep_fnames&&(this.orig[0]instanceof ce||this.orig[0]instanceof se)},mangle:function(n){var e=n.cache&&n.cache.props;if(this.global&&e&&e.has(this.name))this.mangled_name=e.get(this.name);else if(!this.mangled_name&&!this.unmangleable(n)){var t=this.scope;!n.screw_ie8&&this.orig[0]instanceof ce&&(t=t.parent_scope),this.mangled_name=t.next_mangled(n,this),this.global&&e&&e.set(this.name,this.mangled_name)}}},hn.DEFMETHOD("figure_out_scope",function(n){n=c(n,{screw_ie8:!1,cache:null});var e=this,t=e.parent_scope=null,r=null,o=0,i=new E(function(e,a){if(n.screw_ie8&&e instanceof On){var u=t;return t=new dn(e),t.init_scope_vars(o),t.parent_scope=u,a(),t=u,!0}if(e instanceof dn){e.init_scope_vars(o);var u=e.parent_scope=t,s=r;return r=t=e,++o,a(),--o,t=u,r=s,!0}if(e instanceof Z)return e.scope=t,p(t.directives,e.value),!0;if(e instanceof pn)for(var c=t;c;c=c.parent_scope)c.uses_with=!0;else if(e instanceof te&&(e.scope=t),e instanceof ce)r.def_function(e);else if(e instanceof se)(e.scope=r.parent_scope).def_function(e);else if(e instanceof ie||e instanceof ae){var f=r.def_variable(e);f.constant=e instanceof ae,f.init=i.parent().value}else e instanceof fe&&(n.screw_ie8?t:r).def_variable(e)});e.walk(i);var a=null,u=e.globals=new y,i=new E(function(n,t){if(n instanceof mn){var r=a;return a=n,t(),a=r,!0}if(n instanceof pe){var o=n.name,s=n.scope.find_variable(o);if(s)n.thedef=s;else{var c;if(u.has(o)?c=u.get(o):(c=new P(e,u.size(),n),c.undeclared=!0,c.global=!0,u.set(o,c)),n.thedef=c,"eval"==o&&i.parent()instanceof Rn)for(var f=n.scope;f&&!f.uses_eval;f=f.parent_scope)f.uses_eval=!0;a&&"arguments"==o&&(a.uses_arguments=!0)}return n.reference(),!0}});e.walk(i),n.cache&&(this.cname=n.cache.cname)}),dn.DEFMETHOD("init_scope_vars",function(n){this.directives=[],this.variables=new y,this.functions=new y,this.uses_with=!1,this.uses_eval=!1,this.parent_scope=null,this.enclosed=[],this.cname=-1,this.nesting=n}),dn.DEFMETHOD("strict",function(){return this.has_directive("use strict")}),mn.DEFMETHOD("init_scope_vars",function(){dn.prototype.init_scope_vars.apply(this,arguments),this.uses_arguments=!1}),pe.DEFMETHOD("reference",function(){var n=this.definition();n.references.push(this);for(var e=this.scope;e&&(p(e.enclosed,n),e!==n.scope);)e=e.parent_scope;this.frame=this.scope.nesting-n.scope.nesting}),dn.DEFMETHOD("find_variable",function(n){return n instanceof te&&(n=n.name),this.variables.get(n)||this.parent_scope&&this.parent_scope.find_variable(n)}),dn.DEFMETHOD("has_directive",function(n){return this.parent_scope&&this.parent_scope.has_directive(n)||(this.directives.indexOf(n)>=0?this:null)}),dn.DEFMETHOD("def_function",function(n){this.functions.set(n.name,this.def_variable(n))}),dn.DEFMETHOD("def_variable",function(n){var e;return this.variables.has(n.name)?(e=this.variables.get(n.name),e.orig.push(n)):(e=new P(this,this.variables.size(),n),this.variables.set(n.name,e),e.global=!this.parent_scope),n.thedef=e}),dn.DEFMETHOD("next_mangled",function(n){var e=this.enclosed;n:for(;;){var t=Xe(++this.cname);if(x(t)&&!(n.except.indexOf(t)>=0)){for(var r=e.length;--r>=0;){var o=e[r],i=o.mangled_name||o.unmangleable(n)&&o.name;if(t==i)continue n}return t}}}),vn.DEFMETHOD("next_mangled",function(n,e){for(var t=e.orig[0]instanceof ue&&this.name&&this.name.definition();;){var r=mn.prototype.next_mangled.call(this,n,e);if(!t||t.mangled_name!=r)return r}}),dn.DEFMETHOD("references",function(n){return n instanceof te&&(n=n.definition()),this.enclosed.indexOf(n)<0?null:n}),te.DEFMETHOD("unmangleable",function(n){return this.definition().unmangleable(n)}),re.DEFMETHOD("unmangleable",function(){return!0}),le.DEFMETHOD("unmangleable",function(){return!1}),te.DEFMETHOD("unreferenced",function(){return 0==this.definition().references.length&&!(this.scope.uses_eval||this.scope.uses_with)}),te.DEFMETHOD("undeclared",function(){return this.definition().undeclared}),de.DEFMETHOD("undeclared",function(){return!1}),le.DEFMETHOD("undeclared",function(){return!1}),te.DEFMETHOD("definition",function(){return this.thedef}),te.DEFMETHOD("global",function(){return this.definition().global}),hn.DEFMETHOD("_default_mangler_options",function(n){return c(n,{except:[],eval:!1,sort:!1,toplevel:!1,screw_ie8:!1,keep_fnames:!1})}),hn.DEFMETHOD("mangle_names",function(n){n=this._default_mangler_options(n);var e=-1,t=[];n.cache&&this.globals.each(function(e){n.except.indexOf(e.name)<0&&t.push(e)});var r=new E(function(o,i){if(o instanceof on){var a=e;return i(),e=a,!0}if(o instanceof dn){var u=(r.parent(),[]);return o.variables.each(function(e){n.except.indexOf(e.name)<0&&u.push(e)}),n.sort&&u.sort(function(n,e){return e.references.length-n.references.length}),void t.push.apply(t,u)}if(o instanceof le){var s;do s=Xe(++e);while(!x(s));return o.mangled_name=s,!0}return n.screw_ie8&&o instanceof fe?void t.push(o.definition()):void 0});this.walk(r),t.forEach(function(e){e.mangle(n)}),n.cache&&(n.cache.cname=this.cname)}),hn.DEFMETHOD("compute_char_frequency",function(n){n=this._default_mangler_options(n);var e=new E(function(e){e instanceof me?Xe.consider(e.print_to_string()):e instanceof An?Xe.consider("return"):e instanceof wn?Xe.consider("throw"):e instanceof Fn?Xe.consider("continue"):e instanceof Dn?Xe.consider("break"):e instanceof K?Xe.consider("debugger"):e instanceof Z?Xe.consider(e.value):e instanceof cn?Xe.consider("while"):e instanceof sn?Xe.consider("do while"):e instanceof Sn?(Xe.consider("if"),e.alternative&&Xe.consider("else")):e instanceof qn?Xe.consider("var"):e instanceof Nn?Xe.consider("const"):e instanceof mn?Xe.consider("function"):e instanceof fn?Xe.consider("for"):e instanceof ln?Xe.consider("for in"):e instanceof Cn?Xe.consider("switch"):e instanceof xn?Xe.consider("case"):e instanceof Bn?Xe.consider("default"):e instanceof pn?Xe.consider("with"):e instanceof ne?Xe.consider("set"+e.key):e instanceof ee?Xe.consider("get"+e.key):e instanceof Qn?Xe.consider(e.key):e instanceof Hn?Xe.consider("new"):e instanceof he?Xe.consider("this"):e instanceof Tn?Xe.consider("try"):e instanceof On?Xe.consider("catch"):e instanceof $n?Xe.consider("finally"):e instanceof te&&e.unmangleable(n)?Xe.consider(e.name):e instanceof Ln||e instanceof Jn?Xe.consider(e.operator):e instanceof In&&Xe.consider(e.property);
});this.walk(e),Xe.sort()});var Xe=function(){function n(){r=Object.create(null),t=o.split("").map(function(n){return n.charCodeAt(0)}),t.forEach(function(n){r[n]=0})}function e(n){var e="",r=54;n++;do n--,e+=String.fromCharCode(t[n%r]),n=Math.floor(n/r),r=64;while(n>0);return e}var t,r,o="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";return e.consider=function(n){for(var e=n.length;--e>=0;){var t=n.charCodeAt(e);t in r&&++r[t]}},e.sort=function(){t=m(t,function(n,e){return F(n)&&!F(e)?1:F(e)&&!F(n)?-1:r[e]-r[n]})},e.reset=n,n(),e.get=function(){return t},e.freq=function(){return r},e}();hn.DEFMETHOD("scope_warnings",function(n){n=c(n,{undeclared:!1,unreferenced:!0,assign_to_global:!0,func_arguments:!0,nested_defuns:!0,eval:!0});var e=new E(function(t){if(n.undeclared&&t instanceof pe&&t.undeclared()&&X.warn("Undeclared symbol: {name} [{file}:{line},{col}]",{name:t.name,file:t.start.file,line:t.start.line,col:t.start.col}),n.assign_to_global){var r=null;t instanceof Xn&&t.left instanceof pe?r=t.left:t instanceof ln&&t.init instanceof pe&&(r=t.init),r&&(r.undeclared()||r.global()&&r.scope!==r.definition().scope)&&X.warn("{msg}: {name} [{file}:{line},{col}]",{msg:r.undeclared()?"Accidental global?":"Assignment to global",name:r.name,file:r.start.file,line:r.start.line,col:r.start.col})}n.eval&&t instanceof pe&&t.undeclared()&&"eval"==t.name&&X.warn("Eval is used [{file}:{line},{col}]",t.start),n.unreferenced&&(t instanceof oe||t instanceof le)&&!(t instanceof fe)&&t.unreferenced()&&X.warn("{type} {name} is declared but not referenced [{file}:{line},{col}]",{type:t instanceof le?"Label":"Symbol",name:t.name,file:t.start.file,line:t.start.line,col:t.start.col}),n.func_arguments&&t instanceof mn&&t.uses_arguments&&X.warn("arguments used in function {name} [{file}:{line},{col}]",{name:t.name?t.name.name:"anonymous",file:t.start.file,line:t.start.line,col:t.start.col}),n.nested_defuns&&t instanceof gn&&!(e.parent()instanceof dn)&&X.warn('Function {name} declared in nested statement "{type}" [{file}:{line},{col}]',{name:t.name.name,type:e.parent().TYPE,file:t.start.file,line:t.start.line,col:t.start.col})});this.walk(e)}),function(){function n(n,e){n.DEFMETHOD("_codegen",e)}function e(n,t){Array.isArray(n)?n.forEach(function(n){e(n,t)}):n.DEFMETHOD("needs_parens",t)}function t(n,e,t){var r=n.length-1;n.forEach(function(n,o){n instanceof tn||(t.indent(),n.print(t),o==r&&e||(t.newline(),e&&t.newline()))})}function r(n,e){n.length>0?e.with_block(function(){t(n,!1,e)}):e.print("{}")}function o(n,e){if(e.option("bracketize"))return void d(n.body,e);if(!n.body)return e.force_semicolon();if(n.body instanceof sn&&!e.option("screw_ie8"))return void d(n.body,e);for(var t=n.body;;)if(t instanceof Sn){if(!t.alternative)return void d(n.body,e);t=t.alternative}else{if(!(t instanceof rn))break;t=t.body}u(n.body,e)}function i(n,e,t){if(t)try{n.walk(new E(function(n){if(n instanceof Jn&&"in"==n.operator)throw e})),n.print(e)}catch(r){if(r!==e)throw r;n.print(e,!0)}else n.print(e)}function a(n){return[92,47,46,43,42,63,40,41,91,93,123,125,36,94,58,124,33,10,13,0,65279,8232,8233].indexOf(n)<0}function u(n,e){e.option("bracketize")?!n||n instanceof tn?e.print("{}"):n instanceof en?n.print(e):e.with_block(function(){e.indent(),n.print(e),e.newline()}):!n||n instanceof tn?e.force_semicolon():n.print(e)}function s(n){for(var e=n.stack(),t=e.length,r=e[--t],o=e[--t];t>0;){if(o instanceof G&&o.body===r)return!0;if(!(o instanceof jn&&o.car===r||o instanceof Rn&&o.expression===r&&!(o instanceof Hn)||o instanceof In&&o.expression===r||o instanceof Un&&o.expression===r||o instanceof Yn&&o.condition===r||o instanceof Jn&&o.left===r||o instanceof Wn&&o.expression===r))return!1;r=o,o=e[--t]}}function c(n,e){return 0==n.args.length&&!e.option("beautify")}function f(n){for(var e=n[0],t=e.length,r=1;r<n.length;++r)n[r].length<t&&(e=n[r],t=e.length);return e}function p(n){var e,t=n.toString(10),r=[t.replace(/^0\./,".").replace("e+","e")];return Math.floor(n)===n?(n>=0?r.push("0x"+n.toString(16).toLowerCase(),"0"+n.toString(8)):r.push("-0x"+(-n).toString(16).toLowerCase(),"-0"+(-n).toString(8)),(e=/^(.*?)(0+)$/.exec(n))&&r.push(e[1]+"e"+e[2].length)):(e=/^0?\.(0+)(.*)$/.exec(n))&&r.push(e[2]+"e-"+(e[1].length+e[2].length),t.substr(t.indexOf("."))),f(r)}function d(n,e){return n instanceof en?void n.print(e):void e.with_block(function(){e.indent(),n.print(e),e.newline()})}function h(n,e){n.DEFMETHOD("add_source_map",function(n){e(this,n)})}function m(n,e){e.add_mapping(n.start)}X.DEFMETHOD("print",function(n,e){function t(){r.add_comments(n),r.add_source_map(n),o(r,n)}var r=this,o=r._codegen;n.push_node(r),e||r.needs_parens(n)?n.with_parens(t):t(),n.pop_node()}),X.DEFMETHOD("print_to_string",function(n){var e=I(n);return this.print(e),e.get()}),X.DEFMETHOD("add_comments",function(n){var e=n.option("comments"),t=this;if(e){var r=t.start;if(r&&!r._comments_dumped){r._comments_dumped=!0;var o=r.comments_before||[];t instanceof yn&&t.value&&t.value.walk(new E(function(n){return n.start&&n.start.comments_before&&(o=o.concat(n.start.comments_before),n.start.comments_before=[]),n instanceof vn||n instanceof Gn||n instanceof Kn?!0:void 0})),e.test?o=o.filter(function(n){return e.test(n.value)}):"function"==typeof e&&(o=o.filter(function(n){return e(t,n)})),!n.option("beautify")&&o.length>0&&/comment[134]/.test(o[0].type)&&0!==n.col()&&o[0].nlb&&n.print("\n"),o.forEach(function(e){/comment[134]/.test(e.type)?(n.print("//"+e.value+"\n"),n.indent()):"comment2"==e.type&&(n.print("/*"+e.value+"*/"),r.nlb?(n.print("\n"),n.indent()):n.space())})}}}),e(X,function(){return!1}),e(vn,function(n){return s(n)}),e(Kn,function(n){return s(n)}),e([Ln,we],function(n){var e=n.parent();return e instanceof Pn&&e.expression===this}),e(jn,function(n){var e=n.parent();return e instanceof Rn||e instanceof Ln||e instanceof Jn||e instanceof zn||e instanceof Pn||e instanceof Gn||e instanceof Zn||e instanceof Yn}),e(Jn,function(n){var e=n.parent();if(e instanceof Rn&&e.expression===this)return!0;if(e instanceof Ln)return!0;if(e instanceof Pn&&e.expression===this)return!0;if(e instanceof Jn){var t=e.operator,r=We[t],o=this.operator,i=We[o];if(r>i||r==i&&this===e.right)return!0}}),e(Pn,function(n){var e=n.parent();if(e instanceof Hn&&e.expression===this)try{this.walk(new E(function(n){if(n instanceof Rn)throw e}))}catch(t){if(t!==e)throw t;return!0}}),e(Rn,function(n){var e,t=n.parent();return t instanceof Hn&&t.expression===this?!0:this.expression instanceof vn&&t instanceof Pn&&t.expression===this&&(e=n.parent(1))instanceof Xn&&e.left===t}),e(Hn,function(n){var e=n.parent();return c(this,n)&&(e instanceof Pn||e instanceof Rn&&e.expression===this)?!0:void 0}),e(ve,function(n){var e=n.parent();return this.getValue()<0&&e instanceof Pn&&e.expression===this?!0:void 0}),e([Xn,Yn],function(n){var e=n.parent();return e instanceof Ln?!0:e instanceof Jn&&!(e instanceof Xn)?!0:e instanceof Rn&&e.expression===this?!0:e instanceof Yn&&e.condition===this?!0:e instanceof Pn&&e.expression===this?!0:void 0}),n(Z,function(n,e){e.print_string(n.value,n.quote),e.semicolon()}),n(K,function(n,e){e.print("debugger"),e.semicolon()}),rn.DEFMETHOD("_do_print_body",function(n){u(this.body,n)}),n(G,function(n,e){n.body.print(e),e.semicolon()}),n(hn,function(n,e){t(n.body,!0,e),e.print("")}),n(on,function(n,e){n.label.print(e),e.colon(),n.body.print(e)}),n(Q,function(n,e){n.body.print(e),e.semicolon()}),n(en,function(n,e){r(n.body,e)}),n(tn,function(n,e){e.semicolon()}),n(sn,function(n,e){e.print("do"),e.space(),n._do_print_body(e),e.space(),e.print("while"),e.space(),e.with_parens(function(){n.condition.print(e)}),e.semicolon()}),n(cn,function(n,e){e.print("while"),e.space(),e.with_parens(function(){n.condition.print(e)}),e.space(),n._do_print_body(e)}),n(fn,function(n,e){e.print("for"),e.space(),e.with_parens(function(){!n.init||n.init instanceof tn?e.print(";"):(n.init instanceof Mn?n.init.print(e):i(n.init,e,!0),e.print(";"),e.space()),n.condition?(n.condition.print(e),e.print(";"),e.space()):e.print(";"),n.step&&n.step.print(e)}),e.space(),n._do_print_body(e)}),n(ln,function(n,e){e.print("for"),e.space(),e.with_parens(function(){n.init.print(e),e.space(),e.print("in"),e.space(),n.object.print(e)}),e.space(),n._do_print_body(e)}),n(pn,function(n,e){e.print("with"),e.space(),e.with_parens(function(){n.expression.print(e)}),e.space(),n._do_print_body(e)}),mn.DEFMETHOD("_do_print",function(n,e){var t=this;e||n.print("function"),t.name&&(n.space(),t.name.print(n)),n.with_parens(function(){t.argnames.forEach(function(e,t){t&&n.comma(),e.print(n)})}),n.space(),r(t.body,n)}),n(mn,function(n,e){n._do_print(e)}),yn.DEFMETHOD("_do_print",function(n,e){n.print(e),this.value&&(n.space(),this.value.print(n)),n.semicolon()}),n(An,function(n,e){n._do_print(e,"return")}),n(wn,function(n,e){n._do_print(e,"throw")}),En.DEFMETHOD("_do_print",function(n,e){n.print(e),this.label&&(n.space(),this.label.print(n)),n.semicolon()}),n(Dn,function(n,e){n._do_print(e,"break")}),n(Fn,function(n,e){n._do_print(e,"continue")}),n(Sn,function(n,e){e.print("if"),e.space(),e.with_parens(function(){n.condition.print(e)}),e.space(),n.alternative?(o(n,e),e.space(),e.print("else"),e.space(),u(n.alternative,e)):n._do_print_body(e)}),n(Cn,function(n,e){e.print("switch"),e.space(),e.with_parens(function(){n.expression.print(e)}),e.space(),n.body.length>0?e.with_block(function(){n.body.forEach(function(n,t){t&&e.newline(),e.indent(!0),n.print(e)})}):e.print("{}")}),kn.DEFMETHOD("_do_print_body",function(n){this.body.length>0&&(n.newline(),this.body.forEach(function(e){n.indent(),e.print(n),n.newline()}))}),n(Bn,function(n,e){e.print("default:"),n._do_print_body(e)}),n(xn,function(n,e){e.print("case"),e.space(),n.expression.print(e),e.print(":"),n._do_print_body(e)}),n(Tn,function(n,e){e.print("try"),e.space(),r(n.body,e),n.bcatch&&(e.space(),n.bcatch.print(e)),n.bfinally&&(e.space(),n.bfinally.print(e))}),n(On,function(n,e){e.print("catch"),e.space(),e.with_parens(function(){n.argname.print(e)}),e.space(),r(n.body,e)}),n($n,function(n,e){e.print("finally"),e.space(),r(n.body,e)}),Mn.DEFMETHOD("_do_print",function(n,e){n.print(e),n.space(),this.definitions.forEach(function(e,t){t&&n.comma(),e.print(n)});var t=n.parent(),r=t instanceof fn||t instanceof ln,o=r&&t.init===this;o||n.semicolon()}),n(qn,function(n,e){n._do_print(e,"var")}),n(Nn,function(n,e){n._do_print(e,"const")}),n(zn,function(n,e){if(n.name.print(e),n.value){e.space(),e.print("="),e.space();var t=e.parent(1),r=t instanceof fn||t instanceof ln;i(n.value,e,r)}}),n(Rn,function(n,e){n.expression.print(e),n instanceof Hn&&c(n,e)||e.with_parens(function(){n.args.forEach(function(n,t){t&&e.comma(),n.print(e)})})}),n(Hn,function(n,e){e.print("new"),e.space(),Rn.prototype._codegen(n,e)}),jn.DEFMETHOD("_do_print",function(n){this.car.print(n),this.cdr&&(n.comma(),n.should_break()&&(n.newline(),n.indent()),this.cdr.print(n))}),n(jn,function(n,e){n._do_print(e)}),n(In,function(n,e){var t=n.expression;t.print(e),t instanceof ve&&t.getValue()>=0&&(/[xa-f.]/i.test(e.last())||e.print(".")),e.print("."),e.add_mapping(n.end),e.print_name(n.property)}),n(Un,function(n,e){n.expression.print(e),e.print("["),n.property.print(e),e.print("]")}),n(Vn,function(n,e){var t=n.operator;e.print(t),(/^[a-z]/i.test(t)||/[+-]$/.test(t)&&n.expression instanceof Vn&&/^[+-]/.test(n.expression.operator))&&e.space(),n.expression.print(e)}),n(Wn,function(n,e){n.expression.print(e),e.print(n.operator)}),n(Jn,function(n,e){n.left.print(e),e.space(),e.print(n.operator),"<"==n.operator&&n.right instanceof Vn&&"!"==n.right.operator&&n.right.expression instanceof Vn&&"--"==n.right.expression.operator?e.print(" "):e.space(),n.right.print(e)}),n(Yn,function(n,e){n.condition.print(e),e.space(),e.print("?"),e.space(),n.consequent.print(e),e.space(),e.colon(),n.alternative.print(e)}),n(Gn,function(n,e){e.with_square(function(){var t=n.elements,r=t.length;r>0&&e.space(),t.forEach(function(n,t){t&&e.comma(),n.print(e),t===r-1&&n instanceof Ee&&e.comma()}),r>0&&e.space()})}),n(Kn,function(n,e){n.properties.length>0?e.with_block(function(){n.properties.forEach(function(n,t){t&&(e.print(","),e.newline()),e.indent(),n.print(e)}),e.newline()}):e.print("{}")}),n(Qn,function(n,e){var t=n.key,r=n.quote;e.option("quote_keys")?e.print_string(t+""):("number"==typeof t||!e.option("beautify")&&+t+""==t)&&parseFloat(t)>=0?e.print(p(t)):(xe(t)?e.option("screw_ie8"):$(t))?e.print_name(t):e.print_string(t,r),e.colon(),n.value.print(e)}),n(ne,function(n,e){e.print("set"),e.space(),n.key.print(e),n.value._do_print(e,!0)}),n(ee,function(n,e){e.print("get"),e.space(),n.key.print(e),n.value._do_print(e,!0)}),n(te,function(n,e){var t=n.definition();e.print_name(t?t.mangled_name||t.name:n.name)}),n(we,function(n,e){e.print("void 0")}),n(Ee,l),n(De,function(n,e){e.print("Infinity")}),n(Ae,function(n,e){e.print("NaN")}),n(he,function(n,e){e.print("this")}),n(me,function(n,e){e.print(n.getValue())}),n(_e,function(n,e){e.print_string(n.getValue(),n.quote)}),n(ve,function(n,e){e.print(p(n.getValue()))}),n(ge,function(n,e){var t=n.getValue().toString();e.option("ascii_only")?t=e.to_ascii(t):e.option("unescape_regexps")&&(t=t.split("\\\\").map(function(n){return n.replace(/\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}/g,function(n){var e=parseInt(n.substr(2),16);return a(e)?String.fromCharCode(e):n})}).join("\\\\")),e.print(t);var r=e.parent();r instanceof Jn&&/^in/.test(r.operator)&&r.left===n&&e.print(" ")}),h(X,l),h(Z,m),h(K,m),h(te,m),h(bn,m),h(rn,m),h(on,l),h(mn,m),h(Cn,m),h(kn,m),h(en,m),h(hn,l),h(Hn,m),h(Tn,m),h(On,m),h($n,m),h(Mn,m),h(me,m),h(Zn,function(n,e){e.add_mapping(n.start,n.key)})}(),U.prototype=new j,f(U.prototype,{option:function(n){return this.options[n]},warn:function(){this.options.warnings&&X.warn.apply(X,arguments)},before:function(n,e,t){if(n._squeezed)return n;var r=!1;return n instanceof dn&&(n=n.hoist_declarations(this),r=!0),e(n,this),n=n.optimize(this),r&&n instanceof dn&&(n.drop_unused(this),e(n,this)),n._squeezed=!0,n}}),function(){function n(n,e){n.DEFMETHOD("optimize",function(n){var t=this;if(t._optimized)return t;var r=e(t,n);return r._optimized=!0,r===t?r:r.transform(n)})}function e(n,e,t){return t||(t={}),e&&(t.start||(t.start=e.start),t.end||(t.end=e.end)),new n(t)}function t(n,t,r){if(t instanceof X)return t.transform(n);switch(typeof t){case"string":return e(_e,r,{value:t}).optimize(n);case"number":return e(isNaN(t)?Ae:ve,r,{value:t}).optimize(n);case"boolean":return e(t?Ce:Se,r).optimize(n);case"undefined":return e(we,r).optimize(n);default:if(null===t)return e(ye,r,{value:null}).optimize(n);if(t instanceof RegExp)return e(ge,r,{value:t}).optimize(n);throw new Error(d("Can't handle constant of type: {type}",{type:typeof t}))}}function r(n){if(null===n)return[];if(n instanceof en)return n.body;if(n instanceof tn)return[];if(n instanceof G)return[n];throw new Error("Can't convert thing to statement array")}function o(n){return null===n?!0:n instanceof tn?!0:n instanceof en?0==n.body.length:!1}function u(n){return n instanceof Cn?n:(n instanceof fn||n instanceof ln||n instanceof un)&&n.body instanceof en?n.body:n}function s(n,t){function o(n){function r(n){return/@ngInject/.test(n.value)}function o(n){return n.argnames.map(function(n){return e(_e,n,{value:n.name})})}function i(n,t){return e(Gn,n,{elements:t})}function a(n,t){return e(Q,n,{body:e(Xn,n,{operator:"=",left:e(In,t,{expression:e(pe,t,t),property:"$inject"}),right:i(n,o(n))})})}function u(n){n&&n.args&&(n.args.forEach(function(n,e,t){var a=n.start.comments_before;n instanceof mn&&a.length&&r(a[0])&&(t[e]=i(n,o(n).concat(n)))}),n.expression&&n.expression.expression&&u(n.expression.expression))}return n.reduce(function(n,e){if(n.push(e),e.body&&e.body.args)u(e.body);else{var o=e.start,i=o.comments_before;if(i&&i.length>0){var s=i.pop();r(s)&&(e instanceof gn?n.push(a(e,e.name)):e instanceof Mn?e.definitions.forEach(function(e){e.value&&e.value instanceof mn&&n.push(a(e.value,e.name))}):t.warn("Unknown statement marked with @ngInject [{file}:{line},{col}]",o))}}return n},[])}function i(n){var e=[];return n.reduce(function(n,t){return t instanceof en?(m=!0,n.push.apply(n,i(t.body))):t instanceof tn?m=!0:t instanceof Z?e.indexOf(t.value)<0?(n.push(t),e.push(t.value)):m=!0:n.push(t),n},[])}function a(n,t){var o=t.self(),i=o instanceof mn,a=[];n:for(var s=n.length;--s>=0;){var c=n[s];switch(!0){case i&&c instanceof An&&!c.value&&0==a.length:m=!0;continue n;case c instanceof Sn:if(c.body instanceof An){if((i&&0==a.length||a[0]instanceof An&&!a[0].value)&&!c.body.value&&!c.alternative){m=!0;var f=e(Q,c.condition,{body:c.condition});a.unshift(f);continue n}if(a[0]instanceof An&&c.body.value&&a[0].value&&!c.alternative){m=!0,c=c.clone(),c.alternative=a[0],a[0]=c.transform(t);continue n}if((0==a.length||a[0]instanceof An)&&c.body.value&&!c.alternative&&i){m=!0,c=c.clone(),c.alternative=a[0]||e(An,c,{value:e(we,c)}),a[0]=c.transform(t);continue n}if(!c.body.value&&i){m=!0,c=c.clone(),c.condition=c.condition.negate(t),c.body=e(en,c,{body:r(c.alternative).concat(a)}),c.alternative=null,a=[c.transform(t)];continue n}if(1==a.length&&i&&a[0]instanceof Q&&(!c.alternative||c.alternative instanceof Q)){m=!0,a.push(e(An,a[0],{value:e(we,a[0])}).transform(t)),a=r(c.alternative).concat(a),a.unshift(c);continue n}}var l=_(c.body),p=l instanceof En?t.loopcontrol_target(l.label):null;if(l&&(l instanceof An&&!l.value&&i||l instanceof Fn&&o===u(p)||l instanceof Dn&&p instanceof en&&o===p)){l.label&&h(l.label.thedef.references,l),m=!0;var d=r(c.body).slice(0,-1);c=c.clone(),c.condition=c.condition.negate(t),c.body=e(en,c,{body:r(c.alternative).concat(a)}),c.alternative=e(en,c,{body:d}),a=[c.transform(t)];continue n}var l=_(c.alternative),p=l instanceof En?t.loopcontrol_target(l.label):null;if(l&&(l instanceof An&&!l.value&&i||l instanceof Fn&&o===u(p)||l instanceof Dn&&p instanceof en&&o===p)){l.label&&h(l.label.thedef.references,l),m=!0,c=c.clone(),c.body=e(en,c.body,{body:r(c.body).concat(a)}),c.alternative=e(en,c.alternative,{body:r(c.alternative).slice(0,-1)}),a=[c.transform(t)];continue n}a.unshift(c);break;default:a.unshift(c)}}return a}function s(n,e){var t=!1,r=n.length,o=e.self();return n=n.reduce(function(n,r){if(t)c(e,r,n);else{if(r instanceof En){var i=e.loopcontrol_target(r.label);r instanceof Dn&&i instanceof en&&u(i)===o||r instanceof Fn&&u(i)===o?r.label&&h(r.label.thedef.references,r):n.push(r)}else n.push(r);_(r)&&(t=!0)}return n},[]),m=n.length!=r,n}function f(n,t){function r(){o=jn.from_array(o),o&&i.push(e(Q,o,{body:o})),o=[]}if(n.length<2)return n;var o=[],i=[];return n.forEach(function(n){n instanceof Q&&o.length<2e3?o.push(n.body):(r(),i.push(n))}),r(),i=l(i,t),m=i.length!=n.length,i}function l(n,t){function r(n){o.pop();var e=i.body;return e instanceof jn?e.add(n):e=jn.cons(e,n),e.transform(t)}var o=[],i=null;return n.forEach(function(n){if(i)if(n instanceof fn){var t={};try{i.body.walk(new E(function(n){if(n instanceof Jn&&"in"==n.operator)throw t})),!n.init||n.init instanceof Mn?n.init||(n.init=i.body,o.pop()):n.init=r(n.init)}catch(a){if(a!==t)throw a}}else n instanceof Sn?n.condition=r(n.condition):n instanceof pn?n.expression=r(n.expression):n instanceof yn&&n.value?n.value=r(n.value):n instanceof yn?n.value=r(e(we,n)):n instanceof Cn&&(n.expression=r(n.expression));o.push(n),i=n instanceof Q?n:null}),o}function p(n,e){var t=null;return n.reduce(function(n,e){return e instanceof Mn&&t&&t.TYPE==e.TYPE?(t.definitions=t.definitions.concat(e.definitions),m=!0):e instanceof fn&&t instanceof Mn&&(!e.init||e.init.TYPE==t.TYPE)?(m=!0,n.pop(),e.init?e.init.definitions=t.definitions.concat(e.init.definitions):e.init=t,n.push(e),t=e):(t=e,n.push(e)),n},[])}function d(n,t){n.forEach(function(n){n instanceof Q&&(n.body=function t(n){return n.transform(new j(function(n){if(n instanceof Rn&&n.expression instanceof vn)return e(Vn,n,{operator:"!",expression:n});if(n instanceof Rn)n.expression=t(n.expression);else if(n instanceof jn)n.car=t(n.car);else if(n instanceof Yn){var r=t(n.condition);if(r!==n.condition){n.condition=r;var o=n.consequent;n.consequent=n.alternative,n.alternative=o}}return n}))}(n.body))})}var m;do m=!1,t.option("angular")&&(n=o(n)),n=i(n),t.option("dead_code")&&(n=s(n,t)),t.option("if_return")&&(n=a(n,t)),t.option("sequences")&&(n=f(n,t)),t.option("join_vars")&&(n=p(n,t));while(m);return t.option("negate_iife")&&d(n,t),n}function c(n,e,t){n.warn("Dropping unreachable code [{file}:{line},{col}]",e.start),e.walk(new E(function(e){return e instanceof Mn?(n.warn("Declarations in unreachable code! [{file}:{line},{col}]",e.start),e.remove_initializers(),t.push(e),!0):e instanceof gn?(t.push(e),!0):e instanceof dn?!0:void 0}))}function f(n,e){return n.print_to_string().length>e.print_to_string().length?e:n}function _(n){return n&&n.aborts()}function v(n,t){function o(o){o=r(o),n.body instanceof en?(n.body=n.body.clone(),n.body.body=o.concat(n.body.body.slice(1)),n.body=n.body.transform(t)):n.body=e(en,n.body,{body:o}).transform(t),v(n,t)}var i=n.body instanceof en?n.body.body[0]:n.body;i instanceof Sn&&(i.body instanceof Dn&&t.loopcontrol_target(i.body.label)===n?(n.condition?n.condition=e(Jn,n.condition,{left:n.condition,operator:"&&",right:i.condition.negate(t)}):n.condition=i.condition.negate(t),o(i.alternative)):i.alternative instanceof Dn&&t.loopcontrol_target(i.alternative.label)===n&&(n.condition?n.condition=e(Jn,n.condition,{left:n.condition,operator:"&&",right:i.condition}):n.condition=i.condition,o(i.body)))}function A(n,e){var t=e.option("pure_getters");e.options.pure_getters=!1;var r=n.has_side_effects(e);return e.options.pure_getters=t,r}function w(n,t){return t.option("booleans")&&t.in_boolean_context()&&!n.has_side_effects(t)?e(Ce,n):n}n(X,function(n,e){return n}),X.DEFMETHOD("equivalent_to",function(n){return this.print_to_string()==n.print_to_string()}),function(n){var e=["!","delete"],t=["in","instanceof","==","!=","===","!==","<","<=",">=",">"];n(X,function(){return!1}),n(Vn,function(){return i(this.operator,e)}),n(Jn,function(){return i(this.operator,t)||("&&"==this.operator||"||"==this.operator)&&this.left.is_boolean()&&this.right.is_boolean()}),n(Yn,function(){return this.consequent.is_boolean()&&this.alternative.is_boolean()}),n(Xn,function(){return"="==this.operator&&this.right.is_boolean()}),n(jn,function(){return this.cdr.is_boolean()}),n(Ce,function(){return!0}),n(Se,function(){return!0})}(function(n,e){n.DEFMETHOD("is_boolean",e)}),function(n){n(X,function(){return!1}),n(_e,function(){return!0}),n(Vn,function(){return"typeof"==this.operator}),n(Jn,function(n){return"+"==this.operator&&(this.left.is_string(n)||this.right.is_string(n))}),n(Xn,function(n){return("="==this.operator||"+="==this.operator)&&this.right.is_string(n)}),n(jn,function(n){return this.cdr.is_string(n)}),n(Yn,function(n){return this.consequent.is_string(n)&&this.alternative.is_string(n)}),n(Rn,function(n){return n.option("unsafe")&&this.expression instanceof pe&&"String"==this.expression.name&&this.expression.undeclared()})}(function(n,e){n.DEFMETHOD("is_string",e)}),function(n){function e(n,e){if(!e)throw new Error("Compressor must be passed");return n._eval(e)}X.DEFMETHOD("evaluate",function(e){if(!e.option("evaluate"))return[this];try{var r=this._eval(e);return[f(t(e,r,this),this),r]}catch(o){if(o!==n)throw o;return[this]}}),n(G,function(){throw new Error(d("Cannot evaluate a statement [{file}:{line},{col}]",this.start))}),n(vn,function(){throw n}),n(X,function(){throw n}),n(me,function(){return this.getValue()}),n(Vn,function(t){var r=this.expression;switch(this.operator){case"!":return!e(r,t);case"typeof":if(r instanceof vn)return"function";if(r=e(r,t),r instanceof RegExp)throw n;return typeof r;case"void":return void e(r,t);case"~":return~e(r,t);case"-":if(r=e(r,t),0===r)throw n;return-r;case"+":return+e(r,t)}throw n}),n(Jn,function(t){var r=this.left,o=this.right;switch(this.operator){case"&&":return e(r,t)&&e(o,t);case"||":return e(r,t)||e(o,t);case"|":return e(r,t)|e(o,t);case"&":return e(r,t)&e(o,t);case"^":return e(r,t)^e(o,t);case"+":return e(r,t)+e(o,t);case"*":return e(r,t)*e(o,t);case"/":return e(r,t)/e(o,t);case"%":return e(r,t)%e(o,t);case"-":return e(r,t)-e(o,t);case"<<":return e(r,t)<<e(o,t);case">>":return e(r,t)>>e(o,t);case">>>":return e(r,t)>>>e(o,t);case"==":return e(r,t)==e(o,t);case"===":return e(r,t)===e(o,t);case"!=":return e(r,t)!=e(o,t);case"!==":return e(r,t)!==e(o,t);case"<":return e(r,t)<e(o,t);case"<=":return e(r,t)<=e(o,t);case">":return e(r,t)>e(o,t);case">=":return e(r,t)>=e(o,t);case"in":return e(r,t)in e(o,t);case"instanceof":return e(r,t)instanceof e(o,t)}throw n}),n(Yn,function(n){return e(this.condition,n)?e(this.consequent,n):e(this.alternative,n)}),n(pe,function(t){var r=this.definition();if(r&&r.constant&&r.init)return e(r.init,t);throw n}),n(In,function(t){if(t.option("unsafe")&&"length"==this.property){var r=e(this.expression,t);if("string"==typeof r)return r.length}throw n})}(function(n,e){n.DEFMETHOD("_eval",e)}),function(n){function t(n){return e(Vn,n,{operator:"!",expression:n})}n(X,function(){return t(this)}),n(G,function(){throw new Error("Cannot negate a statement")}),n(vn,function(){return t(this)}),n(Vn,function(){return"!"==this.operator?this.expression:t(this)}),n(jn,function(n){var e=this.clone();return e.cdr=e.cdr.negate(n),e}),n(Yn,function(n){var e=this.clone();return e.consequent=e.consequent.negate(n),e.alternative=e.alternative.negate(n),f(t(this),e)}),n(Jn,function(n){var e=this.clone(),r=this.operator;if(n.option("unsafe_comps"))switch(r){case"<=":return e.operator=">",e;case"<":return e.operator=">=",e;case">=":return e.operator="<",e;case">":return e.operator="<=",e}switch(r){case"==":return e.operator="!=",e;case"!=":return e.operator="==",e;case"===":return e.operator="!==",e;case"!==":return e.operator="===",e;case"&&":return e.operator="||",e.left=e.left.negate(n),e.right=e.right.negate(n),f(t(this),e);case"||":return e.operator="&&",e.left=e.left.negate(n),e.right=e.right.negate(n),f(t(this),e)}return t(this)})}(function(n,e){n.DEFMETHOD("negate",function(n){return e.call(this,n)})}),function(n){n(X,function(n){return!0}),n(tn,function(n){return!1}),n(me,function(n){return!1}),n(he,function(n){return!1}),n(Rn,function(n){var e=n.option("pure_funcs");return e?e.indexOf(this.expression.print_to_string())<0:!0}),n(nn,function(n){for(var e=this.body.length;--e>=0;)if(this.body[e].has_side_effects(n))return!0;return!1}),n(Q,function(n){return this.body.has_side_effects(n)}),n(gn,function(n){return!0}),n(vn,function(n){return!1}),n(Jn,function(n){return this.left.has_side_effects(n)||this.right.has_side_effects(n)}),n(Xn,function(n){return!0}),n(Yn,function(n){return this.condition.has_side_effects(n)||this.consequent.has_side_effects(n)||this.alternative.has_side_effects(n)}),n(Ln,function(n){return"delete"==this.operator||"++"==this.operator||"--"==this.operator||this.expression.has_side_effects(n)}),n(pe,function(n){return this.global()&&this.undeclared()}),n(Kn,function(n){for(var e=this.properties.length;--e>=0;)if(this.properties[e].has_side_effects(n))return!0;return!1}),n(Zn,function(n){return this.value.has_side_effects(n)}),n(Gn,function(n){for(var e=this.elements.length;--e>=0;)if(this.elements[e].has_side_effects(n))return!0;return!1}),n(In,function(n){return n.option("pure_getters")?this.expression.has_side_effects(n):!0}),n(Un,function(n){return n.option("pure_getters")?this.expression.has_side_effects(n)||this.property.has_side_effects(n):!0}),n(Pn,function(n){return!n.option("pure_getters")}),n(jn,function(n){return this.car.has_side_effects(n)||this.cdr.has_side_effects(n)})}(function(n,e){n.DEFMETHOD("has_side_effects",e)}),function(n){function e(){var n=this.body.length;return n>0&&_(this.body[n-1])}n(G,function(){return null}),n(bn,function(){return this}),n(en,e),n(kn,e),n(Sn,function(){return this.alternative&&_(this.body)&&_(this.alternative)&&this})}(function(n,e){n.DEFMETHOD("aborts",e)}),n(Z,function(n,t){return n.scope.has_directive(n.value)!==n.scope?e(tn,n):n}),n(K,function(n,t){return t.option("drop_debugger")?e(tn,n):n}),n(on,function(n,t){return n.body instanceof Dn&&t.loopcontrol_target(n.body.label)===n.body?e(tn,n):0==n.label.references.length?n.body:n}),n(nn,function(n,e){return n.body=s(n.body,e),n}),n(en,function(n,t){switch(n.body=s(n.body,t),n.body.length){case 1:return n.body[0];case 0:return e(tn,n)}return n}),dn.DEFMETHOD("drop_unused",function(n){var t=this;if(n.option("unused")&&!(t instanceof hn)&&!t.uses_eval){var r=[],o=new y,a=this,u=new E(function(e,i){if(e!==t){if(e instanceof gn)return o.add(e.name.name,e),!0;if(e instanceof Mn&&a===t)return e.definitions.forEach(function(e){e.value&&(o.add(e.name.name,e.value),e.value.has_side_effects(n)&&e.value.walk(u))}),!0;if(e instanceof pe)return p(r,e.definition()),!0;if(e instanceof dn){var s=a;return a=e,i(),a=s,!0}}});t.walk(u);for(var s=0;s<r.length;++s)r[s].orig.forEach(function(n){var e=o.get(n.name);e&&e.forEach(function(n){var e=new E(function(n){n instanceof pe&&p(r,n.definition())});n.walk(e)})});var c=new j(function(o,a,u){if(o instanceof mn&&!(o instanceof _n)&&n.option("unsafe")&&!n.option("keep_fargs"))for(var s=o.argnames,f=s.length;--f>=0;){var l=s[f];if(!l.unreferenced())break;s.pop(),n.warn("Dropping unused function argument {name} [{file}:{line},{col}]",{name:l.name,file:l.start.file,line:l.start.line,col:l.start.col})}if(o instanceof gn&&o!==t)return i(o.name.definition(),r)?o:(n.warn("Dropping unused function {name} [{file}:{line},{col}]",{name:o.name.name,file:o.name.start.file,line:o.name.start.line,col:o.name.start.col}),e(tn,o));if(o instanceof Mn&&!(c.parent()instanceof ln)){var p=o.definitions.filter(function(e){if(i(e.name.definition(),r))return!0;var t={name:e.name.name,file:e.name.start.file,line:e.name.start.line,col:e.name.start.col};return e.value&&e.value.has_side_effects(n)?(e._unused_side_effects=!0,n.warn("Side effects in initialization of unused variable {name} [{file}:{line},{col}]",t),!0):(n.warn("Dropping unused variable {name} [{file}:{line},{col}]",t),!1)});p=m(p,function(n,e){return!n.value&&e.value?-1:!e.value&&n.value?1:0});for(var d=[],f=0;f<p.length;){var h=p[f];h._unused_side_effects?(d.push(h.value),p.splice(f,1)):(d.length>0&&(d.push(h.value),h.value=jn.from_array(d),d=[]),++f)}return d=d.length>0?e(en,o,{body:[e(Q,o,{body:jn.from_array(d)})]}):null,0!=p.length||d?0==p.length?u?J.splice(d.body):d:(o.definitions=p,d?(d.body.unshift(o),u?J.splice(d.body):d):o):e(tn,o)}if(o instanceof fn&&(a(o,this),o.init instanceof en)){var _=o.init.body.slice(0,-1);return o.init=o.init.body.slice(-1)[0].body,_.push(o),u?J.splice(_):e(en,o,{body:_})}return o instanceof dn&&o!==t?o:void 0});t.transform(c)}}),dn.DEFMETHOD("hoist_declarations",function(n){var t=n.option("hoist_funs"),r=n.option("hoist_vars"),o=this;if(t||r){var i=[],u=[],s=new y,c=0,f=0;o.walk(new E(function(n){return n instanceof dn&&n!==o?!0:n instanceof qn?(++f,!0):void 0})),r=r&&f>1;var l=new j(function(n){if(n!==o){if(n instanceof Z)return i.push(n),e(tn,n);if(n instanceof gn&&t)return u.push(n),e(tn,n);if(n instanceof qn&&r){n.definitions.forEach(function(n){s.set(n.name.name,n),++c});var a=n.to_assignments(),f=l.parent();return f instanceof ln&&f.init===n?null==a?n.definitions[0].name:a:f instanceof fn&&f.init===n?a:a?e(Q,n,{body:a}):e(tn,n)}if(n instanceof dn)return n}});if(o=o.transform(l),c>0){var p=[];if(s.each(function(n,e){o instanceof mn&&a(function(e){return e.name==n.name.name},o.argnames)?s.del(e):(n=n.clone(),n.value=null,p.push(n),s.set(e,n))}),p.length>0){for(var d=0;d<o.body.length;){if(o.body[d]instanceof Q){var m,_,v=o.body[d].body;if(v instanceof Xn&&"="==v.operator&&(m=v.left)instanceof te&&s.has(m.name)){var g=s.get(m.name);if(g.value)break;g.value=v.right,h(p,g),p.push(g),o.body.splice(d,1);continue}if(v instanceof jn&&(_=v.car)instanceof Xn&&"="==_.operator&&(m=_.left)instanceof te&&s.has(m.name)){
var g=s.get(m.name);if(g.value)break;g.value=_.right,h(p,g),p.push(g),o.body[d].body=v.cdr;continue}}if(o.body[d]instanceof tn)o.body.splice(d,1);else{if(!(o.body[d]instanceof en))break;var b=[d,1].concat(o.body[d].body);o.body.splice.apply(o.body,b)}}p=e(qn,o,{definitions:p}),u.push(p)}}o.body=i.concat(u,o.body)}return o}),n(Q,function(n,t){return t.option("side_effects")&&!n.body.has_side_effects(t)?(t.warn("Dropping side-effect-free statement [{file}:{line},{col}]",n.start),e(tn,n)):n}),n(un,function(n,t){var r=n.condition.evaluate(t);if(n.condition=r[0],!t.option("loops"))return n;if(r.length>1){if(r[1])return e(fn,n,{body:n.body});if(n instanceof cn&&t.option("dead_code")){var o=[];return c(t,n.body,o),e(en,n,{body:o})}}return n}),n(cn,function(n,t){return t.option("loops")?(n=un.prototype.optimize.call(n,t),n instanceof cn&&(v(n,t),n=e(fn,n,n).transform(t)),n):n}),n(fn,function(n,t){var r=n.condition;if(r&&(r=r.evaluate(t),n.condition=r[0]),!t.option("loops"))return n;if(r&&r.length>1&&!r[1]&&t.option("dead_code")){var o=[];return n.init instanceof G?o.push(n.init):n.init&&o.push(e(Q,n.init,{body:n.init})),c(t,n.body,o),e(en,n,{body:o})}return v(n,t),n}),n(Sn,function(n,t){if(!t.option("conditionals"))return n;var r=n.condition.evaluate(t);if(n.condition=r[0],r.length>1)if(r[1]){if(t.warn("Condition always true [{file}:{line},{col}]",n.condition.start),t.option("dead_code")){var i=[];return n.alternative&&c(t,n.alternative,i),i.push(n.body),e(en,n,{body:i}).transform(t)}}else if(t.warn("Condition always false [{file}:{line},{col}]",n.condition.start),t.option("dead_code")){var i=[];return c(t,n.body,i),n.alternative&&i.push(n.alternative),e(en,n,{body:i}).transform(t)}o(n.alternative)&&(n.alternative=null);var a=n.condition.negate(t),u=f(n.condition,a)===a;if(n.alternative&&u){u=!1,n.condition=a;var s=n.body;n.body=n.alternative||e(tn),n.alternative=s}if(o(n.body)&&o(n.alternative))return e(Q,n.condition,{body:n.condition}).transform(t);if(n.body instanceof Q&&n.alternative instanceof Q)return e(Q,n,{body:e(Yn,n,{condition:n.condition,consequent:n.body.body,alternative:n.alternative.body})}).transform(t);if(o(n.alternative)&&n.body instanceof Q)return u?e(Q,n,{body:e(Jn,n,{operator:"||",left:a,right:n.body.body})}).transform(t):e(Q,n,{body:e(Jn,n,{operator:"&&",left:n.condition,right:n.body.body})}).transform(t);if(n.body instanceof tn&&n.alternative&&n.alternative instanceof Q)return e(Q,n,{body:e(Jn,n,{operator:"||",left:n.condition,right:n.alternative.body})}).transform(t);if(n.body instanceof yn&&n.alternative instanceof yn&&n.body.TYPE==n.alternative.TYPE)return e(n.body.CTOR,n,{value:e(Yn,n,{condition:n.condition,consequent:n.body.value||e(we,n.body).optimize(t),alternative:n.alternative.value||e(we,n.alternative).optimize(t)})}).transform(t);if(n.body instanceof Sn&&!n.body.alternative&&!n.alternative&&(n.condition=e(Jn,n.condition,{operator:"&&",left:n.condition,right:n.body.condition}).transform(t),n.body=n.body.body),_(n.body)&&n.alternative){var l=n.alternative;return n.alternative=null,e(en,n,{body:[n,l]}).transform(t)}if(_(n.alternative)){var p=n.body;return n.body=n.alternative,n.condition=u?a:n.condition.negate(t),n.alternative=null,e(en,n,{body:[n,p]}).transform(t)}return n}),n(Cn,function(n,t){if(0==n.body.length&&t.option("conditionals"))return e(Q,n,{body:n.expression}).transform(t);for(;;){var r=n.body[n.body.length-1];if(r){var o=r.body[r.body.length-1];if(o instanceof Dn&&u(t.loopcontrol_target(o.label))===n&&r.body.pop(),r instanceof Bn&&0==r.body.length){n.body.pop();continue}}break}var i=n.expression.evaluate(t);n:if(2==i.length)try{if(n.expression=i[0],!t.option("dead_code"))break n;var a=i[1],s=!1,c=!1,f=!1,l=!1,p=!1,d=new j(function(r,o,i){if(r instanceof mn||r instanceof Q)return r;if(r instanceof Cn&&r===n)return r=r.clone(),o(r,this),p?r:e(en,r,{body:r.body.reduce(function(n,e){return n.concat(e.body)},[])}).transform(t);if(r instanceof Sn||r instanceof Tn){var u=s;return s=!c,o(r,this),s=u,r}if(r instanceof rn||r instanceof Cn){var u=c;return c=!0,o(r,this),c=u,r}if(r instanceof Dn&&this.loopcontrol_target(r.label)===n)return s?(p=!0,r):c?r:(l=!0,i?J.skip:e(tn,r));if(r instanceof kn&&this.parent()===n){if(l)return J.skip;if(r instanceof xn){var d=r.expression.evaluate(t);if(d.length<2)throw n;return d[1]===a||f?(f=!0,_(r)&&(l=!0),o(r,this),r):J.skip}return o(r,this),r}});d.stack=t.stack.slice(),n=n.transform(d)}catch(h){if(h!==n)throw h}return n}),n(xn,function(n,e){return n.body=s(n.body,e),n}),n(Tn,function(n,e){return n.body=s(n.body,e),n}),Mn.DEFMETHOD("remove_initializers",function(){this.definitions.forEach(function(n){n.value=null})}),Mn.DEFMETHOD("to_assignments",function(){var n=this.definitions.reduce(function(n,t){if(t.value){var r=e(pe,t.name,t.name);n.push(e(Xn,t,{operator:"=",left:r,right:t.value}))}return n},[]);return 0==n.length?null:jn.from_array(n)}),n(Mn,function(n,t){return 0==n.definitions.length?e(tn,n):n}),n(vn,function(n,e){return n=mn.prototype.optimize.call(n,e),e.option("unused")&&!e.option("keep_fnames")&&n.name&&n.name.unreferenced()&&(n.name=null),n}),n(Rn,function(n,r){if(r.option("unsafe")){var o=n.expression;if(o instanceof pe&&o.undeclared())switch(o.name){case"Array":if(1!=n.args.length)return e(Gn,n,{elements:n.args}).transform(r);break;case"Object":if(0==n.args.length)return e(Kn,n,{properties:[]});break;case"String":if(0==n.args.length)return e(_e,n,{value:""});if(n.args.length<=1)return e(Jn,n,{left:n.args[0],operator:"+",right:e(_e,n,{value:""})}).transform(r);break;case"Number":if(0==n.args.length)return e(ve,n,{value:0});if(1==n.args.length)return e(Vn,n,{expression:n.args[0],operator:"+"}).transform(r);case"Boolean":if(0==n.args.length)return e(Se,n);if(1==n.args.length)return e(Vn,n,{expression:e(Vn,null,{expression:n.args[0],operator:"!"}),operator:"!"}).transform(r);break;case"Function":if(0==n.args.length)return e(vn,n,{argnames:[],body:[]});if(b(n.args,function(n){return n instanceof _e}))try{var i="(function("+n.args.slice(0,-1).map(function(n){return n.value}).join(",")+"){"+n.args[n.args.length-1].value+"})()",a=H(i);a.figure_out_scope({screw_ie8:r.option("screw_ie8")});var u=new U(r.options);a=a.transform(u),a.figure_out_scope({screw_ie8:r.option("screw_ie8")}),a.mangle_names();var s;try{a.walk(new E(function(n){if(n instanceof mn)throw s=n,a}))}catch(c){if(c!==a)throw c}if(!s)return n;var l=s.argnames.map(function(t,r){return e(_e,n.args[r],{value:t.print_to_string()})}),i=I();return en.prototype._codegen.call(s,s,i),i=i.toString().replace(/^\{|\}$/g,""),l.push(e(_e,n.args[n.args.length-1],{value:i})),n.args=l,n}catch(c){if(!(c instanceof q))throw console.log(c),c;r.warn("Error parsing code passed to new Function [{file}:{line},{col}]",n.args[n.args.length-1].start),r.warn(c.toString())}}else{if(o instanceof In&&"toString"==o.property&&0==n.args.length)return e(Jn,n,{left:e(_e,n,{value:""}),operator:"+",right:o.expression}).transform(r);if(o instanceof In&&o.expression instanceof Gn&&"join"==o.property){var p=0==n.args.length?",":n.args[0].evaluate(r)[1];if(null!=p){var d=o.expression.elements.reduce(function(n,e){if(e=e.evaluate(r),0==n.length||1==e.length)n.push(e);else{var o=n[n.length-1];if(2==o.length){var i=""+o[1]+p+e[1];n[n.length-1]=[t(r,i,o[0]),i]}else n.push(e)}return n},[]);if(0==d.length)return e(_e,n,{value:""});if(1==d.length)return d[0][0];if(""==p){var h;return h=d[0][0]instanceof _e||d[1][0]instanceof _e?d.shift()[0]:e(_e,n,{value:""}),d.reduce(function(n,t){return e(Jn,t[0],{operator:"+",left:n,right:t[0]})},h).transform(r)}var m=n.clone();return m.expression=m.expression.clone(),m.expression.expression=m.expression.expression.clone(),m.expression.expression.elements=d.map(function(n){return n[0]}),f(n,m)}}}}if(r.option("side_effects")&&n.expression instanceof vn&&0==n.args.length&&!nn.prototype.has_side_effects.call(n.expression,r))return e(we,n).transform(r);if(r.option("drop_console")&&n.expression instanceof Pn){for(var _=n.expression.expression;_.expression;)_=_.expression;if(_ instanceof pe&&"console"==_.name&&_.undeclared())return e(we,n).transform(r)}return n.evaluate(r)[0]}),n(Hn,function(n,t){if(t.option("unsafe")){var r=n.expression;if(r instanceof pe&&r.undeclared())switch(r.name){case"Object":case"RegExp":case"Function":case"Error":case"Array":return e(Rn,n,n).transform(t)}}return n}),n(jn,function(n,t){if(!t.option("side_effects"))return n;if(!n.car.has_side_effects(t)){var r;if(!(n.cdr instanceof pe&&"eval"==n.cdr.name&&n.cdr.undeclared()&&(r=t.parent())instanceof Rn&&r.expression===n))return n.cdr}if(t.option("cascade")){if(n.car instanceof Xn&&!n.car.left.has_side_effects(t)){if(n.car.left.equivalent_to(n.cdr))return n.car;if(n.cdr instanceof Rn&&n.cdr.expression.equivalent_to(n.car.left))return n.cdr.expression=n.car,n.cdr}if(!n.car.has_side_effects(t)&&!n.cdr.has_side_effects(t)&&n.car.equivalent_to(n.cdr))return n.car}return n.cdr instanceof Vn&&"void"==n.cdr.operator&&!n.cdr.expression.has_side_effects(t)?(n.cdr.expression=n.car,n.cdr):n.cdr instanceof we?e(Vn,n,{operator:"void",expression:n.car}):n}),Ln.DEFMETHOD("lift_sequences",function(n){if(n.option("sequences")&&this.expression instanceof jn){var e=this.expression,t=e.to_array();return this.expression=t.pop(),t.push(this),e=jn.from_array(t).transform(n)}return this}),n(Wn,function(n,e){return n.lift_sequences(e)}),n(Vn,function(n,t){n=n.lift_sequences(t);var r=n.expression;if(t.option("booleans")&&t.in_boolean_context()){switch(n.operator){case"!":if(r instanceof Vn&&"!"==r.operator)return r.expression;break;case"typeof":return t.warn("Boolean expression always true [{file}:{line},{col}]",n.start),e(Ce,n)}r instanceof Jn&&"!"==n.operator&&(n=f(n,r.negate(t)))}return n.evaluate(t)[0]}),Jn.DEFMETHOD("lift_sequences",function(n){if(n.option("sequences")){if(this.left instanceof jn){var e=this.left,t=e.to_array();return this.left=t.pop(),t.push(this),e=jn.from_array(t).transform(n)}if(this.right instanceof jn&&this instanceof Xn&&!A(this.left,n)){var e=this.right,t=e.to_array();return this.right=t.pop(),t.push(this),e=jn.from_array(t).transform(n)}}return this});var D=g("== === != !== * & | ^");n(Jn,function(n,t){var r=t.has_directive("use asm")?l:function(e,r){if(r||!n.left.has_side_effects(t)&&!n.right.has_side_effects(t)){e&&(n.operator=e);var o=n.left;n.left=n.right,n.right=o}};if(D(n.operator)&&(n.right instanceof me&&!(n.left instanceof me)&&(n.left instanceof Jn&&We[n.left.operator]>=We[n.operator]||r(null,!0)),/^[!=]==?$/.test(n.operator))){if(n.left instanceof pe&&n.right instanceof Yn){if(n.right.consequent instanceof pe&&n.right.consequent.definition()===n.left.definition()){if(/^==/.test(n.operator))return n.right.condition;if(/^!=/.test(n.operator))return n.right.condition.negate(t)}if(n.right.alternative instanceof pe&&n.right.alternative.definition()===n.left.definition()){if(/^==/.test(n.operator))return n.right.condition.negate(t);if(/^!=/.test(n.operator))return n.right.condition}}if(n.right instanceof pe&&n.left instanceof Yn){if(n.left.consequent instanceof pe&&n.left.consequent.definition()===n.right.definition()){if(/^==/.test(n.operator))return n.left.condition;if(/^!=/.test(n.operator))return n.left.condition.negate(t)}if(n.left.alternative instanceof pe&&n.left.alternative.definition()===n.right.definition()){if(/^==/.test(n.operator))return n.left.condition.negate(t);if(/^!=/.test(n.operator))return n.left.condition}}}if(n=n.lift_sequences(t),t.option("comparisons"))switch(n.operator){case"===":case"!==":(n.left.is_string(t)&&n.right.is_string(t)||n.left.is_boolean()&&n.right.is_boolean())&&(n.operator=n.operator.substr(0,2));case"==":case"!=":n.left instanceof _e&&"undefined"==n.left.value&&n.right instanceof Vn&&"typeof"==n.right.operator&&t.option("unsafe")&&(n.right.expression instanceof pe&&n.right.expression.undeclared()||(n.right=n.right.expression,n.left=e(we,n.left).optimize(t),2==n.operator.length&&(n.operator+="=")))}if(t.option("conditionals"))if("&&"==n.operator){var o=n.left.evaluate(t),i=n.right.evaluate(t);if(o.length>1)return o[1]?(t.warn("Condition left of && always true [{file}:{line},{col}]",n.start),i[0]):(t.warn("Condition left of && always false [{file}:{line},{col}]",n.start),o[0])}else if("||"==n.operator){var o=n.left.evaluate(t),i=n.right.evaluate(t);if(o.length>1)return o[1]?(t.warn("Condition left of || always true [{file}:{line},{col}]",n.start),o[0]):(t.warn("Condition left of || always false [{file}:{line},{col}]",n.start),i[0])}if(t.option("booleans")&&t.in_boolean_context())switch(n.operator){case"&&":var o=n.left.evaluate(t),i=n.right.evaluate(t);if(o.length>1&&!o[1]||i.length>1&&!i[1])return t.warn("Boolean && always false [{file}:{line},{col}]",n.start),n.left.has_side_effects(t)?e(jn,n,{car:n.left,cdr:e(Se)}).optimize(t):e(Se,n);if(o.length>1&&o[1])return i[0];if(i.length>1&&i[1])return o[0];break;case"||":var o=n.left.evaluate(t),i=n.right.evaluate(t);if(o.length>1&&o[1]||i.length>1&&i[1])return t.warn("Boolean || always true [{file}:{line},{col}]",n.start),n.left.has_side_effects(t)?e(jn,n,{car:n.left,cdr:e(Ce)}).optimize(t):e(Ce,n);if(o.length>1&&!o[1])return i[0];if(i.length>1&&!i[1])return o[0];break;case"+":var o=n.left.evaluate(t),i=n.right.evaluate(t);if(o.length>1&&o[0]instanceof _e&&o[1]||i.length>1&&i[0]instanceof _e&&i[1])return t.warn("+ in boolean context always true [{file}:{line},{col}]",n.start),e(Ce,n)}if(t.option("comparisons")&&n.is_boolean()){if(!(t.parent()instanceof Jn)||t.parent()instanceof Xn){var a=e(Vn,n,{operator:"!",expression:n.negate(t)});n=f(n,a)}switch(n.operator){case"<":r(">");break;case"<=":r(">=")}}return"+"==n.operator&&n.right instanceof _e&&""===n.right.getValue()&&n.left instanceof Jn&&"+"==n.left.operator&&n.left.is_string(t)?n.left:(t.option("evaluate")&&"+"==n.operator&&(n.left instanceof me&&n.right instanceof Jn&&"+"==n.right.operator&&n.right.left instanceof me&&n.right.is_string(t)&&(n=e(Jn,n,{operator:"+",left:e(_e,null,{value:""+n.left.getValue()+n.right.left.getValue(),start:n.left.start,end:n.right.left.end}),right:n.right.right})),n.right instanceof me&&n.left instanceof Jn&&"+"==n.left.operator&&n.left.right instanceof me&&n.left.is_string(t)&&(n=e(Jn,n,{operator:"+",left:n.left.left,right:e(_e,null,{value:""+n.left.right.getValue()+n.right.getValue(),start:n.left.right.start,end:n.right.end})})),n.left instanceof Jn&&"+"==n.left.operator&&n.left.is_string(t)&&n.left.right instanceof me&&n.right instanceof Jn&&"+"==n.right.operator&&n.right.left instanceof me&&n.right.is_string(t)&&(n=e(Jn,n,{operator:"+",left:e(Jn,n.left,{operator:"+",left:n.left.left,right:e(_e,null,{value:""+n.left.right.getValue()+n.right.left.getValue(),start:n.left.right.start,end:n.right.left.end})}),right:n.right.right}))),n.right instanceof Jn&&n.right.operator==n.operator&&("&&"==n.operator||"||"==n.operator)?(n.left=e(Jn,n.left,{operator:n.operator,left:n.left,right:n.right.left}),n.right=n.right.right,n.transform(t)):n.evaluate(t)[0])}),n(pe,function(n,r){if(n.undeclared()){var o=r.option("global_defs");if(o&&o.hasOwnProperty(n.name))return t(r,o[n.name],n);switch(n.name){case"undefined":return e(we,n);case"NaN":return e(Ae,n).transform(r);case"Infinity":return e(De,n).transform(r)}}return n}),n(De,function(n,t){return e(Jn,n,{operator:"/",left:e(ve,n,{value:1}),right:e(ve,n,{value:0})})}),n(we,function(n,t){if(t.option("unsafe")){var r=t.find_parent(dn),o=r.find_variable("undefined");if(o){var i=e(pe,n,{name:"undefined",scope:r,thedef:o});return i.reference(),i}}return n});var F=["+","-","/","*","%",">>","<<",">>>","|","^","&"];n(Xn,function(n,e){return n=n.lift_sequences(e),"="==n.operator&&n.left instanceof pe&&n.right instanceof Jn&&n.right.left instanceof pe&&n.right.left.name==n.left.name&&i(n.right.operator,F)&&(n.operator=n.right.operator+"=",n.right=n.right.right),n}),n(Yn,function(n,r){if(!r.option("conditionals"))return n;if(n.condition instanceof jn){var o=n.condition.car;return n.condition=n.condition.cdr,jn.cons(o,n)}var i=n.condition.evaluate(r);if(i.length>1)return i[1]?(r.warn("Condition always true [{file}:{line},{col}]",n.start),n.consequent):(r.warn("Condition always false [{file}:{line},{col}]",n.start),n.alternative);var a=i[0].negate(r);f(i[0],a)===a&&(n=e(Yn,n,{condition:a,consequent:n.alternative,alternative:n.consequent}));var u=n.consequent,s=n.alternative;if(u instanceof Xn&&s instanceof Xn&&u.operator==s.operator&&u.left.equivalent_to(s.left)&&!u.left.has_side_effects(r))return e(Xn,n,{operator:u.operator,left:u.left,right:e(Yn,n,{condition:n.condition,consequent:u.right,alternative:s.right})});if(u instanceof Rn&&s.TYPE===u.TYPE&&u.args.length==s.args.length&&!u.expression.has_side_effects(r)&&u.expression.equivalent_to(s.expression)){if(0==u.args.length)return e(jn,n,{car:n.condition,cdr:u});if(1==u.args.length)return u.args[0]=e(Yn,n,{condition:n.condition,consequent:u.args[0],alternative:s.args[0]}),u}return u instanceof Yn&&u.alternative.equivalent_to(s)?e(Yn,n,{condition:e(Jn,n,{left:n.condition,operator:"&&",right:u.condition}),consequent:u.consequent,alternative:s}):u instanceof me&&s instanceof me&&u.equivalent_to(s)?n.condition.has_side_effects(r)?jn.from_array([n.condition,t(r,u.value,n)]):t(r,u.value,n):u instanceof Ce&&s instanceof Se?(n.condition=n.condition.negate(r),e(Vn,n.condition,{operator:"!",expression:n.condition})):u instanceof Se&&s instanceof Ce?n.condition.negate(r):n}),n(Fe,function(n,t){if(t.option("booleans")){var r=t.parent();return r instanceof Jn&&("=="==r.operator||"!="==r.operator)?(t.warn("Non-strict equality against boolean: {operator} {value} [{file}:{line},{col}]",{operator:r.operator,value:n.value,file:r.start.file,line:r.start.line,col:r.start.col}),e(ve,n,{value:+n.value})):e(Vn,n,{operator:"!",expression:e(ve,n,{value:1-n.value})})}return n}),n(Un,function(n,t){var r=n.property;if(r instanceof _e&&t.option("properties")){if(r=r.getValue(),xe(r)?t.option("screw_ie8"):$(r))return e(In,n,{expression:n.expression,property:r}).optimize(t);var o=parseFloat(r);isNaN(o)||o.toString()!=r||(n.property=e(ve,n.property,{value:o}))}return n}),n(In,function(n,t){var r=n.property;return xe(r)&&!t.option("screw_ie8")?e(Un,n,{expression:n.expression,property:e(_e,n,{value:r})}).optimize(t):n.evaluate(t)[0]}),n(Gn,w),n(Kn,w),n(ge,w)}(),function(){function n(n){var e=n.loc,t=e&&e.start,r=n.range;return new Y({file:e&&e.source,line:t&&t.line,col:t&&t.column,pos:r?r[0]:n.start,endline:t&&t.line,endcol:t&&t.column,endpos:r?r[0]:n.start})}function e(n){var e=n.loc,t=e&&e.end,r=n.range;return new Y({file:e&&e.source,line:t&&t.line,col:t&&t.column,pos:r?r[1]:n.end,endline:t&&t.line,endcol:t&&t.column,endpos:r?r[1]:n.end})}function t(t,o,c){var f="function From_Moz_"+t+"(M){\n";f+="return new "+o.name+"({\nstart: my_start_token(M),\nend: my_end_token(M)";var l="function To_Moz_"+t+"(M){\n";l+="return {\ntype: "+JSON.stringify(t),c&&c.split(/\s*,\s*/).forEach(function(n){var e=/([a-z0-9$_]+)(=|@|>|%)([a-z0-9$_]+)/i.exec(n);if(!e)throw new Error("Can't understand property map: "+n);var t=e[1],r=e[2],o=e[3];switch(f+=",\n"+o+": ",l+=",\n"+t+": ",r){case"@":f+="M."+t+".map(from_moz)",l+="M."+o+".map(to_moz)";break;case">":f+="from_moz(M."+t+")",l+="to_moz(M."+o+")";break;case"=":f+="M."+t,l+="M."+o;break;case"%":f+="from_moz(M."+t+").body",l+="to_moz_block(M)";break;default:throw new Error("Can't understand operator in propmap: "+n)}}),f+="\n})\n}",l+="\n}\n}",f=new Function("my_start_token","my_end_token","from_moz","return("+f+")")(n,e,r),l=new Function("to_moz","to_moz_block","return("+l+")")(a,u),s[t]=f,i(o,l)}function r(n){c.push(n);var e=null!=n?s[n.type](n):null;return c.pop(),e}function o(n,e,t){var r=n.start,o=n.end;return null!=r.pos&&null!=o.endpos&&(e.range=[r.pos,o.endpos]),r.line&&(e.loc={start:{line:r.line,column:r.col},end:o.endline?{line:o.endline,column:o.endcol}:null},r.file&&(e.loc.source=r.file)),e}function i(n,e){n.DEFMETHOD("to_mozilla_ast",function(){return o(this,e(this))})}function a(n){return null!=n?n.to_mozilla_ast():null}function u(n){return{type:"BlockStatement",body:n.body.map(a)}}var s={ExpressionStatement:function(t){var o=t.expression;return"Literal"===o.type&&"string"==typeof o.value?new Z({start:n(t),end:e(t),value:o.value}):new Q({start:n(t),end:e(t),body:r(o)})},TryStatement:function(t){var o=t.handlers||[t.handler];if(o.length>1||t.guardedHandlers&&t.guardedHandlers.length)throw new Error("Multiple catch clauses are not supported.");return new Tn({start:n(t),end:e(t),body:r(t.block).body,bcatch:r(o[0]),bfinally:t.finalizer?new $n(r(t.finalizer)):null})},Property:function(t){var o=t.key,i="Identifier"==o.type?o.name:o.value,a={start:n(o),end:e(t.value),key:i,value:r(t.value)};switch(t.kind){case"init":return new Qn(a);case"set":return a.value.name=r(o),new ne(a);case"get":return a.value.name=r(o),new ee(a)}},ObjectExpression:function(t){return new Kn({start:n(t),end:e(t),properties:t.properties.map(function(n){return n.type="Property",r(n)})})},SequenceExpression:function(n){return jn.from_array(n.expressions.map(r))},MemberExpression:function(t){return new(t.computed?Un:In)({start:n(t),end:e(t),property:t.computed?r(t.property):t.property.name,expression:r(t.object)})},SwitchCase:function(t){return new(t.test?xn:Bn)({start:n(t),end:e(t),expression:r(t.test),body:t.consequent.map(r)})},VariableDeclaration:function(t){return new("const"===t.kind?Nn:qn)({start:n(t),end:e(t),definitions:t.declarations.map(r)})},Literal:function(t){var r=t.value,o={start:n(t),end:e(t)};if(null===r)return new ye(o);switch(typeof r){case"string":return o.value=r,new _e(o);case"number":return o.value=r,new ve(o);case"boolean":return new(r?Ce:Se)(o);default:return o.value=r,new ge(o)}},Identifier:function(t){var r=c[c.length-2];return new("LabeledStatement"==r.type?le:"VariableDeclarator"==r.type&&r.id===t?"const"==r.kind?ae:ie:"FunctionExpression"==r.type?r.id===t?ce:ue:"FunctionDeclaration"==r.type?r.id===t?se:ue:"CatchClause"==r.type?fe:"BreakStatement"==r.type||"ContinueStatement"==r.type?de:pe)({start:n(t),end:e(t),name:t.name})}};s.UpdateExpression=s.UnaryExpression=function(t){var o="prefix"in t?t.prefix:"UnaryExpression"==t.type?!0:!1;return new(o?Vn:Wn)({start:n(t),end:e(t),operator:t.operator,expression:r(t.argument)})},t("Program",hn,"body@body"),t("EmptyStatement",tn),t("BlockStatement",en,"body@body"),t("IfStatement",Sn,"test>condition, consequent>body, alternate>alternative"),t("LabeledStatement",on,"label>label, body>body"),t("BreakStatement",Dn,"label>label"),t("ContinueStatement",Fn,"label>label"),t("WithStatement",pn,"object>expression, body>body"),t("SwitchStatement",Cn,"discriminant>expression, cases@body"),t("ReturnStatement",An,"argument>value"),t("ThrowStatement",wn,"argument>value"),t("WhileStatement",cn,"test>condition, body>body"),t("DoWhileStatement",sn,"test>condition, body>body"),t("ForStatement",fn,"init>init, test>condition, update>step, body>body"),t("ForInStatement",ln,"left>init, right>object, body>body"),t("DebuggerStatement",K),t("FunctionDeclaration",gn,"id>name, params@argnames, body%body"),t("VariableDeclarator",zn,"id>name, init>value"),t("CatchClause",On,"param>argname, body%body"),t("ThisExpression",he),t("ArrayExpression",Gn,"elements@elements"),t("FunctionExpression",vn,"id>name, params@argnames, body%body"),t("BinaryExpression",Jn,"operator=operator, left>left, right>right"),t("LogicalExpression",Jn,"operator=operator, left>left, right>right"),t("AssignmentExpression",Xn,"operator=operator, left>left, right>right"),t("ConditionalExpression",Yn,"test>condition, consequent>consequent, alternate>alternative"),t("NewExpression",Hn,"callee>expression, arguments@args"),t("CallExpression",Rn,"callee>expression, arguments@args"),i(Z,function(n){return{type:"ExpressionStatement",expression:{type:"Literal",value:n.value}}}),i(Q,function(n){return{type:"ExpressionStatement",expression:a(n.body)}}),i(kn,function(n){return{type:"SwitchCase",test:a(n.expression),consequent:n.body.map(a)}}),i(Tn,function(n){return{type:"TryStatement",block:u(n),handler:a(n.bcatch),guardedHandlers:[],finalizer:a(n.bfinally)}}),i(On,function(n){return{type:"CatchClause",param:a(n.argname),guard:null,body:u(n)}}),i(Mn,function(n){return{type:"VariableDeclaration",kind:n instanceof Nn?"const":"var",declarations:n.definitions.map(a)}}),i(jn,function(n){return{type:"SequenceExpression",expressions:n.to_array().map(a)}}),i(Pn,function(n){var e=n instanceof Un;return{type:"MemberExpression",object:a(n.expression),computed:e,property:e?a(n.property):{type:"Identifier",name:n.property}}}),i(Ln,function(n){return{type:"++"==n.operator||"--"==n.operator?"UpdateExpression":"UnaryExpression",operator:n.operator,prefix:n instanceof Vn,argument:a(n.expression)}}),i(Jn,function(n){return{type:"&&"==n.operator||"||"==n.operator?"LogicalExpression":"BinaryExpression",left:a(n.left),operator:n.operator,right:a(n.right)}}),i(Kn,function(n){return{type:"ObjectExpression",properties:n.properties.map(a)}}),i(Zn,function(n){var e,t=x(n.key)?{type:"Identifier",name:n.key}:{type:"Literal",value:n.key};return n instanceof Qn?e="init":n instanceof ee?e="get":n instanceof ne&&(e="set"),{type:"Property",kind:e,key:t,value:a(n.value)}}),i(te,function(n){var e=n.definition();return{type:"Identifier",name:e?e.mangled_name||e.name:n.name}}),i(me,function(n){var e=n.value;return"number"==typeof e&&(0>e||0===e&&0>1/e)?{type:"UnaryExpression",operator:"-",prefix:!0,argument:{type:"Literal",value:-e}}:{type:"Literal",value:e}}),i(be,function(n){return{type:"Identifier",name:String(n.value)}}),Fe.DEFMETHOD("to_mozilla_ast",me.prototype.to_mozilla_ast),ye.DEFMETHOD("to_mozilla_ast",me.prototype.to_mozilla_ast),Ee.DEFMETHOD("to_mozilla_ast",function(){return null}),nn.DEFMETHOD("to_mozilla_ast",en.prototype.to_mozilla_ast),mn.DEFMETHOD("to_mozilla_ast",vn.prototype.to_mozilla_ast);var c=null;X.from_mozilla_ast=function(n){var e=c;c=[];var t=r(n);return c=e,t}}(),n.array_to_hash=t,n.slice=r,n.characters=o,n.member=i,n.find_if=a,n.repeat_string=u,n.DefaultsError=s,n.defaults=c,n.merge=f,n.noop=l,n.MAP=J,n.push_uniq=p,n.string_template=d,n.remove=h,n.mergeSort=m,n.set_difference=_,n.set_intersection=v,n.makePredicate=g,n.all=b,n.Dictionary=y,n.DEFNODE=A,n.AST_Token=Y,n.AST_Node=X,n.AST_Statement=G,n.AST_Debugger=K,n.AST_Directive=Z,n.AST_SimpleStatement=Q,n.walk_body=w,n.AST_Block=nn,n.AST_BlockStatement=en,n.AST_EmptyStatement=tn,n.AST_StatementWithBody=rn,n.AST_LabeledStatement=on,n.AST_IterationStatement=an,n.AST_DWLoop=un,n.AST_Do=sn,n.AST_While=cn,n.AST_For=fn,n.AST_ForIn=ln,n.AST_With=pn,n.AST_Scope=dn,n.AST_Toplevel=hn,n.AST_Lambda=mn,n.AST_Accessor=_n,n.AST_Function=vn,n.AST_Defun=gn,n.AST_Jump=bn,n.AST_Exit=yn,n.AST_Return=An,n.AST_Throw=wn,n.AST_LoopControl=En,n.AST_Break=Dn,n.AST_Continue=Fn,n.AST_If=Sn,n.AST_Switch=Cn,n.AST_SwitchBranch=kn,n.AST_Default=Bn,n.AST_Case=xn,n.AST_Try=Tn,n.AST_Catch=On,n.AST_Finally=$n,n.AST_Definitions=Mn,n.AST_Var=qn,n.AST_Const=Nn,n.AST_VarDef=zn,n.AST_Call=Rn,n.AST_New=Hn,n.AST_Seq=jn,n.AST_PropAccess=Pn,n.AST_Dot=In,n.AST_Sub=Un,n.AST_Unary=Ln,n.AST_UnaryPrefix=Vn,n.AST_UnaryPostfix=Wn,n.AST_Binary=Jn,n.AST_Conditional=Yn,n.AST_Assign=Xn,n.AST_Array=Gn,n.AST_Object=Kn,n.AST_ObjectProperty=Zn,n.AST_ObjectKeyVal=Qn,n.AST_ObjectSetter=ne,n.AST_ObjectGetter=ee,n.AST_Symbol=te,n.AST_SymbolAccessor=re,n.AST_SymbolDeclaration=oe,n.AST_SymbolVar=ie,n.AST_SymbolConst=ae,n.AST_SymbolFunarg=ue,n.AST_SymbolDefun=se,n.AST_SymbolLambda=ce,n.AST_SymbolCatch=fe,n.AST_Label=le,n.AST_SymbolRef=pe,n.AST_LabelRef=de,n.AST_This=he,n.AST_Constant=me,n.AST_String=_e,n.AST_Number=ve,n.AST_RegExp=ge,n.AST_Atom=be,n.AST_Null=ye,n.AST_NaN=Ae,n.AST_Undefined=we,n.AST_Hole=Ee,n.AST_Infinity=De,n.AST_Boolean=Fe,n.AST_False=Se,n.AST_True=Ce,n.TreeWalker=E,n.KEYWORDS=ke,n.KEYWORDS_ATOM=Be,n.RESERVED_WORDS=xe,n.KEYWORDS_BEFORE_EXPRESSION=Te,n.OPERATOR_CHARS=Oe,n.RE_HEX_NUMBER=$e,n.RE_OCT_NUMBER=Me,n.RE_DEC_NUMBER=qe,n.OPERATORS=Ne,n.WHITESPACE_CHARS=ze,n.PUNC_BEFORE_EXPRESSION=Re,n.PUNC_CHARS=He,n.REGEXP_MODIFIERS=je,n.UNICODE=Pe,n.is_letter=D,n.is_digit=F,n.is_alphanumeric_char=S,n.is_unicode_digit=C,n.is_unicode_combining_mark=k,n.is_unicode_connector_punctuation=B,n.is_identifier=x,n.is_identifier_start=T,n.is_identifier_char=O,n.is_identifier_string=$,n.parse_js_number=M,n.JS_Parse_Error=q,n.js_error=N,n.is_token=z,n.EX_EOF=Ie,n.tokenizer=R,n.UNARY_PREFIX=Ue,n.UNARY_POSTFIX=Le,n.ASSIGNMENT=Ve,n.PRECEDENCE=We,n.STATEMENTS_WITH_LABELS=Je,n.ATOMIC_START_TOKEN=Ye,n.parse=H,n.TreeTransformer=j,n.SymbolDef=P,n.base54=Xe,n.OutputStream=I,n.Compressor=U,n.SourceMap=L,n.find_builtins=V,n.mangle_properties=W}({},function(){return this}());


