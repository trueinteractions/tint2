if(!process.bridge) {
	process.initbridge();

    var EventEmitter = require('events').EventEmitter,
    gir = process.bridge.gobj;
	/******************************************************************************/

	/* BEGIN HELPERS */

	/**
	 * Adopted from jquery's extend method. Under the terms of MIT License.
	 *
	 * http://code.jquery.com/jquery-1.4.2.js
	 *
	 * Modified by Brian White to use Array.isArray instead of the custom isArray
	 * method.
	 */
	function extend() {
	  // copy reference to target object
	  var target = arguments[0] || {},
	      i = 1,
	      length = arguments.length,
	      deep = false,
	      options,
	      name,
	      src,
	      copy;

	  // Handle a deep copy situation
	  if (typeof target === "boolean") {
	    deep = target;
	    target = arguments[1] || {};
	    // skip the boolean and the target
	    i = 2;
	  }

	  // Handle case when target is a string or something (possible in deep copy)
	  if (typeof target !== "object" && !typeof target === 'function')
	    target = {};

	  var isPlainObject = function(obj) {
	    // Must be an Object.
	    // Because of IE, we also have to check the presence of the constructor
	    // property.
	    // Make sure that DOM nodes and window objects don't pass through, as well
	    if (!obj || toString.call(obj) !== "[object Object]" || obj.nodeType
	        || obj.setInterval)
	      return false;
	    
	    var has_own_constructor = hasOwnProperty.call(obj, "constructor");
	    var has_is_prop_of_method = hasOwnProperty.call(obj.constructor.prototype,
	                                                    "isPrototypeOf");
	    // Not own constructor property must be Object
	    if (obj.constructor && !has_own_constructor && !has_is_prop_of_method)
	      return false;
	    
	    // Own properties are enumerated firstly, so to speed up,
	    // if last one is own, then all properties are own.

	    var last_key;
	    for (key in obj)
	      last_key = key;
	    
	    return typeof last_key === "undefined" || hasOwnProperty.call(obj, last_key);
	  };


	  for (; i < length; i++) {
	    // Only deal with non-null/undefined values
	    if ((options = arguments[i]) !== null) {
	      // Extend the base object
	      for (name in options) {
	        src = target[name];
	        copy = options[name];

	        // Prevent never-ending loop
	        if (target === copy)
	            continue;

	        // Recurse if we're merging object literal values or arrays
	        if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
	          var clone = src && (isPlainObject(src) || Array.isArray(src)
	                              ? src : (Array.isArray(copy) ? [] : {}));

	          // Never move original objects, clone them
	          target[name] = extend(deep, clone, copy);

	        // Don't bring in undefined values
	        } else if (typeof copy !== "undefined")
	          target[name] = copy;
	      }
	    }
	  }

	  // Return the modified object
	  return target;
	};

	/**
	 * Copied from jQuery. Under the terms of MIT or GPLv2 License.
	 * http://code.jquery.com/jquery-1.7.1.js
	 */
	function merge(first, second) {
			var i = first.length,
				j = 0;

			if ( typeof second.length === "number" ) {
				for ( var l = second.length; j < l; j++ ) {
					first[ i++ ] = second[ j ];
				}

			} else {
				while ( second[j] !== undefined ) {
					first[ i++ ] = second[ j++ ];
				}
			}

			first.length = i;

			return first;
		}
		
	/**
	 * Copied from jQuery. Under the terms of MIT or GPLv2 License.
	 * http://code.jquery.com/jquery-1.7.1.js
	 *
	 * Modified by David Ball to work outside the jQuery environment. Removed
	 * reference to jQuery.isWindow() and jQuery.type(). Modified jQuery.merge() to
	 * use local scope. Applied logic from jQuery.type() since there is no DOM.
	 * Changed push to Array.prototype.push.
	 */
	function makeArray(array, results) {
	  var ret = results || [];

	  if ( array != null ) {
		  // The window, strings (and functions) also have 'length'
		  // Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
		  var type = array == null ? String( obj ) : "object";

		  if ( array.length == null || type === "string" || type === "function" || type === "regexp") {
			  Array.prototype.push.call( ret, array );
		  } else {
			  merge( ret, array );
		  }
	  }

	  return ret;
	} 

	/* END HELPERS */

	/******************************************************************************/

	/* BEGIN LOGIC */

	//save default module routines
	gir._gir_baseLoad = gir.load;

	//add init flag property
	gir._gir_hasInit = false;

	//create callable method object
	function CallableMethod(methodName) {
	  //the internal function does all the hard work
	  var invocation = function() {
	    var args = Array.prototype.slice.call(arguments);
	    if (args == undefined) args = new Array();
	    for (var i = args.length; i > 0; i--)
	      args[i] = args[i-1];
	    args[0] = methodName;
	    //call the method on the gir provided object
	    this.apply(this, args);
	  };
	  return invocation;
	}

	//override default loader
	gir.load = function() {
	  
	  //load gir module
	  var obj = gir['_gir_baseLoad'].apply(this, Array.prototype.slice.call(arguments));
	  
	  //check for error
	  if (!obj) return obj;
	  
	  //TODO: consider storing loaded module gir somewhere now so that it can be unloaded later ?
	  
	  //for each object within the loaded gir module:
	  //  task 1. figure out which loaded objects can trigger events, and add EventEmitter as needed
	  //  task 2. make method names callable methods
	  for (var subobj in obj) {
	    //task 1: add EventEmitter as needed
	    //determine whether eventable
	    var eventable = obj[subobj].__signals__ != undefined
	                      && makeArray(obj[subobj].__signals__).length>0;
	    if (eventable) {
	      //combine EventEmitter logic with eventable gir objects
	      extend(true, obj[subobj].prototype, EventEmitter.prototype);
	      //check for prop __watch_signal__, if found, override EventEmitter.on()
	      if (obj[subobj].prototype['__watch_signal__'] != undefined) {
	        obj[subobj].prototype._baseEventEmitter_on = obj[subobj].prototype.on;
	        obj[subobj].prototype.on = function () {
	          //tell gir loaded object to listen for the signal
	          this.__watch_signal__(arguments[0]);
	          //dispatch normally
	          this._baseEventEmitter_on(arguments[0], arguments[1]);
	        };
	      }
	    }

	    //task 2: expose object methods to objects and make them callable
	    for (var prop in obj[subobj]) {
	      switch (prop) {
	        case '__methods__':
	          for (var method_offset in obj[subobj][prop]) {
	            var method_name = obj[subobj][prop][method_offset];
	            //debug:console.log(subobj + '.'  + method_name + '() discovered');
	            //add method handler to object if possible
	            if (obj[subobj].prototype[method_name] != undefined)
	              {}//debug:console.warn("[node-gir] " + subobj + " object provides it's own " + method_name + " method. Not replacing existing method. :-(");
	            else
	              obj[subobj].prototype[method_name] = CallableMethod(method_name);
	          }
	          break;
	      }
	    }
	    //console.log(subobj, obj[subobj]);
	  }

	  //keep the loader in the loaded object in case caller wants to reuse the loader
	  if (obj.gir != undefined)
	    console.warn("[node-gir] Object provides it's own gir. Not replacing gir. Strange error? :-(");
	  else
	    obj.gir = this;

	  //return the brutally overridden object
	  return obj;
	};
}
if(!process.bridge.ref) {
	process.bridge.ref = require('ref');
}
if(!process.bridge.struct) {
	process.bridge.struct = require('struct');
}
if(!process.bridge.ffi) {
	process.bridge.ffi = require('ffi');
}