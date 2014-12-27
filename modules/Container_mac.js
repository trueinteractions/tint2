module.exports = (function() {
  if(global.__TINT.Container) {
    return global.__TINT.Container;
  }
  var Control = require('Control');
  var util = require('Utilities');
  var $ = process.bridge.objc;
  var parseValue = util.parseUnits;

  /**
   * @class Container
   * @description A generic standard container for other components, this component allows you to group
   *              elements together in a single nested view. Most components within Tint's framework 
   *              inherit (or use) the functionality of this component as a starting point. This component
   *              is useful when a set of components rely on one another to accomplish a common behavior. 
   *              
   *              For example, a file selection may have both a text input and a button associated with it,
   *              combining the two into a new control using the container is a good way of reusing controls.
   * @extends Control
   */
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

  util.def(Container.prototype, 'children', function() { return this.private.children; });

  /**
   * @method appendChild
   * @memberof Container
   * @param {Control} control A control to add as a child to this control.
   * @description Append child adds the passed in control as a child to this control. 
   * @see removeChild
   */
  /**
   * @method appendChild
   * @memberof Container
   * @param {Array} controls An array of controls that you'd like to add as children to this control.
   * @description Append child adds the passed in array (or several) controls as a children to this control. 
   * @see removeChild
   */
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
  /**
   * @method removeChild
   * @memberof Container
   * @param {Control} control The control to remove from this control.
   * @description Remove child removes the passed in control from the list of children controls it has.
   * @see removeChild
   */
  Container.prototype.removeChild = function(control) {
    this.fireEvent('remove', element);
    if(this.private.children.indexOf(control) != -1) 
      this.private.children.splice(children.indexOf(control),1);

    control.nativeView('removeFromSuperview');
    control.fireEvent('parent-dettached', [this]);
    this.fireEvent('child-dettached', [control]);
  }

  //TODO: Remove this? Inconsistant with windows version.
  Container.prototype.scrollTo = function(x, y) {
    var b = this.bounds;
    this.nativeView('scrollPoint', $.NSMakePoint(x,b.height - y));
  }

  global.__TINT.Container = Container;
  return Container;
})();