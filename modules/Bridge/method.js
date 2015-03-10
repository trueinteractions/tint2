module.exports = (function() {
  /**
   * Represents an Objective-C "Method" instance. These do not respond to regular
   * messages, so it does not inherit from `id`.
   */

  /*!
   * Module dependencies.
   */

  var core = require('core');

  /**
   * `Method` wrapper class constructor.
   *
   * @param {Pointer} pointer The pointer to wrap.
   * @api private
   */
  function Method (pointer) {
    this.pointer = pointer;
  }

  /**
   * Returns a new `Method` instance wrapping the given `pointer`.
   *
   * @param {Pointer} pointer The pointer to wrap.
   * @return {Method} The new `Method` instance.
   * @api private
   */
  Method.wrap = function(pointer) {
    if (pointer.isNull()) {
      return null;
    }
    return new Method(pointer);
  }

  /**
   * Returns the "argument type" string, for the given argument `index`.
   *
   * @param {Number} index The argument index to lookup.
   * @return {String} The "type encoding" of the given argument index.
   */
  Method.prototype.getArgumentType = function(index) {
    var ptr=core.method_copyArgumentType(this.pointer, index)
      , str=core.getStringAndFree(ptr);
    return str;
  }

  /**
   * Returns an Array of all "argument types" for this method.
   *
   * @return {Array} An Array of all the method arguments' "type encodings".
   */
  Method.prototype.getArgumentTypes = function() {
    var rtn=[], len=this.getNumberOfArguments();
    for (var i=0; i<len; i++) {
      rtn.push(this.getArgumentType(i));
    }
    return rtn;
  }

  /**
   * Returns the "type encoding" of the method's return value.
   *
   * @return {String} The "type encoding" of the return value.
   */
  Method.prototype.getReturnType = function() {
    var ptr=core.method_copyReturnType(this.pointer)
      , str=core.getStringAndFree(ptr);
    return str;
  }

  /**
   * Returns an Array of "type encodings". The array has a `length` of `2`. The
   * first element is the method return type. The second element is an Array of all
   * the method's argument types.
   *
   * @return {Array} An Array of the Method's "types".
   */
  Method.prototype.getTypes = function() {
    return [ this.getReturnType(), this.getArgumentTypes() ];
  }

  /**
   * Exchanges the method's implementation function with another `Method` instance.
   * This is the preferred way to "swizzle" methods in Objective-C.
   *
   * @param {Method} other The other `Method` instance to swap implementations with.
   */
  Method.prototype.exchangeImplementations = function(other) {
    return core.method_exchangeImplementations(this.pointer, other.pointer);
  }

  /**
   * Returns the function implementation of this `Method`. Also known as the `IMP`
   * of the method. The returned object is a regular JavaScript Function which may
   * be invoked directly, when given valid *"self"* and *"_sel"* arguments.
   *
   * @return {Function} The `IMP` of this `Method`.
   */
  Method.prototype.getImplementation = function() {
    return core.createUnwrapperFunction(core.method_getImplementation(this.pointer), this.getTypes());
  }

  /**
   * Returns the name of this `Method`.
   *
   * @return {String} The name of the Method.
   */
  Method.prototype.getName = function() {
    return core.wrapValue(core.method_getName(this.pointer),':');
  }

  /**
   * Returns the number of defined arguments this `Method` accepts.
   *
   * @return {Number} The number of defined arguments.
   */
  Method.prototype.getNumberOfArguments = function() {
    return core.method_getNumberOfArguments(this.pointer);
  }

  /**
   * Returns the overall "type encoding" of this `Method`. This is a
   * compacted/stringified version of `getTypes()`, so usually you will use that
   * over this function.
   *
   * @return {String} The "type encoding" of the Method.
   */
  Method.prototype.getTypeEncoding = function getTypeEncoding () {
    return core.method_getTypeEncoding(this.pointer);
  }

  /**
   * Set's this `Method`'s implementation function. The `IMP` function may be
   * a regular JavaScript function or another function IMP retreived from a previous
   * call to `Method#getImplementation()`.
   *
   * @param {Function} func The new `IMP` function for this `Method`.
   * @return {Function} Returns the previous `IMP` function.
   */
  Method.prototype.setImplementation = function(func) {
    var types=this.getTypes()
      , wrapperPtr=core.createWrapperPointer(func, types)
      , oldFuncPointer=core.method_setImplementation(this.pointer, wrapperPtr);
    return core.createUnwrapperFunction(oldFuncPointer, types);
  }

  /*!
   * toString() override.
   */
  Method.prototype.toString = function() {
    return '[Method: '+this.getName()+' '+this.getReturnType()+'('+this.getArgumentTypes()+') ]';
  }

  Method.prototype.inspect = function inspect () {
    // magenta
    return '\033[35m' + this.toString() + '\033[39m';
  }

  return Method;
})();
