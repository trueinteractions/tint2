if(typeof(process.bridge) === 'undefined') process.initbridge();
if(typeof(process.bridge.dotnet) === 'undefined') process.bridge.dotnet = {};
if(typeof(process.bridge.ref) === 'undefined') process.bridge.ref = require('ref');
if(typeof(process.bridge.struct) === 'undefined') process.bridge.struct = require('struct');
if(typeof(process.bridge.ffi) === 'undefined') process.bridge.ffi = require('ffi');
if(typeof(process.bridge.win32) === 'undefined') process.bridge.win32 = require('win32');

var dotnet = process.bridge;
var assemblyImported = {};
var classCache = {};
dotnet.statistics = {assemblies_hit:0, assemblies_miss:0, enums:0,values:0,classes:0,fields:0,properties:0,events:0,methods:0,cachehit:0,cachemiss:0};

function unwrap(a) {
  if(a && a.pointer) return a.pointer;
  else if(a && a.classPointer) return a.classPointer;
  else return a;
}

function wrap(b) {
  if(Buffer.isBuffer(b) && !b.array) return createJSInstance(b);
  else return b;
}

function unwrapValues(e) {
  if(Array.isArray(e)) {
    var unwrapped = [];
    for(var i=0; i < types.length; i++) unwrapped[i] = unwrap(types[i]);
    return unwrapped;
  } else
    return unwrap(e);
}

function createJSInstance(pointer) {
  var typeNative = dotnet.getCLRType(pointer);
  var typeName = dotnet.execGetProperty(typeNative, 'Name');

  if(dotnet.execGetProperty(typeNative, "IsEnum")) {
    dotnet.statistics.enums++;
    var fullName = dotnet.execGetProperty(typeNative, "FullName");
    var v = fullName.split('.');
    var enumValue = dotnet.execMethod(pointer,'ToString');
    v.push(enumValue);
    var dst = process.bridge.dotnet;
    for(var i=0; i < v.length ; i++) {
      dotnet.statistics.values++;
      dst = dst[v[i]];
    }
    return dst;
  } else if(dotnet.execGetProperty(typeNative, "IsClass") || dotnet.execGetProperty(typeNative, "IsValueType")) {
    dotnet.statistics.classes++;
    var c = createClass(typeNative, typeName);
    var n = function() { this.pointer = pointer; }
    n.prototype = Object.create(c.prototype);
    n.prototype.constructor = n;
    return new n;
  }
}

function typeSignature(memberName, args) {
  var signature = memberName, unwrappedArgs = [];
  for(var i=0; i < args.length; i++) {
    signature += args[i] ? args[i].className : "null";
    unwrappedArgs.push(unwrap(args[i]));
  }
  return {signature:signature, unwrappedArgs:unwrappedArgs};
}


/* These enums, methods, fields and properties are created
 * by the following functions */


function createEnum(typeNative, memberName) {
  var names = dotnet.execMethod(typeNative,"GetEnumNames");
  var values = dotnet.execMethod(typeNative,"GetEnumValues");
  var nameEnumerator = dotnet.execMethod(names, "GetEnumerator");
  var valueEnumerator = dotnet.execMethod(values, "GetEnumerator");
  var obj = {};
  dotnet.statistics.enums++;
  while(dotnet.execMethod(nameEnumerator,'MoveNext') && 
        dotnet.execMethod(valueEnumerator, 'MoveNext'))
  {
    dotnet.statistics.values++;
    var ename = dotnet.execGetProperty(nameEnumerator, 'Current');
    var evalue = dotnet.execGetProperty(valueEnumerator, 'Current');
    obj[ename] = evalue;
  }
  return obj;
}

function createField(target, typeNative, typeName, memberNative, memberName, static) {
  dotnet.statistics.fields++;
  var objdest = static ? target : target.prototype;
  if(!objdest.hasOwnProperty(memberName)) {
    Object.defineProperty(objdest, memberName, {
      configurable:true,
      enumerable:true,
      get:function() {
        if(static) return wrap(dotnet.execGetStaticField(this.classPointer, memberName));
        else return wrap(dotnet.execGetField(this.pointer, memberName));
      },
      set:function(e) { 
        dotnet.execSetField((static ? this.classPointer : this.pointer),memberName,unwrap(e)); 
      }
    });
  }
}

