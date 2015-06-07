module.exports = (function() { 
  /*!
   * Module dependencies.
   */
  var core = require('core'),
      method = require('method'),
      ivar = require('ivar'),
      exception = require('exception'),
      classCache = {},
      garbagePreventionCache = {sel:[],func:[]};

  /**
   * The `Class` class is a subclass of `id`. Instances of `Class` wrap an
   * Objective C *"Class"* instance.
   *
   * You can retrieve `Class` instances by getting a reference to a global class
   * (i.e. `$.NSObject`), or by other methods/functions that return `Class`
   * instances normally (i.e. `$.NSClassFromString($('NSObject'))`).
   */
  function Class(pointer) { 
    Function.call(this, pointer);
    this.classPointer = pointer;
    this.pointer = pointer; // TODO: Get rid of this.
    this.isClass = true;
    this.type = '#';
    this.msgCache = [];
  }

  Class.prototype = Object.create(Function.prototype);
  Class.prototype.constructor = Class;

  /**
   * Gets a wrapped Class instance based off the given name.
   * Also takes care of returning a cached version when available.
   *
   * @param {String} className The class name to load.
   * @return {Class} A `Class` instance wrapping the desired Objective C *"Class"*.
   * @api private
   */
  Class.getClassByName = function(className, onto) {
    var rtn = classCache[className];
    var ptrFromClassName = core.objc_getClass(className);
    console.assert(ptrFromClassName !== null && ptrFromClassName.address() !== 0,
      'Class.getClass cannot identify the unidentified class: ',ptrFromClassName, ' pointer:',ptrFromClassName.address());
    rtn = rtn || core.wrapValue(ptrFromClassName, '#');
    rtn.onto = onto || rtn.onto;
    return rtn;
  };

  /** 
   * Adds a protocol to the class instance. returns true if the operation
   * was successful or false if it was not.
   **/
  Class.prototype.addProtocol = function(protocolName) {
    return core.class_addProtocol(this.classPointer, core.objc_getProtocol(protocolName));
  }

  Class.prototype.conformsToProtocol = function(protocolName) {
    return core.class_conformsToProtocol(this.classPointer, core.objc_getProtocol(protocolName));
  }

  /**
   * Creates a subclass of this class with the given name and optionally a
   * number of extra bytes that will be allocated with each instance. The
   * returned `Class` instance should have `addMethod()` and `addIvar()` called on
   * it as needed before use, and then `register()` when you're ready to use it.
   */
  Class.prototype.extend = function(className, extraBytes) {
    var c = core.objc_allocateClassPair(this.classPointer, className, extraBytes || 0);
    if (c.isNull()) {
      throw new Error('New Class could not be allocated: ' + className);
    }
    var rtn = core.wrapValue(c, '#');
    rtn.onto = this.onto;
    return rtn;
  };

  /**
   * Calls objc_registerClassPair() on the class pointer.
   * This must be called on the class *after* all 'addMethod()' and 'addIvar()'
   * calls are made, and *before* the newly created class is used for real.
   */
  Class.prototype.register = function() {
    core.objc_registerClassPair(this.classPointer);
    this.onto[this.getName()] = this;
    return this;
  };

  /**
   * Adds a new Method to the Class as a class method.  This method
   * is only usable on the class, not on its instance (e.g, type +).
   */
  Class.prototype.addClassMethod = function(sel, type, func) {
    return this.addMethod(sel,type,func,core.object_getClass(this.classPointer));
  };

 /**
   * Adds a new Method to the Class. Instances of the class (even already existing
   * ones) will have the ability to invoke the method. This may be called at any
   * time on any class.
   */
  Class.prototype.addMethod = function(sel, type, func, pointerOverride) {
    var ptr = pointerOverride || this.pointer;
    var parsed = core.Types.parse(type);
    var selRef = core.unwrapValue(sel,':');
    var funcPtr = core.createWrapperPointer(func, parsed);

    // flatten the type
    var typeStr = parsed[0] + parsed[1].join('');
    if (!core.class_addMethod(ptr, selRef, funcPtr, typeStr)) {
      throw new Error('method "' + sel + '" was NOT sucessfully added to Class: ' + this.getName());
    }

    // Added to prevent garbage collection, the class is discarded the added methods will be.
    // if these do not exist the the new method will error on execution due to lost callbacks.
    garbagePreventionCache.func.push(funcPtr);
    garbagePreventionCache.sel.push(selRef);
    return this;
  };

  /*!
   * Struct used by msgSend().
   */
  var objc_super = core.Struct({
    'receiver': 'pointer',
    'class': 'pointer'
  });

  /*!
   * The parseArgs() function is used by 'id()' and 'id.super()'.
   * You pass in an Array as the second parameter as a sort of "output variable"
   * It returns the selector that was requested.
   */
  function parseArgs (argv, args) {
    var argc = argv.length;
    var sel;
    if (argc === 1) {
      var arg = argv[0];
      if (typeof arg === 'string') {
        // selector with no arguments
        sel = arg;
      } else {
        // legacy API: an Object was passed in
        sel = [];
        Object.keys(arg).forEach(function (s) {
          sel.push(s);
          args.push(arg[s]);
        });
        sel.push('');
        sel = sel.join(':');
      }
    } else {
      // varargs API
      sel = [];
      for (var i=0; i<argc; i+=2) {
        sel.push(argv[i]);
        args.push(argv[i+1]);
      }
      sel.push('');
      sel = sel.join(':');
    }
    return sel;
  }

  /**
   * A very important function that *does the message sending* between
   * Objective-C objects. When you do `array('addObject', anObject)`, this
   * `msgSend` function is the one that finally gets called to do the dirty work.
   *
   * This function accepts a String selector as the first argument, and an Array
   * of (wrapped) values that get passed to the the message. This function takes
   * care of unwrapping the passed in arguments and wrapping up the result value,
   * if necessary.
   */
  Class.prototype.msgSend = function(fargs, supre) {
    var struct = [],
        args = [this,parseArgs(fargs, struct)].concat(struct),
        sel = args[1],
        types = this.getTypes(args[1], args.slice(2)),
        funcptr = core.objc_msgSend;

    console.assert(sel, 'Selector passed in was empty.');

    if(supre) { 
      args[0] = new objc_super({receiver: this.pointer, class: this.getSuperclass().pointer}).ref();
      types[1][0] = '?';
      funcptr = core.objc_msgSendSuper;
    }

    if((struct = core.Types.getStruct(types[0])) && struct.size > 16) 
    {
      struct = new struct();
      types[0] = 'v';
      types[1].unshift('?');
      args.unshift(struct.ref());
      funcptr = supre ? core.objc_msgSendSuper_stret : core.objc_msgSend_stret;
    } else {
      struct = null;
    }

    sel += funcptr.address();
    this.msgCache[sel] = this.msgCache[sel] || core.createUnwrapperFunction(funcptr,types);

    try {
      sel = (this.msgCache[sel]).apply(null, args);
      return struct || sel;
    } catch (e) {
      if (!e.hasOwnProperty('stack')) {
        throw exception(e);
      } else {
        throw e;
      }
    }
  };

  /**
   * Like regular message sending, but invokes the method implementation on the
   * object's "superclass" instead. This is the equivalent of what happens when the
   * Objective-C compiler encounters the `super` keyword:
   *
   * ``` objectivec
   * self = [super init];
   * ```
   *
   * To do the equivalent using NodObjC you call `super()`, as shown here:
   *
   * ``` js
   * self = self.super('init')
   * ```
   */
  Class.prototype.super = function() {
    return this.msgSend(arguments, true);
  };

  /**
   * Adds an Ivar to the Class. Instances of the class will contain the specified
   * instance variable. This MUST be called after .extend() but BEFORE .register()
   */
  Class.prototype.addIvar = function(name, type, size, alignment) {
    if (!size) {
      // Lookup the size of the type when needed
      var ffiType = core.Types.map(type);
      size = core.REF.sizeof[ffiType]; 
    }
    // Also set the alignment when needed. This formula is from Apple's docs:
    //   For variables of any pointer type, pass log2(sizeof(pointer_type)).
    alignment = alignment || ( Math.log(size) / Math.log(2) );
    if (!core.class_addIvar(this.classPointer, name, size, alignment, type)) {
      throw new Error('ivar "' + name + '" was NOT sucessfully added to Class: ' + this.getName());
    }
    return this;
  };

  /* Proxy methods */
  Class.prototype.getName = function() { return core.class_getName(this.classPointer); };
  Class.prototype.isMetaClass = function() { return !!core.class_isMetaClass(this.classPointer); };
  Class.prototype.getInstanceSize = function() { return core.class_getInstanceSize(this.classPointer); };
  Class.prototype.getIvarLayout = function() { return core.class_getIvarLayout(this.classPointer); };
  Class.prototype.getVersion = function() { return core.class_getVersion(this.classPointer); };
  Class.prototype.setVersion = function(v) { return core.class_setVersion(this.classPointer, v); };
  Class.prototype.setSuperclass = function(superclass) { return core.wrapValue(core.class_setSuperclass(this.classPointer, superclass.pointer), '#'); };
  Class.prototype.getInstanceVariable = function(name) { return ivar.wrap(core.class_getInstanceVariable(this.classPointer, name)); };
  Class.prototype.getClassVariable = function(name) { return ivar.wrap(core.class_getClassVariable(this.classPointer, name)); };
  Class.prototype.getInstanceMethod = function(sel) { return method.wrap(core.class_getInstanceMethod(this.classPointer, core.unwrapValue(sel,':'))); };
  Class.prototype.getClassMethod = function(sel) { return method.wrap(core.class_getClassMethod(this.classPointer, core.unwrapValue(sel, ':'))); };
  Class.prototype.getInstanceVariables = function() { return core.copyIvarList(this.classPointer); };
  Class.prototype.getInstanceMethods = function() { return core.copyMethodList(this.classPointer); };

  /**
   * Accepts a SEL and queries the current object for the return type and
   * argument types for the given selector. If current object does not implment
   * that selector, then check the superclass, and repeat recursively until
   * a subclass that responds to the selector is found, or until the base class
   * is found.
   *
   * @api private
   */
  Class.prototype.getTypes = function(sel, args) {
    var method = this['get'+(this.isClass ? 'Class' : 'Instance')+'Method'](sel);
    var t = method ? method.getTypes() : null;
    if (!t) {
      // Unknown selector being send to object. This *may* still be valid, we
      // assume all args are type 'id' and return is 'id'.
      t = [ '@', [ '@', ':', ].concat(args.map(function () { return '@' })) ];
    }

    return t;
  };

  /**
   * Get's a Class instance's superclass. If the current class is a base class,
   * then this will return null.
   */
  Class.prototype.getSuperclass = function() {
    var superclassPointer = core.class_getSuperclass(this.classPointer);
    if (superclassPointer.isNull()) {
      return null;
    }
    return core.wrapValue(superclassPointer,'#');
  };

 /**
   * Returns an Array of Strings of the names of methods that the current object
   * will respond to. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` number argument.
   */
  Class.prototype.methods = function(maxDepth, sort) {
    var rtn=[], c=this, md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      console.assert(c.classPointer, 'class pointer is undefined. ',c.classPointer);
      var ms=core.copyMethodList(c.classPointer); 
      var i=ms.length;
      while (i--) {
        if (!~rtn.indexOf(ms[i])) {
          rtn.push(ms[i]);
        }
      }
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  };

  /**
   * Retrieves the wrapped Class instance for an ID (instance or object).  
   * If getClass is ran on a Class object it returns the meta-class for the 
   * class. (Equivelant to [$.MyClass class]). The meta-class is necessary when
   * implementing an abstract class or using $.NSObject class methods.
   * @api public
   */
  Class.prototype.getClass = function() { 
    var rtn = core.object_getClass(this.pointer);
    console.assert(rtn !== 0 && rtn.address() !== 0, 'ID.getClass had empty pointer', rtn, rtn.address());
    return core.wrapValue(rtn, '#'); 
  };

  /*!
   * toString() override.
   */
  Class.prototype.toString = function() { return '[Class' + (this.isMetaClass() ? ' *' : '') +  ': ' + this.getName() + ']'; };

  // yellow
  Class.prototype.inspect = function() { return '\033[33m' + this.toString() + '\033[39m'; };

  return Class;
})();