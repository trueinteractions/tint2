if(typeof(process.bridge) == 'undefined') process.initbridge();
if(typeof(process.bridge.dotnet) == 'undefined') process.bridge.dotnet = {};
if(typeof(process.bridge.ref) == 'undefined') process.bridge.ref = require('ref');
if(typeof(process.bridge.struct) == 'undefined') process.bridge.struct = require('struct');
if(typeof(process.bridge.ffi) == 'undefined') process.bridge.ffi = require('ffi');
if(typeof(process.bridge.win32) == 'undefined') process.bridge.win32 = require('win32');

var dotnet = process.bridge;
var assemblyImported = {};
var classCache = {};

function unwrap(a) {
  if(a && a.pointer)            // Return instance
    return a.pointer;
  else if(a && a.classPointer)  // Return the class
    return a.classPointer;
  else 
    return a;                   // "Other" type (enum, const)
}

function unwrapValues(e) {
  if(Array.isArray(e)) {
    var unwrapped = [];
    for(var i=0; i < types.length; i++)
      unwrapped[i] = unwrap(types[i]);
    return unwrapped;
  } else
    return unwrap(e);
}

function wrap(b) {
  if(Buffer.isBuffer(b)) {      // Either an instance/class
    return createJSInstance(b);
  } else 
    return b;                   // "Other" type (enum, const)
}

/* The proto class is a "non sealed" class that can be used
 * to create new classes in dotnet, it's just a weak object
 * that shortens the API */
function ProtoClass(name, base) {
  this.pointer = dotnet.classCreate(name,unwrap(base),[],[]);

  this.addConstructor = function(public, types, callback) {
    public = public ? "public" : "private";
    dotnet.classAddConstructor(this.pointer,public,unwrapValues(types),callback);
  };

  this.addMethod = function(name, static, public, override, retType, types, callback) {
    public = public ? "public" : "private";
    dotnet.classAddMethod(this.pointer,name,public,static,override,unwrapValues(retType),unwrapValues(types),callback);
  };

  this.addProperty = function(name, static, public, readOnly, propType, value) {
    public = public ? "public" : "private";
    dotnet.classAddMethod(this.pointer,name,public,static,readOnly,unwrap(propType),unwrap(value));
  };

  this.addField = function(name, static, public, readOnly, propType, value) {
    public = public ? "public" : "private";
    dotnet.classAddMethod(this.pointer,name,public,static,readOnly,unwrap(propType),unwrap(value));
  };

  this.register = function() {
    return dotnet.classRegister(this.pointer);
  }
}

function createEnum(typeNative, memberName) {
  var names = dotnet.execMethod(typeNative,"GetEnumNames");
  var values = dotnet.execMethod(typeNative,"GetEnumValues");
  var nameEnumerator = dotnet.execMethod(names, "GetEnumerator");
  var valueEnumerator = dotnet.execMethod(values, "GetEnumerator");
  var obj = {};
  while(dotnet.execMethod(nameEnumerator,'MoveNext') && 
        dotnet.execMethod(valueEnumerator, 'MoveNext'))
  {
    var ename = dotnet.execGetProperty(nameEnumerator, 'Current');
    var evalue = dotnet.execGetProperty(valueEnumerator, 'Current');
    obj[ename] = evalue;
  }
  return obj;
}

function createEvent(target, typeNative, typeName, memberNative, memberName, static) {
  if(!target.acceptedEvents) target.acceptedEvents = [];
  target.acceptedEvents.push(memberName);
  
  if(!target.addEventListener || typeof(target.addEventListener) == 'undefined') 
  {
    target.addEventListener = function(event, callback) {
      if(!target.events) target.events = {};
      if(!target.events[event]) target.events[event] = [];
      target.events[event].push(callback);
      dotnet.execAddEvent(this.pointer,event,callback);
    };
  }
}

function createField(target, typeNative, typeName, memberNative, memberName, static) {
  Object.defineProperty(target, memberName, {
    configurable:true,
    enumerable:true,
      get:function() { return wrap(dotnet.execGetField((static ? this.classPointer : this.pointer), memberName)); },
      set:function(e) { dotnet.execSetField((static ? this.classPointer : this.pointer),memberName,unwrap(e)); }
    });
}

function createMethod(target, typeNative, typeName, memberNative, memberName, static) {
  target[memberName] = function() {
    var pointer = static ? this.classPointer : this.pointer;
    var func = static ? dotnet.execStaticMethod : dotnet.execMethod;
    var args = [pointer, memberName];
    
    for(var i=0; i < arguments.length; i++)
      args.push(unwrap(arguments[i]));
    
    return wrap(func.apply(null,args));
  }
}

