
/**
 * Module dependencies.
 */

if(!process.bridge) process.initbridge();

var ref = require('ref')
  , assert = require('assert')
  , bindings = process.bridge
  , Callback = require('callback')
  , ForeignFunction = require('foreign_function')
 
/**
 * Module exports.
 */

module.exports = FFIFunction

/**
 * Creates and returns a "type" object for a C "function pointer".
 *
 * @api public
 */

function FFIFunction (retType, argTypes, abi) {
  if (!(this instanceof FFIFunction)) {
    return new FFIFunction(retType, argTypes, abi)
  }


  // check args
  assert(!!retType, 'expected a return "type" object as the first argument')
  assert(Array.isArray(argTypes), 'expected Array of arg "type" objects as the second argument')

  // normalize the "types" (they could be strings, so turn into real type
  // instances)
  this.retType = ref.coerceType(retType)
  this.argTypes = argTypes.map(ref.coerceType)
  this.abi = null === abi ? bindings.FFI_DEFAULT_ABI : abi
}

/**
 * The "ffi_type" is set for node-ffi functions.
 */

FFIFunction.prototype.ffi_type = bindings.FFI_TYPES.pointer

/**
 * The "size" is always pointer-sized.
 */

FFIFunction.prototype.size = ref.sizeof.pointer

/**
 * The "alignment" is always pointer-aligned.
 */

FFIFunction.prototype.alignment = ref.alignof.pointer

/**
 * The "indirection" is always 1 to ensure that our get()/set() get called.
 */

FFIFunction.prototype.indirection = 1

/**
 * Returns a ffi.Callback pointer (Buffer) of this function type for the
 * given `fn` Function.
 */

FFIFunction.prototype.toPointer = function toPointer (fn) {
  return Callback(this.retType, this.argTypes, this.abi, fn)
}

/**
 * Returns a ffi.ForeignFunction (Function) of this function type for the
 * given `buf` Buffer.
 */

FFIFunction.prototype.toFunction = function toFunction (buf) {
  return ForeignFunction(buf, this.retType, this.argTypes, this.abi)
}

/**
 * get function; return a ForeignFunction instance.
 */

FFIFunction.prototype.get = function get (buffer, offset) {
  var ptr = buffer.readPointer(offset)
  return this.toFunction(ptr)
}

/**
 * set function; return a Callback buffer.
 */

FFIFunction.prototype.set = function set (buffer, offset, value) {
  var ptr
  if ('function' === typeof value) {
    ptr = this.toPointer(value)
  } else if (Buffer.isBuffer(value)) {
    ptr = value
  } else {
    throw new Error('don\'t know how to set callback function for: ' + value)
  }
  buffer.writePointer(ptr, offset)
}