function createMethod(target, typeNative, typeName, memberNative, memberName, static) {
  dotnet.statistics.methods++;
  var objdest = static ? target : target.prototype;
  var getobj = static ? dotnet.getStaticMethodObject : dotnet.getMethodObject;
  objdest[memberName] = function() {
    var s = typeSignature(memberName, arguments);
    if(!this._methods) this._methods = {};
    if(!this._methods[s.signature]) {
      var mArgs = [this.classPointer, memberName].concat(s.unwrappedArgs);
      this._methods[s.signature] = getobj.apply(null, mArgs);
    }
    var args = [this._methods[s.signature], static ? null : this.pointer].concat(s.unwrappedArgs);
    return wrap(dotnet.callMethod.apply(null, args));
  }
  objdest[memberName+"Async"] = function() {
    var s = typeSignature(memberName, arguments);
    if(!this._methods) this._methods = {};
    if(!this._methods[s.signature]) {
      var mArgs = [this.classPointer, memberName].concat(s.unwrappedArgs);
      this._methods[s.signature] = getobj.apply(null, mArgs);
    }
    var args = [this._methods[s.signature], static ? null : this.pointer].concat(s.unwrappedArgs);
    dotnet.callMethodAsync.apply(null, args);
  }
}

function createProperty(target, typeNative, typeName, memberNative, memberName, static) {
  dotnet.statistics.properties++;
  var objdest = static ? target : target.prototype;
  Object.defineProperty(objdest, memberName, {
    configurable:true,
    enumerable:true,
    get:function() {
      if(!this.props) this.props={};
      if(!this.props[memberName]) {
        this.props[memberName] = static ? 
          dotnet.getStaticPropertyObject(this.classPointer, memberName) : 
          dotnet.getPropertyObject(this.pointer, memberName);
      }
      if(typeof(this.props[memberName]) !== 'undefined' && this.props[memberName] !== null)
        return wrap(dotnet.getProperty(this.props[memberName], static ? null : this.pointer)); 
      else
        return null;
    },
    set:function(e) {
      if(!this.props) this.props={};
      if(!this.props[memberName]) {
        this.props[memberName] = static ? 
          dotnet.getStaticPropertyObject(this.classPointer, memberName) : 
          dotnet.getPropertyObject(this.pointer, memberName);
      }
      dotnet.setProperty(this.props[memberName], static ? null : this.pointer, unwrap(e));
    }
  });
}

/* These are only called on a per class or enum basis, base types of classes and enums
 * are then (as well) lazy loaded as needed.  This should only be called from createClass.
 */
function createMember(target, typeNative, typeName, memberNative, memberName, static) {
  var type = dotnet.execMethod(dotnet.execGetProperty(memberNative, 'MemberType'), 'ToString');
  if(type === "Field") {
    createField(target, typeNative, typeName, memberNative, memberName, static);
  } else if(type === "Method") {
    if(memberName.substring(0,4) != "get_") {
      createMethod(target, typeNative, typeName, memberNative, memberName, static);
    }
  } else if(type === "Property") {
    createProperty(target, typeNative, typeName, memberNative, memberName, static);
  }
}

