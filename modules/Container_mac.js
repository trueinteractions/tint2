module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var $ = process.bridge.objc;
  var parseValue = utilities.parseUnits;

  function Container(NativeObjectClass, NativeViewClass, options) {
    if(NativeObjectClass && NativeObjectClass.type == '#')
      Control.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      Control.call(this, $.NSView, $.NSView, options);
      this.native = this.nativeView = this.nativeViewClass('alloc')('init');
      this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    }
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

  Container.prototype.scrollTo = function(x, y) {
    var b = this.bounds;
    this.nativeView('scrollPoint', $.NSMakePoint(x,b.height - y));
  }

  return Container;
})();