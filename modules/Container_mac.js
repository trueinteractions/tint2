module.exports = (function() {
  var Control = require('Control');
  var $ = process.bridge.objc;

  function Container(NativeObjectClass, NativeViewClass, options) {
    Control.call(this, NativeObjectClass, NativeViewClass, options);
    var children = [], parent = null;

    this.layoutObjcConstraints = [];

    this.addEventListener('parent-attached', function(p) { parent = p; });
    this.addEventListener('parent-dettached', function(p) { parent = null; });

    Object.defineProperty(this, 'alpha', {
      get:function() { return this.native('alphaValue'); },
      set:function(e) { this.native('setAlphaValue', e); }
    });

    Object.defineProperty(this, 'children', { get:function() { return children; }});

    this.appendChild = function(control) {
      children.push(control);
      this.nativeView('addSubview',control.nativeView);
      control.fireEvent('parent-attached', [this]);
      this.fireEvent('child-attached', [control]);
    }

    this.removeChild = function(control) {
      this.fireEvent('remove', element);
      if(children.indexOf(control) != -1) 
        children.splice(children.indexOf(control),1);

      control.nativeView('removeFromSuperview');
      control.fireEvent('parent-dettached', [this]);
      this.fireEvent('child-dettached', [control]);
    }

    this.addLayoutConstraint = function(layoutObject) {
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
      return this.layoutObjcConstraints.push({js:layoutObject, objc:constraint}) - 1;
    }.bind(this);

    this.removeLayoutConstraint = function(index) {
      var objcNative = this.layoutObjcConstraints[index].objc;
      this.layoutObjcConstraints.splice(index, 1);
      this.nativeView('removeConstraint',objcNative);
      this.nativeView('updateConstraintsForSubtreeIfNeeded');
      this.nativeView('layoutSubtreeIfNeeded');
    }.bind(this);

    var userWidth = null, userHeight = null, userLeft = null, userRight = null, 
        userTop = null, userBottom = null, userCenter = null, userMiddle = null,
        constraintWidth = null, constraintHeight = null, constraintLeft = null, 
        constraintRight = null, constraintTop = null, constraintBottom = null, 
        constraintCenter = null, constraintMiddle = null;

    function parseValue(e) {
      if(typeof e == 'number') return e;
      if(e.indexOf('%') > -1) {
        e = e.replace('%','').trim();
        e = parseInt(e);
        e = e/100;
      } else {
        e = e.replace('px','').trim();
        e = parseInt(e);
      }
      return e;
    }

    Object.defineProperty(this, 'width', {
      configurable:true,
      get:function() { return userWidth; },
      set:function(e) {
        if(userLeft !== null && userRight !== null) 
          throw new Error('A width cannot be set on an item that has a left and right set.');
        var percent = false;
        var tmp = userWidth = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.width = userWidth;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(e == null) return;
        if(e.indexOf('%') > -1) percent = true;
        if(percent && tmp < 0) throw new Error('Value cannot be negative.');
        if(constraintWidth !== null) parent.removeLayoutConstraint(constraintWidth);
        if(percent) {
          constraintWidth = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'width',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'width'
          });
        } else {
          constraintWidth = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'width',
            multiplier:1.0, constant:tmp, 
            relationship:'='
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'height', {
      configurable:true,
      get:function() { return userHeight; },
      set:function(e) {
        if(userBottom !== null && userTop !== null) 
          throw new Error('A height cannot be set on an item that has a top and bottom set.');
        var percent = false;
        var tmp = userHeight = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.height = userHeight;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(e == null) return;
        if(e.indexOf('%') > -1) percent = true;
        if(percent && tmp < 0) throw new Error('Value cannot be negative.');
        if(constraintHeight !== null && parent) parent.removeLayoutConstraint(constraintHeight);
        if(percent) {
          constraintHeight = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'height',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'height'
          });
        } else {
          constraintHeight = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'height',
            multiplier:1.0, constant:tmp, 
            relationship:'='
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'top', {
      configurable:true,
      get:function() { return userTop; },
      set:function(e) {
        if(userBottom !== null && userHeight !== null) 
          throw new Error('A top cannot be set when the bottom and height have been set already.');
        var percent = false;
        var tmp = userTop = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.top = userTop;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(tmp < 0) throw new Error('Value cannot be negative.');
        if(constraintTop !== null && parent) parent.removeLayoutConstraint(constraintTop);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintTop = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'top',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'bottom'
          });
        } else {
          constraintTop = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'top',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'top'
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'bottom', {
      configurable:true,
      get:function() { return userBottom; },
      set:function(e) {
        if(userTop !== null && userHeight !== null) 
          throw new Error('A bottom cannot be set when the top and height have been set already.');
        var percent = false;
        var tmp = userBottom = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.bottom = userBottom;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(tmp < 0) throw new Error('Value cannot be negative.');
        if(constraintBottom !== null && parent)
          parent.removeLayoutConstraint(constraintBottom);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintBottom = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'bottom',
            multiplier:(1-tmp), constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'bottom'
          });
        } else {
          constraintBottom = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'bottom',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'bottom'
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'right', {
      configurable:true,
      get:function() { return userRight; },
      set:function(e) {
        if(userLeft !== null && userWidth !== null) 
          throw new Error('A right cannot be set when the left and width have been set already.');
        var percent = false;
        var tmp = userRight = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.right = userRight;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(constraintRight !== null && parent) parent.removeLayoutConstraint(constraintRight);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintRight = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'right',
            multiplier:(1-tmp), constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'right'
          });
        } else {
          constraintRight = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'right',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'right'
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'left', {
      configurable:true,
      get:function() { return userLeft; },
      set:function(e) {
        if(userRight !== null && userWidth !== null) 
          throw new Error('A left cannot be set when the right and width have been set already.');
        var percent = false;
        var tmp = userLeft = e;
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.left = userLeft;
          }.bind(this));
          return;
        }
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(constraintLeft !== null && parent) parent.removeLayoutConstraint(constraintLeft);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintLeft = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'left',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'right'
          });
        } else {
          constraintLeft = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'left',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'left'
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'center', {
      configurable:true,
      get:function() { return userCenter; },
      set:function(e) {
        var percent = false;
        var tmp = userCenter = e;
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.center = userCenter;
          }.bind(this));
          return;
        }
        if(constraintCenter !== null && parent) parent.removeLayoutConstraint(constraintCenter);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintCenter = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'center',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'center'
          });
        } else {
          constraintCenter= parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'center',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'center'
          });
        }
      }.bind(this)
    });

    Object.defineProperty(this, 'middle', {
      configurable:true,
      get:function() { return userMiddle; },
      set:function(e) {
        var percent = false;
        var tmp = userMiddle = e;
        if(e == null) tmp = e;
        else tmp = parseValue(e);
        if(!parent) {
          this.addEventListener('parent-attached', function() {
            this.middle = userMiddle;
          }.bind(this));
          return;
        }
        if(constraintMiddle !== null && parent) parent.removeLayoutConstraint(constraintMiddle);
        if(e == null) return;
        if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
        if(percent) {
          constraintMiddle = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'middle',
            multiplier:tmp, constant:0.0, 
            relationship:'=',
            secondItem:parent, secondAttribute:'middle'
          });
        } else {
          constraintMiddle = parent.addLayoutConstraint({ 
            priority:'required',
            firstItem:this, firstAttribute:'middle',
            multiplier:1.0, constant:tmp, 
            relationship:'=',
            secondItem:parent, secondAttribute:'middle'
          });
        }
      }.bind(this)
    });
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  return Container;
})();