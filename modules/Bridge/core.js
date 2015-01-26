module.exports = (function() {
  /**
   * This 'core' module is the `libffi` wrapper. All required native
   * functionality is instantiated and then exported in this module.
   *
   * ### References:
   *
   *   * [Objective-C Runtime Reference](http://developer.apple.com/library/mac/#documentation/Cocoa/Reference/ObjCRuntimeRef/Reference/reference.html)
   */

  /*!
   * Module dependencies.
   */

  var ref = require('ref')
    , ffi = require('ffi')
    , types = require('types')
    , struct = require('struct')
    , uintptr_t = ref.sizeof.pointer === 8 ? 'uint64' : 'uint32' // 'uintptr_t' isn't natively supported by node-ffi
    , libc = new ffi.Library('libc', {
        malloc: [ 'void*', [ 'size_t' ] ]
      , free: [ 'void', [ 'void*' ] ]
    })
    , free = libc.free
    , objc = new ffi.Library('libobjc', {
        class_addIvar: [ 'uint8', [ 'pointer', 'string', 'size_t', 'uint8', 'string' ] ]
      , class_addMethod: [ 'uint8', [ 'pointer', 'pointer', 'pointer', 'string' ] ]
      , class_addProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
      , class_copyIvarList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyMethodList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getClassMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getClassVariable: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getInstanceMethod: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_getInstanceSize: [ 'size_t', [ 'pointer' ] ]
      , class_getInstanceVariable: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getIvarLayout: [ 'string', [ 'pointer' ] ]
      , class_getName: [ 'string', [ 'pointer' ] ]
      , class_getProperty: [ 'pointer', [ 'pointer', 'string' ] ]
      , class_getSuperclass: [ 'pointer', [ 'pointer' ] ]
      , class_getVersion: [ 'int32', [ 'pointer' ] ]
      , class_getWeakIvarLayout: [ 'string', [ 'pointer' ] ]
      , class_isMetaClass: [ 'uint8', [ 'pointer' ] ]
      , class_setIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
      , class_setSuperclass: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , class_setVersion: [ 'void', [ 'pointer', 'int32' ] ]
      , class_setWeakIvarLayout: [ 'void', [ 'pointer', 'string' ] ]
      , ivar_getName: [ 'string', [ 'pointer' ] ]
      , ivar_getOffset: [ 'int32', [ 'pointer' ] ]
      , ivar_getTypeEncoding: [ 'string', [ 'pointer' ] ]
      , method_copyArgumentType: [ 'pointer', [ 'pointer', 'uint32' ] ]
      , method_copyReturnType: [ 'pointer', [ 'pointer' ] ]
      , method_exchangeImplementations: [ 'void', [ 'pointer', 'pointer' ] ]
      , method_getImplementation: [ 'pointer', [ 'pointer' ] ]
      , method_getName: [ 'pointer', [ 'pointer' ] ]
      , method_getNumberOfArguments: [ 'uint32', [ 'pointer' ] ]
      , method_getTypeEncoding: [ 'string', [ 'pointer' ] ]
      , method_setImplementation: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , objc_allocateClassPair: [ 'pointer', [ 'pointer', 'string', 'size_t' ] ]
      , objc_copyProtocolList: [ 'pointer', [ 'pointer' ] ]
      , objc_getAssociatedObject: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , objc_getClass: [ 'pointer', [ 'string' ] ]
      , objc_getClassList: [ 'int32', [ 'pointer', 'int32' ] ]
      , objc_getProtocol: [ 'pointer', [ 'string' ] ]
      , objc_registerClassPair: [ 'void', [ 'pointer' ] ]
      , objc_removeAssociatedObjects: [ 'void', [ 'pointer' ] ]
      , objc_setAssociatedObject: [ 'void', [ 'pointer', 'pointer', 'pointer', uintptr_t ] ]
      , object_getClass: [ 'pointer', [ 'pointer' ] ]
      , object_getClassName: [ 'string', [ 'pointer' ] ]
      , object_getInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
      , object_getIvar: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , object_setClass: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , object_setInstanceVariable: [ 'pointer', [ 'pointer', 'string', 'pointer' ] ]
      , object_setIvar: [ 'void', [ 'pointer', 'pointer', 'pointer' ] ]
      , property_getAttributes: [ 'string', [ 'pointer' ] ]
      , property_getName: [ 'string', [ 'pointer' ] ]
      , protocol_conformsToProtocol: [ 'uint8', [ 'pointer', 'pointer' ] ]
      , protocol_copyMethodDescriptionList: [ 'pointer', [ 'pointer', 'uint8', 'uint8', 'pointer' ] ]
      , protocol_copyPropertyList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , protocol_copyProtocolList: [ 'pointer', [ 'pointer', 'pointer' ] ]
      , protocol_getMethodDescription: [ 'pointer', [ 'pointer', 'pointer', 'uint8', 'uint8' ] ]
      , protocol_getName: [ 'string', [ 'pointer' ] ]
      , protocol_getProperty: [ 'pointer', [ 'pointer', 'string', 'uint8', 'uint8' ] ]
      , sel_getName: [ 'string', [ 'pointer' ] ]
      , sel_registerName: [ 'pointer', [ 'string' ] ]
    })
    , selCache = {};
      objc.objc_msgSend = ffi.DynamicLibrary().get('objc_msgSend')
    , objc.objc_msgSend_stret = ffi.DynamicLibrary().get('objc_msgSend_stret')
    , objc.objc_msgSendSuper = ffi.DynamicLibrary().get('objc_msgSendSuper')
    , objc.objc_msgSendSuper_stret = ffi.DynamicLibrary().get('objc_msgSendSuper_stret');


  /**
   * Convenience wrapper around loading dynamic libraries. 
   */
  function dlopen (path) {
    return new ffi.DynamicLibrary(path)
  }

  /**
   * Convienience function to return an Array of Strings of the names of every
   * class currently in the runtime. This gets used at the during the import
   * process get a name of the new classes that have been loaded.
   * TODO: Could be replaced with a native binding someday for speed. Not overly
   *       important as this function is only called during import()
   */
  function getClassList () {
    // First get just the count
    var num = objc.objc_getClassList(null, 0), rtn = [];
    if (num > 0) {
      var c = null;
      var classes = new Buffer(ref.sizeof.pointer * num);

      objc.objc_getClassList(classes, num);

      for (var i=0; i<num; i++) {
        c = classes.readPointer(i * ref.sizeof.pointer);
        rtn.push(objc.class_getName(c));
      }
      // free() not needed since ffi allocated the buffer, and will free() with V8's GC
    }
    return rtn;
  }

  /**
   * Copies and returns an Array of the instance variables defined by a given
   * Class pointer. To get class variables, call this function on a metaclass.
   */
  function copyIvarList (classPtr) {
    var rtn = []
      , count = ref.alloc('uint')
      , ivars = objc.class_copyIvarList(classPtr, count);
      count = count.deref();
    for (var i=0; i<count; i++) 
      rtn.push(objc.ivar_getName(ivars.readPointer(i * ref.sizeof.pointer)));

    free(ivars);
    return rtn;
  }

  /**
   * Copies and returns an Array of the instance methods the given Class pointer
   * implements. To get class methods, call this function with a metaclass.
   */
  function copyMethodList (classPtr) {
    var numMethods = ref.alloc('uint')
      , rtn = []
      , methods = objc.class_copyMethodList(classPtr, numMethods)
      , count = numMethods.deref();

    for (var i=0; i<count; i++)
      rtn.push(wrapValue(objc.method_getName(methods.readPointer(i * ref.sizeof.pointer)),':'));
    
    free(methods);
    return rtn;
  }

  /**
   * Convienience function to get the String return type of a Method pointer.
   * Takes care of free()ing the returned pointer, as is required.
   */
  function getMethodReturnType (method) {
    return getStringAndFree(objc.method_copyReturnType(method));
  }

  /**
   * Gets a cstring from the pointer and free's the memory 
   */ 
  function getStringAndFree (ptr) {
    var str = ptr.readCString();
    free(ptr);
    return str;
  }

  /**
   * Wraps up a node-ffi pointer if needed (not needed for Numbers, etc.)
   */
  function wrapValue (val, type) {
    var basetype = type.type ? type.type : type;
    if(basetype === '@' || basetype === '#') return createObject(val, basetype);
    else if (basetype === '@?') return createObject(createBlock(val, '@'));
    else if (basetype === '^?') return createUnwrapperFunction(val, type);
    else if (basetype === ':') return objc.sel_getName(val);
    else if (basetype === 'B') return val ? true : false;
    else if (basetype === 'c' && val === 1) return true;
    else if (basetype === 'c' && val === 0) return false;
    else return val;
  }

  /**
   * Accepts an Array of raw objc pointers and other values, and an array of ObjC
   * types, and returns an array of wrapped values where appropriate.
   */
  function wrapValues (values, objtypes) {
    var result = [];
    for(var i=0; i < objtypes.length; i++) result.push(wrapValue(values[i], objtypes[i]));
    return result;
  }

  /**
   * Unwraps a previously wrapped NodObjC object.
   */
  function unwrapValue (val, type) {
    var basetype = type.type ? type.type : type;
    if (basetype === '@?') return createBlock(val, basetype);
    else if (basetype === '^?') return createWrapperPointer(val, type);
    else if (basetype === '@' || basetype === '#') {
      if(Buffer.isBuffer(val)) return val;
      return val ? val.pointer : null;
    }
    else if (basetype === ':') return selCache[val] || (selCache[val] = objc.sel_registerName(val));
    else if (val === true) return 1;
    else if (val === false) return 0;
    else return val;
  }

  /**
   * Accepts an Array of wrapped NodObjC objects and other values, and an array
   * of their cooresponding ObjC types, and returns an array of unwrapped values.
   */
  function unwrapValues (values, objtypes) {
    var result = [];
    for(var i=0; i < objtypes.length; i++) result.push(unwrapValue(values[i], objtypes[i]));
    return result;
  }

  /**
   * Represents a wrapped `IMP` (a.k.a. method implementation). `IMP`s are function pointers for methods. The first two arguments are always:
   *
   *   1. `self` - The object instance the method is being called on.
   *   2. `_cmd` - The `SEL` selector of the method being invoked.
   *
   * Any additional arguments that get passed are the actual arguments that get
   * passed along to the method.
   */

  /**
   * Creates an ffi Function Pointer to the passed in 'func' Function. The
   * function gets wrapped in an "wrapper" function, which wraps the passed in
   * arguments, and unwraps the return value.
   *
   * @param {Function} A JS function to be converted to an ffi C function.
   * @param {Object|Array} A "type" object or Array containing the 'retval' and
   *                       'args' for the Function.
   * @api private
   */
  function createWrapperPointer (func, type) {
    var argTypes = type.args || type[1] || [];
    var rtnType = type.retval || type[0] || 'v';

    if (func.pointer) return func.pointer;
    return new ffi.Callback(types.map(rtnType), types.mapArray(argTypes), function() {
      return unwrapValue(func.apply(null, wrapValues(arguments, argTypes)), rtnType);              
    });
  }

  /**
   * Creates a JS Function from the passed in function pointer. When the returned
   * function is invoked, the passed in arguments are unwrapped before being
   * passed to the native function, and the return value is wrapped up before
   * being returned for real.
   *
   * @param {Pointer} The function pointer to create an unwrapper function around
   * @param {Object|Array} A "type" object or Array containing the 'retval' and
   *                       'args' for the Function.
   * @api private
   */
  function createUnwrapperFunction (funcPtr, type, isVariadic) {
    var rtnType = type.retval || type[0] || 'v';
    var argTypes = type.args || type[1] || [];
    var unwrapper;

    if(isVariadic) {
      var varFunc = ffi.VariadicForeignFunction(funcPtr, types.map(rtnType), types.mapArray(argTypes));
      unwrapper = function() {
        var newtypes = [];
        // Detect the types coming in, make sure to ignore previously defined baseTypes,
        // garner a list of these then send the function through the normal exec.
        // The types system in objc, should probably be cleaned up considerably. This is
        // somewhat faulty but since 95% of objects coming through are mostly ID/Class
        // it works, we may have issues for function pointers/etc. 
        for(var i=argTypes.length; i < arguments.length; i++) {
          if(arguments[i].type) newtypes.push(arguments[i].type)
          else if(arguments[i].pointer) newtypes.push('@');
          else if(typeof arguments[i] === 'function') newtypes.push('@?');
          else if(typeof arguments[i] === 'string') newtypes.push('r*');
          else if(typeof arguments[i] === 'number') newtypes.push('d');
          else newtypes.push('?');
        }
        return wrapValue(varFunc
                          .apply(null, types.mapArray(newtypes))
                          .apply(null, unwrapValues(arguments,argTypes.concat(newtypes))),
                        rtnType);
      };
    } else {
      var tmpFunc = ffi.ForeignFunction(funcPtr, types.map(rtnType), types.mapArray(argTypes));
      unwrapper = function() {
        return wrapValue(tmpFunc.apply(null, unwrapValues(arguments, argTypes)), rtnType);
      }
    }
    unwrapper.retval = rtnType;
    unwrapper.args = argTypes;
    unwrapper.pointer = funcPtr;
    return unwrapper;
  }

  /**
   * We have to simulate what the llvm compiler does when it encounters a Block
   * literal expression (see `Block-ABI-Apple.txt` above).
   * The "block literal" is the struct type for each Block instance.
   */
  var __block_literal_1 = struct({
    isa: 'pointer',
    flags: 'int32',
    reserved: 'int32',
    invoke: 'pointer',
    descriptor: 'pointer'
  });

  /**
   * The "block descriptor" is a static singleton struct. Probably used in more
   * complex Block scenarios involving actual closure variables needing storage
   * (in `NodObjC`, JavaScript closures are leveraged instead).
   */
  var __block_descriptor_1 = struct({
    reserved: 'ulonglong',
    Block_size: 'ulonglong'
  });
  // The class of the block instances; lazy-loaded
  var BD = new __block_descriptor_1();
  BD.reserved = 0;
  BD.Block_size = __block_literal_1.size;
  var CGB;

  /**
   * Creates a C block instance from a JS Function.
   * Blocks are regular Objective-C objects in Obj-C, and can be sent messages;
   * thus Block instances need are creted using the core.wrapId() function.
   *
   * @api private
   */
  function createBlock (func, type) {
    if (!func) return null;
    else if (func.pointer) return func.pointer;
    var bl = new __block_literal_1;
    // Set the class of the instance
    bl.isa = CGB || (CGB = dlopen().get('_NSConcreteGlobalBlock'));
    // Global flags
    bl.flags = 1 << 29;
    bl.reserved = 0;
    bl.invoke = createWrapperPointer(func, type);
    bl.descriptor = BD.ref();
    return bl.ref();
  }

  /**
   * Creates an ID or Class depending on the encoded type, stores and
   * manages cache for classes as well, this also wraps objects to 
   * create the objc(sel) type interface in JS.
   *
   * @api private
   */
  function createObject (val, type) {
    if(val.isNull && val.isNull()) return null;

    var cache = objc.objc_getAssociatedObject(val, objc.objcStorageKey);
    if(!cache.isNull()) return cache.readObject(0);

    var wrappedObj = (type === '@') ? new (require('id'))(val) 
                                   : new (require('class'))(val);

    var rtn = function() {  return wrappedObj.msgSend(arguments,false); }
    rtn.__proto__ = wrappedObj;

    if(type === '#') {
      var refn = new ref.alloc('Object');
      refn.free = false;
      refn.writeObject(rtn, 0);
      objc.objc_setAssociatedObject(val, objc.objcStorageKey, refn, 0);  
    }
    return rtn;
  }

  /*!
   * Module exports.
   */
  objc.createBlock = createBlock;
  objc.createUnwrapperFunction = createUnwrapperFunction;
  objc.createWrapperPointer = createWrapperPointer;
  objc.Struct = struct;
  objc.Callback = ffi.Callback;
  objc.ForeignFunction = ffi.ForeignFunction;
  objc.Types = types;
  objc.REF = ref;
  objc.dlopen = dlopen;
  objc.getClassList = getClassList;
  objc.copyIvarList = copyIvarList;
  objc.copyMethodList = copyMethodList;
  objc.getMethodReturnType = getMethodReturnType;
  objc.getStringAndFree = getStringAndFree;
  objc.wrapValue = wrapValue;
  objc.wrapValues = wrapValues;
  objc.unwrapValues = unwrapValues;
  objc.unwrapValue = unwrapValue;
  objc.objcStorageKey = new Buffer(1);
  objc.__block_literal_1 = __block_literal_1;
  objc.__block_descriptor_1 = __block_descriptor_1;
  return objc;
})();