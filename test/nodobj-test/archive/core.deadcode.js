

  function getMethodArgTypes (method) {
    var num = objc.method_getNumberOfArguments(method)
      , rtn = [];
    for (var i=2; i<num; i++)
      rtn.push(getStringAndFree(objc.method_copyArgumentType(method, i)));
   return rtn;
  }

  /**
   * Iterates over the Methods defined by a Protocol.
   */
  function copyMethodDescriptionList (protocolPtr, required, instance) {
    var numMethods = ref.alloc('uint')
      , methods = objc.protocol_copyMethodDescriptionList(protocolPtr, required, instance, numMethods)
      , rtn = []
      , p = methods
      , count = numMethods.deref();

    for (var i=0; i<count; i++) {
      var cur = new objc_method_description(p);
      rtn.push(SEL.toString(cur.name));
      p = p.seek(ffi.sizeOf(objc_method_description));
    }
    free(methods);
    return rtn;
  }

  /**
   * Gets a list of the currently loaded Protocols in the runtime.
   */
  function copyProtocolList () {
    var rtn = []
      , protos = objc.objc_copyProtocolList(ref.alloc('uint'))
      , count = num.deref();

    for (var i=0; i<count; i++)
      rtn.push(objc.protocol_getName(protos.readPointer(i * ref.sizeof.pointer)));

    free(protos);
    return rtn;
  }


