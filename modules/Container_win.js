module.exports = (function() {
  if(global.__TINT.Container) {
    return global.__TINT.Container;
  }
  var Control = require('Control');
  var $ = process.bridge.dotnet;
  var util = require('Utilities');

  function Container(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.AutoLayout.AutoLayoutPanel;
    this.nativeViewClass = this.nativeViewClass || $.AutoLayout.AutoLayoutPanel;
    Control.call(this, properties, options, inherited || true);
    this.private.children = [];

    util.setProperties(this, properties, inherited);
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  Object.defineProperty(Container.prototype, 'children', { get:function() { return this.private.children; } });

  Container.prototype.appendChild = function(control) {
    if(this === control) {
      throw new Error('A control cannot be added as a child to itself.');
    }
    if(Array.isArray(control)) {
      for(var i=0; i < control.length; i++) {
        this.appendChild(control[i]);
      }
    } else {
      control = this.fireEvent('before-child-attached', [control]) || control;
      this.private.children.push(control);
      this.nativeView.Children.Add(control.native);
      if(control.fireEvent) {
        control.fireEvent('parent-attached', [this]);
      }
      this.fireEvent('child-attached', [control]);
    }
  };

  Container.prototype.appendChildAt = function(control, ndx) {
    assert(ndx < this.children.length, 'The index specified was out of bounds (e.g., was way too large or small).');
    var atControl = this.children[ndx];
    if(this === control) {
      throw new Error('A control cannot be added as a child to itself.');
    }
    control = this.fireEvent('before-child-attached', [control]) || control;
    this.private.children.splice(ndx, 0, control);
    this.nativeView.Children.Insert(control, this.nativeView.Children.IndexOf(atControl.native));
    if(control.fireEvent) {
      control.fireEvent('parent-attached', [this]);
    }
    this.fireEvent('child-attached', [control]);
  };

  Container.prototype.removeChild = function(control) {
    control = this.fireEvent('before-child-dettached', [control]) || control;
    if(this.private.children.indexOf(control) !== -1) {
      this.private.children.splice(this.private.children.indexOf(control),1);
    }
    this.nativeView.Children.Remove(control.native);
    if(control.fireEvent) {
      control.fireEvent('parent-dettached', [this]);
    }
    this.fireEvent('child-dettached', [control]);
  };

  Container.prototype.scrollTo = function(x, y) {
    if(this.native.ScrollToVerticalOffset) {
      this.native.ScrollToVerticalOffset(y);
      this.native.ScrollToHorizontalOffset(x);
    } else if (this.private.parent && this.private.parent.native.ScrollToVerticalOffset) {
      this.private.parent.native.ScrollToVerticalOffset(y);
      this.private.parent.native.ScrollToHorizontalOffset(x);
    }
  };

  global.__TINT.Container = Container;
  return Container;
})();