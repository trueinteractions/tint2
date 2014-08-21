module.exports = (function() {
  var Control = require('Control');
  var $ = process.bridge.objc;

  function Container(NativeObjectClass, NativeViewClass, options) {
    Control.call(this, NativeObjectClass, NativeViewClass, options);
    var layout = [], children = [];

    Object.defineProperty(this, 'layout',{ get:function() { return layout; }});

    Object.defineProperty(this, 'alpha', {
      get:function() { return this.native('alphaValue'); },
      set:function(e) { this.native('setAlphaValue', e); }
    });

    Object.defineProperty(this, 'children', { get:function() { return children; }});

    this.appendChild = function(control) {
      children.push(control);
      this.nativeView('addSubview',control.nativeView);
    }

    this.removeChild = function(control) {
      this.fireEvent('remove', element);
      if(children.indexOf(control) != -1) 
        children.splice(children.indexOf(control),1);
      control.nativeView('removeFromSuperview');
    }

    // { relation: , priority: , firstItem: , secondItem: , 
    //    firstAttribute: secondAttribute: multiplier: constant: }
    // relationship <, =, >
    // attribute: left,right,top,bottom,leading,trailing,width,height,center,middle,baseline
    // priority: required, high, medium low
    /*
      NSLayoutAttributeLeft = 1,
      NSLayoutAttributeRight,
      NSLayoutAttributeTop,
      NSLayoutAttributeBottom,
      NSLayoutAttributeLeading,
      NSLayoutAttributeTrailing,
      NSLayoutAttributeWidth,
      NSLayoutAttributeHeight,
      NSLayoutAttributeCenterX,
      NSLayoutAttributeCenterY,
      NSLayoutAttributeBaseline,
      */
    /*
       NSLayoutPriorityRequired = 1000,
       NSLayoutPriorityDefaultHigh = 750,
       NSLayoutPriorityDragThatCanResizeWindow = 510,
       NSLayoutPriorityWindowSizeStayPut = 500,
       NSLayoutPriorityDragThatCannotResizeWindow = 490,
       NSLayoutPriorityDefaultLow = 250,
       NSLayoutPriorityFittingSizeCompression = 50,
       */
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

      layout.push({js:layoutObject, objc:constraint});
      this.nativeView('addConstraint',constraint);
      return layout.length;
    }

    this.removeLayoutConstraint = function(index) {
      var objcNative = layout[index].splice(index, 1)[0];
      nativeView('removeConstraint',objNative);
      nativeView('updateConstraintsForSubtreeIfNeeded');
      nativeView('layoutSubtreeIfNeeded');
    }
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  return Container;
})();