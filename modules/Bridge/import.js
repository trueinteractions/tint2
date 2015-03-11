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
  var fs = require('fs'),
      read = require('fs').readFileSync,
      path = require('path'),
      core = require('core'),
      Class = require('class'),
      basename = path.basename,
      SUFFIX = '.framework',
      PATH = [
        '/System/Library/Frameworks',
        '/System/Library/PrivateFrameworks'
      ],
      join = path.join,
      exists = fs.existsSync || path.existsSync,
      DY_SUFFIX = '.dylib',
      BS_SUFFIX = '.bridgesupport';

  /*!
   * A cache for the frameworks that have already been imported.
   */

  var cache = {};

  /*!
   * Architecture-specific functions that return the Obj-C type or value from one
   * of these BridgeSupport XML nodes.
   */

  var typePrefix = (process.arch==='x64') ? '64' : '';
  var typeSuffix = (process.arch==='x64') ? '' : '64';

  function getType(node) {
    return node.attrib['type'+typePrefix] || node.attrib['type'+typeSuffix];
  }

  function getValue(node) {
    return node.attrib['value'+typePrefix] || node.attrib['value'+typeSuffix];
  }

  function fastIndexOf(subject, target, fromIndex) {
    var length = subject.length, i = 0;
    if (typeof fromIndex === 'number') {
      i = fromIndex;
      if (i < 0) {
        i += length;
        if (i < 0) {
          i = 0;
        }
      }
    }
    for (; i < length; i++) {
      if (subject[i] === target) {
        return i;
      }
    }
    return -1;
  }

  function parseAttrib(tag,attr) {
    var coll = {}, split = 0, name = '', value = '', i=0;
    attr = attr.split('\' ');
    for(; i < attr.length; i++) 
    {
      split = fastIndexOf(attr[i], "=");
      name = attr[i].substring(0, split);
      value = attr[i].substring(split+2, (i === attr.length-1) ? attr[i].length-1 : undefined);
      if(fastIndexOf(value, '&') !== -1) {
        value = value.replace(quoteRegExp, '"');
      }
      coll[name]=value;
    }
    return coll;
  }

  function parseTag(names, tag, content) {
    var sattr = 2 + tag.name.length
        , eattr = fastIndexOf(content,'>',1)
        , isBodyless = (content[eattr - 1] === '/');
    
    var sbody = eattr + 1
      , ebody = isBodyless ? eattr - 1 : content.indexOf('</'+tag.name, eattr); // cannot use fastIndexOf
    
    tag.end = isBodyless ? ebody + 2 : ebody + tag.name.length + 3;
    tag.attrib = parseAttrib(tag,content.substring(sattr, eattr + (isBodyless ? -1 : 0)));
    if(sbody === ebody || names[tag.name] === null) {
      tag.children = [];
    } else {
      tag.children = findTags(names[tag.name], content.substring(sbody,ebody));
    }
    return tag;
  }

  function findTags(names, content) {
    var ndx = 0, i = 0, tagKeys = Object.keys(names), ftags=[{end:1}], key = '';

    do {
      content = content.substring(ndx);
      for(i=0; i < tagKeys.length; i++) {
        key = tagKeys[i];
        // quick break for non-matching keys, cheaper on fails (which happen a lot)
        // rather than a full substring. Three is both the max benefit and after that
        // we'll cause some odd behavior (e.g., matching conditions)
        if( content[1] === key[0] && 
            content[2] === key[1] && 
            content[3] === key[2]) 
        {
          if(key.length < 4 || key === content.substring(1,key.length+1)) {
            delete ftags[ftags.length-1].end;
            ftags.push(parseTag(names,{name:key},content));
            break;
          }
        }
      }
      ndx = fastIndexOf(content, '<', ftags[ftags.length-1].end );
    } while(ndx !== -1);

    ftags.shift();
    
    return ftags;
  }
  var quoteRegExp = new RegExp("&quot;","g");

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
  function parseBridgeFile(fw, onto, recursive) {
    var bridgedir = join(fw.basePath, 'Resources', 'BridgeSupport')
      , bridgeSupportXML = join(bridgedir, fw.name + BS_SUFFIX)
      , bridgeSupportDylib = join(bridgedir, fw.name + DY_SUFFIX);

    // If there's no BridgeSupport file, then bail...
    if (!exists(bridgeSupportXML)) {
      return;
    }

    // Load the "inline" dylib if it exists
    if (exists(bridgeSupportDylib)) {
      fw.lib = core.dlopen(bridgeSupportDylib);
    }

    var tags = {'function':{'retval':{'retval':null,'arg':null},'arg':{'retval':null,'arg':null}},'depends_on':null,'string_constant':null,'enum':null,'struct':null,'constant':null};
    var nodes = findTags(tags, read(bridgeSupportXML, 'utf8'));

    nodes.forEach(function (node) {
      var name = node.attrib.name;
      if(node.name === 'depends_on')
      {
        if(recursive && recursive > 0) {
          importFramework(node.attrib.path, true, onto, --recursive);
        }
      } else if (node.name === 'string_constant') {
        onto[name] = getValue(node);
      } else if (node.name === 'enum') {
        if (node.attrib.ignore !== "true") {
          onto[name] = parseInt(getValue(node));
        }
      } else if (node.name === 'struct') {
        var structtype = getType(node);
        onto[name] = core.Types.knownStructs[core.Types.parseStructName(structtype)] = structtype;
      }  else if (node.name === 'constant')  {
        var consttype = getType(node);
        onto.__defineGetter__(name, function () {
          var ptr = fw.lib.get(name);
          ptr._type = '^' + consttype;
          var derefPtr = ptr.deref();
          delete onto[name];
          onto[name] = derefPtr
          return derefPtr;
        });
      }
      else if (node.name === 'function')
      {
        if(node.attrib.original) { // Support for function aliases
          onto[node.attrib.original] = onto[node.attrib.name];
          return;
        }
        //var isInline = node.attrib.inline === 'true' ? true : false
        var isVariadic = node.attrib.variadic === 'true' ? true : false
          , passedTypes = {args:[],name:name};

        node.children.forEach(function (n, i) {
          var typeName = n.name;
          if(typeName === 'arg') {
            passedTypes.args.push(flattenNode(n));
          } else if (typeName === 'retval') {
            passedTypes.retval = flattenNode(n);
          }
        });

        Object.defineProperty(onto, name, {
          get:function() {
            var ptr = fw.lib.get(name);
            var unwrapper = core.createUnwrapperFunction(ptr, passedTypes, isVariadic);
            delete onto[name];
            onto[name] = unwrapper;
            return unwrapper;
          }
        });
      }
    });
  }

  function flattenNode (node) {
    var rnode = {};
    rnode.type = getType(node);
    if (node.attrib.function_pointer === 'true') {
      rnode.args = [];
      node.children.forEach(function (n) {
        if(n.name === 'arg') {
          rnode.args.push(flattenNode(n));
        } else if(n.name === 'retval') {
          rnode.retval = flattenNode(n);
        }
      });
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
    if (framework[framework.length-1] === '/') {
      framework = framework.slice(0, framework.length-1);
    }

    // already absolute, return as-is
    if (~framework.indexOf('/')) {
      return framework;
    }

    var i=0, l=PATH.length, rtn=null;
    for (; i<l; i++) {
      rtn = join(PATH[i], framework + SUFFIX);
      if (exists(rtn)) {
        return rtn;
      }
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
        return core.wrapValue(rtnval,'@');
      };
      return v;
    };
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
    framework=resolve(framework);
    var shortName=basename(framework, SUFFIX);
    // Check if the framework has already been loaded
    var fw=cache[shortName];
    if (fw) {
      return;
    }
    // Load the main framework binary file
    var frameworkPath=join(framework, shortName), lib=core.dlopen(frameworkPath);

    fw={ lib:lib, name:shortName, basePath:framework, binaryPath:frameworkPath };

    // cache before loading bridgesupport files
    cache[shortName] = fw;

    // Parse the BridgeSupport file and inline dylib, for the C functions, enums,
    // and other symbols not introspectable at runtime.
    parseBridgeFile(fw, onto, recursive);

    // Iterate through the loaded classes list and define "setup getters" for them.
    if (!skip) {
      var classes = core.getClassList();
      classes.forEach(function (c) {
        if (c in onto) {
          return;
        }
        onto.__defineGetter__(c, function () {
          var clazz = Class.getClassByName(c, onto);
          delete onto[c];
          onto[c] = clazz
          return onto[c];
        });
      });
    }
  }

  /*!
   * Module exports.
   */
  ex.bridgesupport = parseBridgeFile
  ex.import = importFramework;
  ex.resolve = resolve;
  ex.framework = importFramework;
  ex.PATH = PATH;
  ex.allocReference = allocReference;
  ex.createBlock = function(func, types) { 
    return core.wrapValue(core.createBlock(func, types), '@'); 
  };
  return ex;
})();
