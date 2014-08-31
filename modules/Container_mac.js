module.exports = (function() {
  var Control = require('Control');
  var Utilities = require('Utilities');
  var $ = process.bridge.objc;
  var parseValue = Utilities.parseUnits;

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

  Object.defineProperty(Container.prototype, 'width', {
    configurable:true,
    get:function() { return this.private.user.width; },
    set:function(e) {
      if(this.private.user.left !== null && this.private.user.right !== null) 
        throw new Error('A width cannot be set on an item that has a left and right set.');
      var percent = false;
      var tmp = this.private.user.width = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.width = this.private.user.width;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent && tmp < 0) throw new Error('Value cannot be negative.');
      if(this.private.constraints.width !== null) 
        this.private.parent.removeLayoutConstraint(this.private.constraints.width);
      if(percent) {
        this.private.constraints.width = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'width',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'width'
        });
      } else {
        this.private.constraints.width = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'width',
          multiplier:1.0, constant:tmp, 
          relationship:'='
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'height', {
    configurable:true,
    get:function() { return this.private.user.height; },
    set:function(e) {
      if(this.private.user.bottom !== null && this.private.user.top !== null) 
        throw new Error('A height cannot be set on an item that has a top and bottom set.');
      var percent = false;
      var tmp = this.private.user.height = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.height = this.private.user.height;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent && tmp < 0) throw new Error('Value cannot be negative.');
      if(this.private.constraints.height !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(this.private.constraints.height);
      if(percent) {
        this.private.constraints.height = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'height',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'height'
        });
      } else {
        this.private.constraints.height = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'height',
          multiplier:1.0, constant:tmp, 
          relationship:'='
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'top', {
    configurable:true,
    get:function() { return this.private.user.top; },
    set:function(e) {
      if(this.private.user.bottom !== null && this.private.user.height !== null) 
        throw new Error('A top cannot be set when the bottom and height have been set already.');
      var percent = false;
      var tmp = this.private.user.top = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.top = this.private.user.top;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(tmp < 0) throw new Error('Value cannot be negative.');
      if(this.private.constraints.top !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(this.private.user.constraints.top);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.top = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'top',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'bottom'
        });
      } else {
        this.private.constraints.top = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'top',
          multiplier:1.0, constant:tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'top'
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'bottom', {
    configurable:true,
    get:function() { return this.private.user.bottom; },
    set:function(e) {
      if(this.private.user.top !== null && this.private.user.height !== null) 
        throw new Error('A bottom cannot be set when the top and height have been set already.');
      var percent = false;
      var tmp = this.private.user.bottom = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.bottom = this.private.user.bottom;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(tmp < 0) throw new Error('Value cannot be negative.');
      if(this.private.constraints.bottom !== null && this.private.parent)
        this.private.parent.removeLayoutConstraint(this.private.constraints.bottom);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.bottom = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'bottom',
          multiplier:(1-tmp), constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'bottom'
        });
      } else {
        this.private.constraints.bottom = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'bottom',
          multiplier:1.0, constant:(-1)*tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'bottom'
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'right', {
    configurable:true,
    get:function() { return this.private.user.right; },
    set:function(e) {
      if(this.private.user.left !== null && this.private.user.width !== null) 
        throw new Error('A right cannot be set when the left and width have been set already.');
      var percent = false;
      var tmp = this.private.user.right = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.right = this.private.user.right;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(this.private.constraints.right !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(this.private.constraints.right);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.right = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'right',
          multiplier:(1-tmp), constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'right'
        });
      } else {
        this.private.constraints.right = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'right',
          multiplier:1.0, constant:(-1)*tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'right'
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'left', {
    configurable:true,
    get:function() { return this.private.user.left; },
    set:function(e) {
      if(this.private.user.right !== null && this.private.user.width !== null) 
        throw new Error('A left cannot be set when the right and width have been set already.');
      var percent = false;
      var tmp = this.private.user.left = e;
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.left = this.private.user.left;
        }.bind(this));
        return;
      }
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(this.private.constraints.left !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(constraintLeft);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.left = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'left',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'right'
        });
      } else {
        this.private.constraints.left = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'left',
          multiplier:1.0, constant:tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'left'
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'center', {
    configurable:true,
    get:function() { return this.private.user.center; },
    set:function(e) {
      var percent = false;
      var tmp = this.private.user.center = e;
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.center = this.private.user.center;
        }.bind(this));
        return;
      }
      if(this.private.constraints.center !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(this.private.constraints.center);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.center = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'center',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'center'
        });
      } else {
        this.private.constraints.center = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'center',
          multiplier:1.0, constant:tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'center'
        });
      }
    }
  });

  Object.defineProperty(Container.prototype, 'middle', {
    configurable:true,
    get:function() { return this.private.user.middle; },
    set:function(e) {
      var percent = false;
      var tmp = this.private.user.middle = e;
      if(e == null) tmp = e;
      else tmp = parseValue(e);
      if(!this.private.parent) {
        this.addEventListener('parent-attached', function() {
          this.middle = this.private.user.middle;
        }.bind(this));
        return;
      }

      if(this.private.constraints.middle !== null && this.private.parent) 
        this.private.parent.removeLayoutConstraint(this.private.constraints.middle);
      if(e == null) return;
      if(typeof e != 'number' && e.indexOf('%') > -1) percent = true;
      if(percent) {
        this.private.constraints.middle = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'middle',
          multiplier:tmp, constant:0.0, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'middle'
        });
      } else {
        this.private.constraints.middle = this.private.parent.addLayoutConstraint({ 
          priority:'required',
          firstItem:this, firstAttribute:'middle',
          multiplier:1.0, constant:tmp, 
          relationship:'=',
          secondItem:this.private.parent, secondAttribute:'middle'
        });
      }
    }
  });

  return Container;
})();