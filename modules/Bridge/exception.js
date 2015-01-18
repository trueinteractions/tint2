/**
 * `NodObjC` makes it seamless to catch Objective-C exceptions, using the standard
 * JavaScript `try`/`catch` syntax you are already familiar with.
 *
 * When an Objective-C method or function throws an `NSException`, you can catch
 * the exception and inspect it further. The error object that gets passed can be
 * invoked to send messages, just like any other Objective-C object in `NodObjC`.
 * The error object also has it's `message` and `stack` properties set, so that
 * you can easily retrieve the error message and get a dump of the stack trace.
 *
 *     var array = $.NSMutableArray('alloc')('init')
 *
 *     try {
 *
 *       // This will throw an exception since you can't add a null pointer
 *       array('addObject', null)
 *
 *     } catch (err) {
 *
 *       err('name')
 *       // 'NSInvalidArgumentException'
 *
 *       err('reason')
 *       // '*** -[__NSArrayM insertObject:atIndex:]: object cannot be nil'
 *
 *       err('reason') === err.message
 *       // true
 *
 *       err.stack
 *       // NSInvalidArgumentException: *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
 *       //     at Function.msgSend (/Users/nrajlich/NodObjC/lib/id.js:139:21)
 *       //     at id (/Users/nrajlich/NodObjC/lib/id.js:105:15)
 *       //     at Object.<anonymous> (/Users/nrajlich/NodObjC/array-exception.js:8:3)
 *       //     at Module._compile (module.js:411:26)
 *       //     at Object..js (module.js:417:10)
 *       //     at Module.load (module.js:343:31)
 *       //     at Function._load (module.js:302:12)
 *       //     at Array.0 (module.js:430:10)
 *       //     at EventEmitter._tickCallback (node.js:126:26)
 *
 *     }
 */


/*!
 * Module exports.
 */

module.exports = wrap;

/*!
 * Module dependencies.
 */

var core = require('core')
	, Exception = require('vm').runInNewContext('Error');


/**
 * A `toString()` override that mimics an `Error` object's `toString()`,
 * using the equivalent Objective-C `NSException` instance methods.
 *
 *     // `err` is a caught NSException instance
 *     err.toString()
 *     // 'NSInvalidArgumentException: *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil'
 */

Exception.prototype.toString = function() {
  return this('name') + ': ' + this('reason')
}


/**
 * Wraps a `Pointer` that should be an Objective-C `NSException` instance.
 *
 * @api private
 */

function wrap(pointer) {
    var w = core.wrapValue(pointer, '@');
    w.__proto__ = Exception;
    // `name` is non-configurable on Functions, so don't bother
    w.message = String(w('reason'))
    Error.captureStackTrace(w, wrap);
    return w;
}