function createClass(typeNative, typeName) {
  dotnet.statistics.classes++;
  var qualifiedName = dotnet.execGetProperty(typeNative,'AssemblyQualifiedName');
  if(classCache[qualifiedName]) {
    dotnet.statistics.cachehit++;
    return classCache[qualifiedName];
  } else
    dotnet.statistics.cachemiss++;

  var cls = function() {
    var args = [typeNative];
    for(var i=0; i < arguments.length; i++) args.push(unwrap(arguments[i]));
    this.pointer = dotnet.execNew.apply(null,args);
  }

  // These must be available on both the static and instance of the class/object.
  cls.prototype.toString = cls.toString = function() { return (this.pointer ? 'Object ' : 'Class ') + typeName + ''; }
  cls.prototype.inspect = cls.inspect = function() { return '\033[33m CLR ' + this.toString() + '\033[39m'; }
  cls.prototype.addEventListener = cls.addEventListener = function(event, callback) { dotnet.execAddEvent(this.pointer,event,callback); };
  cls.prototype.classPointer = cls.classPointer = typeNative;
  cls.prototype.className = cls.className = typeName;

  // Find all STATIC members.
  var typeEnumerator = dotnet.execMethod(dotnet.getStaticMemberTypes(typeNative),'GetEnumerator');

  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var memberNative = dotnet.execGetProperty(typeEnumerator, 'Current');
    var memberName = dotnet.execGetProperty(memberNative, 'Name');
    createMember(cls, typeNative, typeName, memberNative, memberName, true);
  }

  // Find all INSTANCE members.
  typeEnumerator = dotnet.execMethod(dotnet.getMemberTypes(typeNative),'GetEnumerator');

  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var memberNative = dotnet.execGetProperty(typeEnumerator, 'Current');
    var memberName = dotnet.execGetProperty(memberNative, 'Name');
    createMember(cls, typeNative, typeName, memberNative, memberName, false);
  }

  return classCache[qualifiedName] = cls;
}

/* Entry point for assemblies, all assemblies are loaded in from 
 * the createFromType and ImportOnto functions, they are lazy loaded,
 * meaning they create a way to address the object in javascript but do not
 * actually load the "heavier" information until the class/enum/etc is 
 * used by the user, this costs CPU cycles initially but saves loading all
 * of the meta data from the CLR, initial tests saves 100MB of memory.
 */
function createFromType(nativeType, onto) {
  if(dotnet.execGetProperty(nativeType, "IsPublic")) {
    var name = dotnet.execGetProperty(nativeType,"Name");
    var space = dotnet.execGetProperty(nativeType,"Namespace");
    var info = { onto:onto, type:nativeType, name:name }
    
    if(space) {
      var spl = space.split('.');
      for(var i=0; i < spl.length; i++) {
        if(!info.onto[spl[i]]) info.onto[spl[i]] = {};
        info.onto = info.onto[spl[i]];
      }
    }

    if(dotnet.execGetProperty(nativeType, "IsEnum")) {
      Object.defineProperty(info.onto, name, {
        configurable:true, enumerable:true,
        get:function() { 
          delete this.onto[this.name];
          return this.onto[this.name] = createEnum(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsClass") || dotnet.execGetProperty(nativeType, "IsValueType")) {
      Object.defineProperty(info.onto, name, {
        configurable:true, enumerable:true,
        get:function() {
          delete this.onto[this.name];
          return this.onto[this.name] = createClass(this.type,this.name);
        }.bind(info)
      });
    }
  }
}

/* Import onto the object specified, this takes an assembly, and loads
 * the classes, enums, fields, properties, etc onto the object passed in (onto)
 */
function ImportOnto(assembly, onto) {
  if(assembly.toLowerCase().indexOf('.dll') === -1 && assembly.toLowerCase().indexOf('.exe') === -1) {
    assembly += ".dll";
  }

  var types = dotnet.loadAssembly(assembly);
  var typeEnumerator = dotnet.execMethod(types, "GetEnumerator");

  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var type = dotnet.execGetProperty(typeEnumerator,'Current');
    createFromType(type, onto);
  }
}

function Import (e) {
  if(!assemblyImported[e]) {
    dotnet.statistics.assemblies_miss++;
    ImportOnto(e, process.bridge.dotnet);
  } else {
    dotnet.statistics.assemblies_hit++;
  }
  assemblyImported[e] = true;
};

process.bridge.dotnet.import = Import;
process.bridge.dotnet.Import = Import;

process.bridge.dotnet.importonto = ImportOnto;
process.bridge.dotnet.Importonto = ImportOnto;
process.bridge.dotnet.fromPointer = createJSInstance;
process.bridge.dotnet.import(process.execPath);
