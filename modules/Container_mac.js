module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var $ = process.bridge.objc;
  var parseValue = utilities.parseUnits;

  function Container(NativeObjectClass, NativeViewClass, options) {
    Control.call(this, NativeObjectClass, NativeViewClass, options);
    this.private.children = [];
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  Object.defineProperty(Container.prototype, 'children', { get:function() { return this.private.children; } });

  Container.prototype.appendChild = function(control) {
    if(Array.isArray(control))
      for(var i=0; i < control.length; i++) this.appendChild(control[i]);
    else {
      this.private.children.push(control);
      this.nativeView('addSubview',control.nativeView);
      control.fireEvent('parent-attached', [this]);
      this.fireEvent('child-attached', [control]);
    }
  }

  Container.prototype.removeChild = function(control) {
    this.fireEvent('remove', element);
    if(this.private.children.indexOf(control) != -1) 
      this.private.children.splice(children.indexOf(control),1);

    control.nativeView('removeFromSuperview');
    control.fireEvent('parent-dettached', [this]);
    this.fireEvent('child-dettached', [control]);
  }

  return Container;
})();