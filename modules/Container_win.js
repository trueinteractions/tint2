module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var $ = process.bridge.dotnet;
  var parseValue = utilities.parseUnits;

  function Container(NativeObjectClass, NativeViewClass, options) {
    if(NativeObjectClass)
      Control.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Control.call(this, $.System.Windows.Control, $.System.Windows.Control, options);
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
      this.nativeView.Children.Add(control.native);
      control.fireEvent('parent-attached', [this]);
      this.fireEvent('child-attached', [control]);
    }
  }

  Container.prototype.removeChild = function(control) {
    this.fireEvent('remove', element);
    if(this.private.children.indexOf(control) != -1) 
      this.private.children.splice(children.indexOf(control),1);
    this.nativeView.Children.Add(control.native);
    control.fireEvent('parent-dettached', [this]);
    this.fireEvent('child-dettached', [control]);
  }

  Container.prototype.scrollTo = function(x, y) {
    var b = this.bounds;
    //this.nativeView('scrollPoint', $.NSMakePoint(x,b.height - y));
    //http://msdn.microsoft.com/en-us/library/system.windows.controls.scrollviewer.scrolltohorizontaloffset(v=vs.110).aspx
    //http://msdn.microsoft.com/en-us/library/system.windows.controls.scrollviewer.scrolltoverticaloffset(v=vs.110).aspx
  }

  return Container;
})();