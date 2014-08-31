module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var $ = process.bridge.objc;
  var parseValue = utilities.parseUnits;

  function Container(NativeObjectClass, NativeViewClass, options) {
    Control.call(this, NativeObjectClass, NativeViewClass, options);

    this.addEventListener('parent-attached', function(p) {
      //TODO: Attach constraints? (rather than in the width set?)
      this.private.parent = p;
    }.bind(this));
    this.addEventListener('parent-dettached', function(p) { 
      //TODO: Dettach constraints
      this.private.parent = null; 
    }.bind(this));

    this.private.user = {
      width:null, height:null,
      left:null, right:null, top:null, bottom:null,
      center:null, middle:null
    };
    this.private.constraints = {
      width:null, height:null,
      left:null, right:null, top:null, bottom:null,
      center:null, middle:null
    };
    this.private.parent = null;
    this.private.children = [];
    this.private.layoutObjcConstraints = [];
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  Object.defineProperty(Container.prototype, 'alpha', {
    get:function() { return this.native('alphaValue'); },
    set:function(e) { this.native('setAlphaValue', e); }
  });

  Object.defineProperty(Container.prototype, 'children', { 
    get:function() { return this.private.children; }
  });

  Container.prototype.appendChild = function(control) {
    if(Array.isArray(control)) {
      for(var i=0; i < control.length; i++) this.appendChild(control[i]);
    } else {
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

  Container.prototype.addLayoutConstraint = function(layoutObject) {
    var priority =  layoutObject.priority == 'required' ? 1000 :
                    layoutObject.priority == 'high' ? 750 : 
                    layoutObject.priority == 'medium' ? 500 : 250;

    var firstAttribute =  layoutObject.firstAttribute == 'left' ? $.NSLayoutAttributeLeft :
                          layoutObject.firstAttribute == 'right' ? $.NSLayoutAttributeRight :
                          layoutObject.firstAttribute == 'top' ? $.NSLayoutAttributeTop :
                          layoutObject.firstAttribute == 'bottom' ? $.NSLayoutAttributeBottom :
                          layoutObject.firstAttribute == 'leading' ? $.NSLayoutAttributeLeading :
                          layoutObject.firstAttribute == 'trailing' ? $.NSLayoutAttributeTrailing :
                          layoutObject.firstAttribute == 'width' ? $.NSLayoutAttributeWidth :
                          layoutObject.firstAttribute == 'height' ? $.NSLayoutAttributeHeight :
                          layoutObject.firstAttribute == 'center' ? $.NSLayoutAttributeCenterX :
                          layoutObject.firstAttribute == 'middle' ? $.NSLayoutAttributeCenterY :
                          layoutObject.firstAttribute == 'baseline' ? $.NSLayoutAttributeBaseline :
                                                                      $.NSLayoutAttributeNotAnAttribute

    var secondAttribute = layoutObject.secondAttribute == 'left' ? $.NSLayoutAttributeLeft :
                          layoutObject.secondAttribute == 'right' ? $.NSLayoutAttributeRight :
                          layoutObject.secondAttribute == 'top' ? $.NSLayoutAttributeTop :
                          layoutObject.secondAttribute == 'bottom' ? $.NSLayoutAttributeBottom :
                          layoutObject.secondAttribute == 'leading' ? $.NSLayoutAttributeLeading :
                          layoutObject.secondAttribute == 'trailing' ? $.NSLayoutAttributeTrailing :
                          layoutObject.secondAttribute == 'width' ? $.NSLayoutAttributeWidth :
                          layoutObject.secondAttribute == 'height' ? $.NSLayoutAttributeHeight :
                          layoutObject.secondAttribute == 'center' ? $.NSLayoutAttributeCenterX :
                          layoutObject.secondAttribute == 'middle' ? $.NSLayoutAttributeCenterY :
                          layoutObject.secondAttribute == 'baseline' ? $.NSLayoutAttributeBaseline :
                                                                       $.NSLayoutAttributeNotAnAttribute

    var relation =  layoutObject.relationship == '<' ? $.NSLayoutRelationLessThanOrEqual :
                    layoutObject.relationship == '>' ? $.NSLayoutRelationGreaterThanOrEqual :
                                                       $.NSLayoutRelationEqual;

    var firstItem = layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView;
    var secondItem = layoutObject.secondItem ? layoutObject.secondItem.nativeView : null;
    var multiplier = layoutObject.multiplier ? layoutObject.multiplier : 0;
    var constant = layoutObject.constant ? layoutObject.constant : 0 ;
    var constraint = $.NSLayoutConstraint('constraintWithItem',firstItem,'attribute',firstAttribute,
                                          'relatedBy',relation,'toItem',secondItem,'attribute',secondAttribute,
                                          'multiplier', multiplier, 'constant', constant);

    this.nativeView('addConstraint',constraint);
    return this.private.layoutObjcConstraints.push({js:layoutObject, objc:constraint}) - 1;
  }

  Container.prototype.removeLayoutConstraint = function(index) {
    var objcNative = this.private.layoutObjcConstraints[index].objc;
    this.private.layoutObjcConstraints.splice(index, 1);
    this.nativeView('removeConstraint',objcNative);
    this.nativeView('updateConstraintsForSubtreeIfNeeded');
    this.nativeView('layoutSubtreeIfNeeded');
  }

  function createLayoutProperty(name, percentName, percentFunc, scalarName, scalarFunc, notAllowed) {
    Object.defineProperty(Container.prototype, name, {
      get: function() { return this.private.user[name]; },
      set: function(value) {

        if(notAllowed && 
            notAllowed[0] && this.private.user[notAllowed[0]] !== null && 
            notAllowed[1] && this.private.user[notAllowed[1]] !== null)
          throw new Error('A '+name+' cannot be set when the '+notAllowed[0]+' and '+notAllowed[1]+' have been set already.');

        this.private.user[name] = value;

        if(!this.private.parent) {
          this.addEventListener('parent-attached', function() { 
            this[name] = this.private.user[name]; 
          }.bind(this));
          return;
        }

        var parsedValue = utilities.parseUnits(value);
        var layoutObject = {priority:'required', firstItem:this, firstAttribute:name, relationship:'=', secondItem:this.private.parent};

        if(this.private.constraints[name] !== null) 
          this.private.parent.removeLayoutConstraint(this.private.constraints[name]);

        if(typeof value != 'number' && value.indexOf('%') > -1) {
          layoutObject.multiplier = percentFunc(parsedValue);
          layoutObject.constant = 0.0;
          layoutObject.secondAttribute = percentName;
        } else {
          layoutObject.multiplier = 1.0;
          layoutObject.constant = scalarFunc(parsedValue);
          layoutObject.secondAttribute = scalarName;
        }

        if(!layoutObject.secondAttribute) layoutObject.secondItem = null;
        this.private.constraints[name] = this.private.parent.addLayoutConstraint(layoutObject);
      }
    });
  }

  function identity(v) { return v; }
  function inverse(v) { return (1-v); }
  function negate(v) { return -1*v; }

  createLayoutProperty('top', 'bottom', identity, 'top', identity, ['bottom','height']);
  createLayoutProperty('bottom', 'bottom', inverse, 'bottom', negate, ['top','height']);

  createLayoutProperty('left', 'right', identity, 'left', identity, ['right','width']);
  createLayoutProperty('right', 'right', inverse, 'right', negate, ['left','width']);

  createLayoutProperty('height', 'height', identity, null, identity, ['top','bottom']);
  createLayoutProperty('width', 'width', identity, null, identity, ['left','right']);

  createLayoutProperty('middle', 'middle', identity, 'middle', identity, null);
  createLayoutProperty('center', 'center', identity, 'center', identity, null);

  return Container;
})();