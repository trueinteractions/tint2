if(!process.bridge) process.initbridge();

var dotnet = process.bridge;
var classCache = {};

function unwrap(a) {
  if(a && a.pointer) return a.pointer;
  else if(a && a.classPointer) return a.classPointer;
  else return a;
}

function wrap(b) {
  if(Buffer.isBuffer(b)) {
    return createJSInstance(b);
  } else return b;
}

function createEnum(typeNative) {
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
    obj[ename] = wrap(evalue);
  }
  return obj;
}

function createEvent(target, typeNative, typeName, memberNative, memberName, static) {
  // TODO...
  target[memberName] = function() { console.log('unimplemented: '+typeName+'::'+memberName); }
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
    for(var i=0; i < arguments.length; i++) args.push(unwrap(arguments[i]));
    return wrap(func.apply(null,args));
  }
}

function createProperty(target, typeNative, typeName, memberNative, memberName, static) {
  Object.defineProperty(target, memberName, {
    configurable:true, enumerable:true,
    get:function() { return wrap(dotnet.execGetProperty((static ? this.classPointer : this.pointer), memberName)); },
    set:function(e) { dotnet.execSetProperty((static ? this.classPointer : this.pointer), memberName, unwrap(e)); }
  });
}

function createMember(target, typeNative, typeName, memberNative, memberName, static) {
  var info = { typeNative:typeNative, typeName:typeName, memberNative:memberNative, memberName:memberName, cls:target };
  var memberType = dotnet.execGetProperty(memberNative, 'MemberType');
  var strMemberType = dotnet.execMethod(memberType, 'ToString');
  switch(strMemberType) {
    case 'Event':
      info.exec = createEvent;
      break;
    case 'Field':
      info.exec = createField;
      break;
    case 'Method':
      info.exec = createMethod;
      break;
    case 'Property':
      info.exec = createProperty;
      break;
    default:
      //console.warn('member failed to recognize: '+strMemberType+' on '+typeName+' with: '+memberName);
      break; 
  }
  if(info.exec)
    info.exec(info.cls,info.typeNative,info.typeName,info.memberNative,info.memberName,static);
}

function createJSInstance(pointer) {
  var typeNative = dotnet.getType(pointer);
  var typeName = dotnet.execGetProperty(typeNative, 'Name');
  if(dotnet.execGetProperty(dotnet.getType(typeNative), "IsClass")) {
    var c = createClass(typeNative, typeName);
    var n = function() {
      this.pointer = pointer;
      this.toString = function() { return '[Object: ' + typeName + ' @addr '+this.pointer.inspect()+']'; }
      this.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
    }
    n.prototype = c.prototype;
    n.pointer = n.prototype.pointer = pointer;
    n.classPointer = n.prototype.classPointer = typeNative;
    return new n;
  } else {
    console.warn('Unknown type passed back: ', typeName);
  }
}

function createClass(typeNative, typeName) {
  if(classCache[typeNative.inspect()])
    return classCache[typeNative];

  var cls = function() {
    var args = [typeNative];
    for(var i=0; i < arguments.length; i++)
      args.push(arguments[i]);
    this.pointer = dotnet.execNew.apply(null,args);
    this.toString = function() { return '[Object: ' + typeName + ' @addr '+this.pointer.inspect()+']'; }
    this.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
  }
  cls.toString = function() { return '[Class: ' + typeName + ' @addr '+typeNative.inspect()+']'; }
  cls.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; }
  cls.classPointer = cls.prototype.classPointer = typeNative;
  cls.className = cls.prototype.className = typeName;

  typeEnumerator = dotnet.execMethod(dotnet.getStaticMemberTypes(typeNative),'GetEnumerator');
  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var memberNative = dotnet.execGetProperty(typeEnumerator, 'Current');
    var memberName = dotnet.execGetProperty(memberNative, 'Name');
    createMember(cls, typeNative, typeName, memberNative, memberName, true);
  }

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
    var info = { onto:onto, type:nativeType, name:name }

    if(dotnet.execGetProperty(nativeType, "IsClass")) {
      //onto[name] = createClass(nativeType,name);
      Object.defineProperty(onto, name, {
        configurable:true, enumerable:true,
        get:function() {
          delete this.onto[this.name];
          return this.onto[this.name] = createClass(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsEnum")) {
      //onto[name] = createEnum(nativeType,name);
      Object.defineProperty(onto, name, {
        configurable:true, enumerable:true,
        get:function() { 
          delete this.onto[this.name];
          return this.onto[this.name] = createEnum(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsValueType")) {
      //onto[name] = createClass(nativeType,name);
      Object.defineProperty(onto, name, {
        configurable:true, enumerable:true,
        get:function() {
          delete this.onto[this.name];
          return this.onto[this.name] = createClass(this.type,this.name);
        }.bind(info)
      });
    } else if(dotnet.execGetProperty(nativeType, "IsInterface")) {
    } else if(dotnet.execGetProperty(nativeType, "IsAbstract")) {
    } else {
      //console.warn('The type: '+name+' was not imported or of a known layout.');
    }
  }
}

function Import(assembly, onto) {
  if(assembly.toLowerCase().indexOf('.dll') == -1) assembly += ".dll";

  var types = dotnet.loadAssembly(assembly);
  var typeEnumerator = dotnet.execMethod(types, "GetEnumerator");
  while(dotnet.execMethod(typeEnumerator, "MoveNext")) {
    var type = dotnet.execGetProperty(typeEnumerator,'Current');
    createFromType(type, onto);
  }
}

if(!process.bridge.dotnet) process.bridge.dotnet = {};
process.bridge.dotnet.import = function(e) { Import(e, process.bridge.dotnet); };
process.bridge.dotnet.Import = function(e) { Import(e, process.bridge.dotnet); };