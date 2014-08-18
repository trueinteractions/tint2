module.exports = (function() {
  /**
   * Logic for importing a Framework into the node process.
   *
   * "Importing" a framework is a multi-step process:
   *
   *   1. `resolve()` the absolute path of the given framework name.
   *   1. Load the framework's binary `dylib` file into the process.
   *   1. Usually locate the `BridgeSupport` files for the framework and process.
   *   1. Define any new class getters for newly loaded Objective-C classes.
   */

  /*!
   * Module exports.
   */
  var ex = {}; 

  /*!
   * Module dependencies.
   */
  var fs = require('fs')
    , read = require('fs').readFileSync
    , assert = require('assert')
    , libxmljs = require('../../node_modules/libxmljs')
    , path = require('path')
    , core = require('../../lib/core')
    , Class = require('../../lib/class')
    , ID = require('../../lib/ID')
    , join = path.join
    , basename = path.basename
    , exists = fs.existsSync || path.existsSync
    , SUFFIX = '.framework'
    , PATH = [
        '/System/Library/Frameworks'
      , '/System/Library/PrivateFrameworks'
    ]   
    , join = path.join
    , exists = fs.existsSync || path.existsSync
    , DY_SUFFIX = '.dylib'
    , BS_SUFFIX = '.bridgesupport';
  
  /*!
   * A cache for the frameworks that have already been imported.
   */

  var cache = {}

  /*!
   * Architecture-specific functions that return the Obj-C type or value from one
   * of these BridgeSupport XML nodes.
   */

  var typePrefix = (process.arch=='x64') ? '64' : '';
  var typeSuffix = (process.arch=='x64') ? '' : '64';

  function getType(node) {
    var v = node.attr('type'+typePrefix) || node.attr('type'+typeSuffix);
    return v.value();
  }

  function getValue(node) {
      var v = node.attr('value'+typePrefix) || node.attr('value'+typeSuffix);
      return v.value();
  }

  /**
   * This module takes care of loading the BridgeSupport XML files for a given
   * framework, and parsing the data into the given framework object.
   *
   * ### References:
   *
   *  * [`man 5 BridgeSupport`](http://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man5/BridgeSupport.5.html)
   *  * [BridgeSupport MacOS Forge website](http://bridgesupport.macosforge.org)
   */

  /**
   * Attempts to retrieve the BridgeSupport files for the given framework.
   * It synchronously reads the contents of the bridgesupport files and parses
   * them in order to add the symbols that the Obj-C runtime functions cannot
   * determine.
   */

  function bridgesupport (fw, onto, recursive) {
    var bridgedir = join(fw.basePath, 'Resources', 'BridgeSupport')
      , bridgeSupportXML = join(bridgedir, fw.name + BS_SUFFIX)
      , bridgeSupportDylib = join(bridgedir, fw.name + DY_SUFFIX);

    // If there's no BridgeSupport file, then bail...
    if (!exists(bridgeSupportXML)) return;

    // Load the "inline" dylib if it exists
    if (exists(bridgeSupportDylib))
      fw.inline = core.dlopen(bridgeSupportDylib);

    var contents = read(bridgeSupportXML, 'utf8')
      , doc = libxmljs.parseXmlString(contents)
      , nodes = doc.childNodes();

    nodes.forEach(function (node) {
      var name = (node.attr('name')) ? node.attr('name').value() : null;
      switch (node.name()) {
        case 'depends_on':
          if(recursive && recursive > 0)
            importFramework(node.attr('path').value(), true, onto, --recursive);
          break;
        case 'string_constant':
          onto[name] = getValue(node);
          break;
        case 'enum':
          var ignore = node.attr('ignore');
          if (!ignore || ignore.value() != "true") onto[name] = Number(getValue(node));
          break;
        case 'struct':
          onto[name] = core.Types.getStruct(getType(node));
         break;
        case 'constant':
          var type = getType(node);
          // This may seem strange but it helps us limit the amount of memory
          // so rather than actually loading the constant we only load it when
          // requested.
          onto.__defineGetter__(name, function () {
            var ptr = fw.lib.get(name); // TODO: Cache the pointer after the 1st call
            ptr._type = '^' + type;
            return ptr.deref();
          });
          break;
        case 'function':
          var isInline = node.attr('inline') && node.attr('inline').value() == 'true' ? true : false;
          var passedTypes = {};
          passedTypes.args = [];
          passedTypes.name = name;
          node.childNodes().forEach(function (n, i) {
              var type = n.name();
              switch (type) {
                case 'arg':
                  passedTypes.args.push(flattenNode(n));
                  break;
                case 'retval':
                  passedTypes.retval = flattenNode(n);
                  break;
                default:
                  break;
              }
            });

          // This may seem strange that were redefining our own property on the 
          // first execution (or access) of this property, but its due to that
          // the symbol won't exist until we've finished loading the framework
          // so we set it as a proxy, it also may help save a tiny amount of 
          // memory and library loads. NOTE: no references to "node" can be in
          // side this function otherwise we'll leak all of the XML data in
          // memory and cause GC issues.
          Object.defineProperty(onto, name, {
            get:function() {
              // TODO: Handle 'variadic' arg functions (NSLog), will require
              //       a "function generator" to get a Function from the passed
              //       in args (and guess at the types that were passed in...)
              if (isInline)
                assert.ok(fw.inline, name+', '+fw.name+': declared inline but could not find inline dylib!');
              
              var ptr = (isInline ? fw.inline : fw.lib).get(name);
              var unwrapper = core.createUnwrapperFunction(ptr, passedTypes);
              delete onto[name];
              return onto[name] = unwrapper;
            }
          });

          break;
        case 'text':
        case 'class': // classes are read in from runtime, not the bridge file.
        case 'opaque':
        case 'informal_protocol':
        case 'function_alias':
        case 'field':
        case 'cftype':
          break;
        default:
          throw new Error('unknown tag: '+ node.name);
          break;
      }
      delete node;
    });
    // Ensure we completely remove references to the XML bridge files
    // otherwise we will leak a lot of memory.
    delete nodes;
    delete doc;
    delete contents;
  }

  function flattenNode (node) {
    var rnode = {};
    rnode.type = getType(node);
    var functionPointer = node.attr('function_pointer');
    if (functionPointer && functionPointer.value() === 'true') {
      rnode.function_pointer = 'true'; // XXX: Remove? Used by the function_pointer test case
      rnode.args = [];
      node.childNodes().forEach(function (n, i) {
        switch (n.name()) {
          case 'arg':
            rnode.args.push(flattenNode(n));
            break;
          case 'retval':
            rnode.retval = flattenNode(n);
            break;
          default:
            break;
        }
      })
    }
    return rnode;
  }

  /**
   * Accepts a single framework name and resolves it into an absolute path
   * to the base directory of the framework.
   *
   * In most cases, you will not need to use this function in your code.
   *
   *     $.resolve('Foundation')
   *     //  '/System/Library/Frameworks/Foundation.framework'
   *
   * @param {String} framework The framework name or path to resolve.
   * @return {String} The resolved framework path.
   */
  function resolve (framework) {
    // strip off a trailing slash if present
    if (framework[framework.length-1] == '/')
      framework = framework.slice(0, framework.length-1);
    // already absolute, return as-is
    if (~framework.indexOf('/')) return framework;
    var i=0, l=PATH.length, rtn=null;
    for (; i<l; i++) {
      rtn = join(PATH[i], framework + SUFFIX);
      if (exists(rtn)) return rtn;
    }
    throw new Error('Could not resolve framework: ' + framework);
  }

  /**
   * Allocates a new pointer to this type. The pointer points to `nil` initially.
   * This is meant for creating a pointer to hold an NSError*, and pass a ref()
   * to it into a method that accepts an 'error' double pointer.
   * XXX: Tentative API - name will probably change
   */
  function allocReference(classWrap) {
    // We do some "magic" here to support the dereferenced
    // pointer to become an obj-c type.
    var ptr = core.REF.alloc('pointer', null);
    ptr._type = '@';
    var _ref = ptr.ref;
    ptr.ref = function() {
      var v = _ref.call(ptr,arguments);
      var _deref = v.deref;
      v.deref = function() {
        var rtnval = _deref.call(v,arguments)
        return ID.wrap(rtnval, classWrap.classPointer);
      };
      return v;
    }
    return ptr;
  }

  /**
   * Accepts a single framework name and imports it into the current node process.
   * `framework` may be a relative (singular) framework name, or a path (relative or
   * absolute) to a Framework directory.
   *
   *     $.NSObject   // undefined
   *
   *     $.import('Foundation')
   *
   *     $.NSObject   // [Class: NSObject]
   *
   * @param {String} framework The framework name or path to load.
   */
  function importFramework (framework, skip, onto, recursive) {
    framework=resolve(framework)
    var shortName=basename(framework, SUFFIX)
    // Check if the framework has already been loaded
    var fw=cache[shortName];
    if (fw) return;

    // Load the main framework binary file
    var frameworkPath=join(framework, shortName), lib=core.dlopen(frameworkPath);

    fw={ lib:lib, name:shortName, basePath:framework, binaryPath:frameworkPath };

    // cache before loading bridgesupport files
    cache[shortName] = fw;

    // Parse the BridgeSupport file and inline dylib, for the C functions, enums,
    // and other symbols not introspectable at runtime.
    bridgesupport(fw, onto, recursive);

    // Iterate through the loaded classes list and define "setup getters" for them.
    if (!skip) {
      var classes = core.getClassList();
      classes.forEach(function (c) {
        if (c in onto) return;
        // This may seem odd but it helps to create the definition that pulls the
        // object on the first loop rather than load every class/obj into memory
        // that may not be needed.  This is huge savings, difference of 60MB for
        // definitions vs. 500MB.
        onto.__defineGetter__(c, function () {
          var clazz = Class.getClassByName(c, onto);
          delete onto[c];
          return onto[c] = clazz;
        });
      });
    }
  }

  /*!
   * Module exports.
   */
  ex.bridgesupport = bridgesupport
  //ex.import = importFramework;
  ex.resolve = resolve;
  ex.framework = importFramework;
  ex.PATH = PATH;
  ex.allocReference = allocReference;
  ex.import = function (p,q) {
    q = (typeof(q) == 'undefined') ? 99999999 : q;
    importFramework(p,false,ex,q);
  };
  return ex;
})();