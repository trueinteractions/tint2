module.exports = (function() {
  /**
   * Represents an Objective-C class "ivar", or instance variable.
   */

  /*!
   * Module dependencies.
   */
  var core = require('_core');

  /**
   * The `Ivar` Class. Wrapper around an Objective-C `ivar` pointer.
   *
   * @param {Pointer} pointer The ivar *pointer* to wrap.
   * @api private
   */
  function Ivar (pointer) {
    this.pointer = pointer;
  }

  /**
   * Wraps a `Pointer` that should be an Objective-C `ivar` (instance variable),
   * and returns a new `Ivar` instance.
   *
   * @param {Pointer} pointer The ivar *pointer* to wrap.
   * @return {Ivar} A wrapper `Ivar` instance around the given ivar *pointer*.
   * @api private
   */
  Ivar.wrap = function(pointer) {
    if (pointer.isNull()) {
      return null;
    }
    return new Ivar(pointer);
  }

  /**
   * Returns the name of the `Ivar`.
   *
   * @return {String} The name of this `Ivar`.
   */
  Ivar.prototype.getName = function() {
    return core.ivar_getName(this.pointer);
  }

  /**
   * Returns the offset of the `Ivar`. This is the offset in bytes that the instance
   * variable resides in the object's layout in memory.
   *
   * @return {Number} The offset number of bytes of this `Ivar`.
   */
  Ivar.prototype.getOffset = function() {
    return core.ivar_getOffset(this.pointer);
  }

  /**
   * Returns the "type encoding" of the `Ivar`.
   *
   * @return {String} The "type encoding" the this `Ivar`.
   */
  Ivar.prototype.getTypeEncoding = function() {
    return core.ivar_getTypeEncoding(this.pointer);
  }

  /**
   * toString() override.
   */
  Ivar.prototype.toString = function() {
    return '[Ivar: ' + [ this.getName()
                       , this.getTypeEncoding()
                       , this.getOffset()].join(', ') +']';
  }
  Ivar.prototype.inspect = function inspect () {
    // red
    return '\033[31m' + this.toString() + '\033[39m';
  }

  /*!
   * Module exports.
   */
  return Ivar;
})();
