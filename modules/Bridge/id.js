module.exports = (function() {

  /*!
   * Module dependencies.
   */

  var core  = require('core'),
      Class = require('class');

  /**
   * The 'id' function is essentially the "base class" for all Objective-C
   * objects that get passed around JS-land.
   */
  function ID(pointer, classPointer) {
    var objClass = core.object_getClass(pointer);

    // This is absolutely necessary, otherwise we'll seg fault if a user passes in a simple type or specifies
    // an object on a class that takes a simple type.
    //if(objClass.isNull() || !objClass) {
    //  throw new TypeError('An abstract class or delegate implemented a method that takes an ID (object),\n'+
    //                    'but a simple type or structure (such as NSRect) was passed in, check the types used.\n'+
    //                      'pointer:' + pointer.inspect() + ' objClass: ' + objClass.inspect());
    //}
    
    if(!classPointer) {
      Class.call(this, objClass);
    } else {
      Class.call(this, classPointer);
    }
    this.pointer = pointer;
    this.isClass = false;
    this.type = '@';
  }
  ID.prototype = Object.create(Class.prototype);
  ID.prototype.constructor = ID;

  /**
   * Calls 'object_getClassName()' on this object.
   *
   * @return {String} The class name as a String.
   * @api public
   */
  ID.prototype.getClassName = function() { return core.object_getClassName(this.pointer); };

  /**
   * Dynamically changes the object's Class.
   */
  //TODO: Decouple this...
  ID.prototype.setClass = function(newClass) { return core.wrapValue(core.object_setClass(this.pointer, newClass.pointer),'@'); };

  /**
   * Walks up the inheritance chain and returns an Array of Strings of
   * superclasses.
   */
  ID.prototype.ancestors = function() {
    var rtn=[], c=this.getClass();
    while (c) {
      rtn.push(c.getName());
      c = c.getSuperclass();
    }
    return rtn;
  };

  /**
   * Getter/setter function for instance variables (ivars) of the object,
   * If just a name is passed in, then this function gets the ivar current value.
   * If a name and a new value are passed in, then this function sets the ivar.
   */
  ID.prototype.ivar = function(name, value) {
    // TODO: Add support for passing in a wrapped Ivar instance as the `name`
    if (arguments.length > 1) {
      // setter
      var ivars = this.isClass ? this.getClassVariable(name) : this.getClass().getInstanceVariable(name);
      var unwrapped = core.unwrapValue(value, ivars.getTypeEncoding());
      return core.object_setIvar(this.pointer, ivars.pointer, unwrapped);
    } else {
      var ptr = new Buffer(core.REF.sizeof.pointer);
      var ivar = core.object_getInstanceVariable(this.pointer, name, ptr);
      return core.wrapValue(ptr.readPointer(0), core.ivar_getTypeEncoding(ivar));
    }
  };

  function ivars_methods_rep(type, maxDepth, sort) {
    var rtn=[], c=this.getClass(), md=maxDepth || 1, depth=0;
    while (c && depth++ < md) {
      var is=c['getInstanceVariables'](), i=is.length;
      while (i--) {
        if (rtn.indexOf(is[i]) === -1) {
          rtn.push(is[i]);
        }
      }
      c = c.getSuperclass();
    }
    return sort === false ? rtn : rtn.sort();
  }

  /**
   * Returns an Array of Strings of the names of the ivars that the current object
   * contains. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` argument.
   */
  ID.prototype.ivars = function(maxDepth, sort) {
    return ivars_methods_rep('getInstanceVariables', maxDepth, sort);
  };

  /**
   * Returns an Array of Strings of the names of methods that the current object
   * will respond to. This function can iterate through the object's superclasses
   * recursively, if you specify a `maxDepth` number argument.
   */
  ID.prototype.methods = function(maxDepth, sort) {
    return ivars_methods_rep('getInstanceMethods', maxDepth, sort);
  };

  /**
   * Returns a **node-ffi** pointer pointing to this object. This is a convenience
   * function for methods that take pointers to objects (i.e. `NSError**`).
   *
   * @return {Pointer} A pointer to this object.
   */
  ID.prototype.ref = function() { return this.pointer.ref(); };

  /**
   * The overidden `toString()` function proxies up to the real Objective-C object's
   * `description` method. In Objective-C, this is equivalent to:
   *
   * ``` objectivec
   * [[id description] UTF8String]
   * ```
   */
  ID.prototype.toString = function() { return this('description')('UTF8String'); };

  /*!
   * Custom inspect() function for `util.inspect()`.
   */
  ID.prototype.inspect = function() { return this.toString();  };

  return ID;
})();
