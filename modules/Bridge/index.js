module.exports = (function() {
  /**
   * **NodObjC** is the bridge between Node.js and the Objective-C runtime and
   * frameworks, making it possible to write native Cocoa applications (both GUI
   * and command-line) using 100% Node.js. Applications are written entirely in
   * JavaScript and interpreted at runtime.
   *
   * ## Getting Started
   *
   * Every **NodObjC** application begins with requiring the `NodObjC` module.
   * You can name the returned module variable anything you want, but the
   * "canonical" name for it is `$`. This is mostly because you're going to be using
   * the variable all over the place, and probably want to keep it short.
   *
   *     var $ = require('NodObjC')
   *
   * The next step is to [`import()`](import.html) a desired "Framework" that is
   * installed on the system. These frameworks are the APIs provided to Objective-C,
   * which could be the default frameworks (provided by Apple) or 3rd party
   * frameworks written by others (or you). The "Foundation" framework is the...
   * well.. foundation of these APIs, providing the most basic and important
   * classes like `NSString` and `NSArray`.
   *
   *     $.import('Foundation')
   *
   * [`import()`](import.html) doesn't return anything, however it will throw an
   * Error if anything goes wrong. What happens after the import call is that the
   * `$` variable now has a whole bunch of new properties attached to it, the
   * exports from the imported framework. At this point, you can fully interact
   * with these Objective-C classes, creating instances, subclassing, swizzling,
   * etc.
   *
   * A lot of core classes expect an `NSAutoreleasePool` instance on the stack, so
   * the first Objective-C object instance you create is usually one of those.
   *
   *     var pool = $.NSAutoreleasePool('alloc')('init')
   *
   * Pretty simple! You don't need to worry about the autorelease pool after this.
   * Now, for an example, try creating an `NSArray` instance, well, an
   * `NSMutableArray` technically, so we can also add an `NSString` to it.
   *
   *     var array = $.NSMutableArray('alloc')('init')
   *
   *     array('addObject', $('Hello World!'))
   *
   *     console.log(array)
   *     // (
   *     //     "Hello World!"
   *     // )
   *
   * So there's an `NSArray` instance with a `count` (Objective-C's version of
   * `Array#length`) of `1`, containing an `NSString` with the text "Hello World!".
   * From here on out, you will need to refer to your Cocoa documentation for the
   * rest of the available methods `NSArray` offers.
   *
   * ## Message Sending Syntax
   *
   * To send an Objective-C message to an Objective-C object using **NodObjC**, you
   * have to **invoke the object as a function**, where the **even number arguments
   * make up the message name** and the **odd numbered arguments are the arguments**
   * to send to the [object](id.html).
   *
   *     object('messageNameWithArg', someArg, 'andArg', anotherArg)
   *
   * This sounds and probably looks strange at first, but this is the cleanest
   * syntax while still being valid JS. It also maintains the "readabililty" of
   * typical Objective-C method names.
   *
   * ## Dynamic Object Introspection
   *
   * Since **NodObjC** runs in an interpreted environment, it is actually *very
   * easy* to dynamically inspect the defined methods, instance variables (ivars),
   * implemented protocols, and more of any given Objective-C object (a.k.a.
   * [`id`](id.html) instances).
   *
   * Using the same `array` instance as before, you can retreive a list of the
   * type of class, and it's subclasses, by calling the `.ancestors()` function.
   *
   *     array.ancestors()
   *     // [ '__NSArrayM',
   *     //   'NSMutableArray',
   *     //   'NSArray',
   *     //   'NSObject' ]
   *
   * Also commonly of interest are the given methods an object responds to. Use the
   * `.methods()` function for that.
   *
   *     array.methods()
   *     // [ 'addObject:',
   *     //   'copyWithZone:',
   *     //   'count',
   *     //   'dealloc',
   *     //   'finalize',
   *     //   'getObjects:range:',
   *     //   'indexOfObjectIdenticalTo:',
   *     //   'insertObject:atIndex:',
   *     //   'objectAtIndex:',
   *     //   'removeLastObject',
   *     //   'removeObjectAtIndex:',
   *     //   'replaceObjectAtIndex:withObject:' ]
   *
   * ## More Docs
   *
   * Check out the rest of the doc pages for some of the other important
   * **NodObjC** pieces.
   *
   *  * [Block](block.html) - How to use an Objective-C "block" function.
   *  * [Class](class.html) - Subclassing and adding methods at runtime.
   *  * [Exception](exception.html) - **NodObjC** exceptions *are* JavaScript `Error` objects.
   *  * [id](id.html) - The wrapper class for every Objective-C object.
   *  * [Import](import.html) - Importing "Frameworks" into the process.
   *  * [Ivars](ivar.html) - Instance variable definitions.
   *  * [Method](method.html) - Method definitions and swizzling.
   *  * [Structs](struct.html) - Using Structs and C functions in **NodObjC**.
   */

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

  /**
   * This function accepts native JS types (`String`, `Number`, `Date`. `RegExp`, `Buffer`, `function, [rtnType, [self, argType1, argType2, ...]`) and converts
   * them to the proper Objective-C type (`NSString`, `NSNumber`, `NSDate`, `NSRegularExpression`, `NSData`, `Objective-C block ^`).
   *
   * Often times, you will use this function to cast a JS String into an NSString
   * for methods that accept NSStrings (since NodObjC doesn't automatically cast to
   * NSStrings in those instances).
   *
   *     var jsString = 'a javascript String'
   *     var nsString = $(jsString)
   *
   *     $.NSLog(nsString)
   *
   * @param {String|Number|Date} o the JS object to convert to a Cocoa equivalent type.
   * @return {id} The equivalent Cocoa type as the input object. Could be an `NSString`, `NSNumber` or `NSDate`.
   */

  function NodObjC(o,m) {
    var t = typeof o;
    if (t === 'string') {
      return NodObjC.NSString('stringWithUTF8String', String(o));

    } else if (t === 'number') {
      return NodObjC.NSNumber('numberWithDouble', Number(o));

    } else if ((o instanceof Date ) || (Object.prototype.toString.call(o) === '[object Date]')) {
      return NodObjC.NSDate('dateWithTimeIntervalSince1970', o / 1000);

    } else if (Buffer.isBuffer(o)) {
      return NodObjC.NSData(
          'dataWithBytesNoCopy', o,
          'length', o.length);

    } else if (Object.prototype.toString.call(o) === '[object RegExp]') {
      var options = 0;
      //if (o.global) options |= NodObjC. ???
      if (o.ignoreCase) options |= NodObjC.NSRegularExpressionCaseInsensitive;
      if (o.multiline) options |= NodObjC.NSRegularExpressionAnchorsMatchLines;
      // TODO: add NSError support here
      var err = null;
      return NodObjC.NSRegularExpression(
          'regularExpressionWithPattern', NodObjC(o.source),
          'options', options,
          'error', err);

    } else if(t === 'function') {
      // create a block pointer
      if(m) {
        return Import.createBlock(o,m);
      }
      //TODO: create a function pointer, is this necessary?...
    }

    throw new Error('Unsupported object passed in to convert: ' + o);
  }

  var Import = require('import');
  var Types = require('types');
  NodObjC.resolve = Import.resolve;

  NodObjC.import =
  NodObjC.framework =
  NodObjC.importFramework =
  function framework (p,q) {
    q = (typeof(q) === 'undefined') ? 99999999 : q;
    Import.import(p,false,NodObjC,q);
  };

  NodObjC.alloc = Import.allocReference;
  NodObjC.YES = '\x01';
  NodObjC.NO = '\x00';
  NodObjC.id = '@';
  NodObjC.selector = ':';
  Types.registerTypes(NodObjC);
  return NodObjC;
})();