function createProperty(target, typeNative, typeName, memberNative, memberName, static) {
  Object.defineProperty(target, memberName, {
    configurable:true, 
    enumerable:true,
    get:function() {
      if(static)
        return wrap(dotnet.execGetStaticProperty(this.classPointer, memberName));
      else
        return wrap(dotnet.execGetProperty(this.pointer, memberName)); 
    },
    set:function(e) { dotnet.execSetProperty((static ? this.classPointer : this.pointer), memberName, unwrap(e)); }
  });
}

function createMember(target, typeNative, typeName, memberNative, memberName, static) {
  var info = { typeNative:typeNative, typeName:typeName, memberNative:memberNative, memberName:memberName, cls:target };
  var memberType = dotnet.execGetProperty(memberNative, 'MemberType');
  var strMemberType = dotnet.execMethod(memberType, 'ToString');
  
  if(strMemberType == 'Event') info.exec = createEvent;
  else if (strMemberType == 'Field') info.exec = createField;
  else if (strMemberType == 'Method') info.exec = createMethod;
  else if (strMemberType == 'Property') info.exec = createProperty;
  else if (strMemberType == 'Constructor') ; // already delt with.
  else console.warn("Unknown type: "+strMemberType);

  if(info.exec)
    info.exec(info.cls, info.typeNative, info.typeName, info.memberNative, info.memberName, static);
}

function createJSInstance(pointer) {
  var typeNative = dotnet.getCLRType(pointer);
  var typeName = dotnet.execGetProperty(typeNative, 'Name');

  if(dotnet.execGetProperty(typeNative, "IsClass") || dotnet.execGetProperty(typeNative, "IsValueType")) {
    var c = createClass(typeNative, typeName);
    var n = function() {
      this.pointer = pointer;
      this.toString = function() { return '[Object: ' + typeName + ' @addr '+this.pointer.inspect()+']'; }
      this.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
    }
    n.extend = function(name) { return new ProtoClass(name,typeNative); }
    n.prototype = c.prototype;
    n.pointer = n.prototype.pointer = pointer;
    n.classPointer = n.prototype.classPointer = typeNative;
    return new n;
  }
}

function createClass(typeNative, typeName) {
  if(classCache[typeNative.inspect()])
    return classCache[typeNative];

  var cls = function() {
    var args = [typeNative];
    for(var i=0; i < arguments.length; i++)
      args.push(unwrap(arguments[i]));
    this.pointer = dotnet.execNew.apply(null,args);
    this.toString = function() { return '[Object: ' + typeName + ' @addr '+this.pointer.inspect()+']'; }
    this.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
  }

  cls.extend = function(name) { return new ProtoClass(name,this.classPointer); }
  cls.toString = function() { return '[Class: ' + typeName + ' @addr '+typeNative.inspect()+']'; }
  cls.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
  cls.classPointer = cls.prototype.classPointer = typeNative;
  cls.className = cls.prototype.className = typeName;

  // Find all STATIC members.
  typeEnumerator = dotnet.execMethod(dotnet.getStaticMemberTypes(typeNative),'GetEnumerator');

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
    createMember(cls.prototype, typeNative, typeName, memberNative, memberName, false);
  }

  return classCache[typeNative.inspect()] = cls;
}

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

    if(dotnet.execGetProperty(nativeType, "IsClass")) {
      Object.defineProperty(info.onto, name, {
        configurable:true, enumerable:true,
        get:function() {
          delete this.onto[this.name];
          return this.onto[this.name] = createClass(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsEnum")) {
      Object.defineProperty(info.onto, name, {
        configurable:true, enumerable:true,
        get:function() { 
          delete this.onto[this.name];
          return this.onto[this.name] = createEnum(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsValueType")) {
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

function ImportOnto(assembly, onto) {
  if(assembly.toLowerCase().indexOf('.dll') == -1) assembly += ".dll";

  var types = dotnet.loadAssembly(assembly);
  var typeEnumerator = dotnet.execMethod(types, "GetEnumerator");

  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var type = dotnet.execGetProperty(typeEnumerator,'Current');
    createFromType(type, onto);
  }
}

function Import (e) {
  if(!assemblyImported[e])
    ImportOnto(e, process.bridge.dotnet);
  assemblyImported[e] = true;
};

process.bridge.dotnet.import = Import;
process.bridge.dotnet.Import = Import;

process.bridge.dotnet.importonto = ImportOnto;
process.bridge.dotnet.Importonto = ImportOnto;
