module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.objc, 'Failure to establish objective-c bridge.');

  if(global.__TINT.Control) {
    return global.__TINT.Control;
  }

  var $ = process.bridge.objc;
  var util = require('Utilities');

  function addTrackingArea() {
    var bounds = this.nativeView('bounds');
    var options = $.NSTrackingMouseEnteredAndExited | $.NSTrackingMouseMoved | $.NSTrackingActiveInActiveApp | $.NSTrackingInVisibleRect;
    this.private.trackingArea = $.NSTrackingArea('alloc')('initWithRect', bounds, 'options', options, 'owner', this.nativeView, 'userInfo', null);
    this.nativeView('addTrackingArea',this.private.trackingArea);
  }

  function mouseDown(self, cmd, events) {
    this.fireEvent('mousedown');
    self.super('mouseDown',events);
    if(this.private.options.mouseDownBlocks) {
      this.fireEvent('mouseup');
      this.fireEvent('click');
    }
  }
  function mouseUp(self, cmd, events) { 
    this.fireEvent('mouseup'); 
    this.fireEvent('click');
    self.super('mouseUp',events); 
  }
  function rightMouseDown(self, cmd, events) { 
    this.fireEvent('rightmousedown');
    self.super('rightMouseDown',events); 
  }
  function rightMouseUp(self, cmd, events) {
    this.fireEvent('rightmouseup');
    self.super('rightMouseUp',events);
  }
  function keyDown(self, cmd, events) { 
    this.fireEvent('keydown');
    self.super('keyDown',events);
  }
  function keyUp(self, cmd, events) { 
    this.fireEvent('keyup'); 
    self.super('keyUp',events);
  }
  function mouseEntered(self, cmd, events) { 
    this.fireEvent('mouseenter');
    self.super('mouseEntered',events);
  }
  function mouseExited(self, cmd, events) { 
    this.fireEvent('mouseexit'); 
    self.super('mouseExited',events); 
  }
  function mouseMoved(self, cmd, events) { 
    this.fireEvent('mousemove'); 
    self.super('mouseMoved',events);
  }
  /**
   * @class Control
   * @description The control class is the base class that provides all common methods used
   *              and available on almost every Tint control.  This cannot be initialized on its own
   *              as its only purpose is to provide common functionality to other controls. To
   *              initialize a basic control use Container or Box.
   * @see Container
   * @see Box
   */
  function Control(options) {
    options = options || {};
    options.delegates = options.delegates || [];

    Object.defineProperty(this, 'private', {
      configurable:false,
      enumerable:false,
      value:{
        events:{}, parent:null, trackingArea:null, needsMouseTracking:0,
        user:{width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        states:{}, options:options
      }
    });

    if(!options.nonStandardEvents) {
      options.delegates = options.delegates.concat([
        /**
         * @event mousedown
         * @memberof Control
         * @description Fires when a user presses the left mouse button down and before it's released.
         */
        ['mouseDown:','v@:@', mouseDown.bind(this)],
        /**
         * @event mouseup
         * @memberof Control
         * @description Fires when a user releases the left mouse button and after the mousedown event.
         */
        ['mouseUp:','v@:@', mouseUp.bind(this)],
        /**
         * @event rightmousedown
         * @memberof Control
         * @description Fires when a user presses the right mouse button down and before it's released.
         */
        ['rightMouseDown:','v@:@', rightMouseDown.bind(this)],
        /**
         * @event rightmouseup
         * @memberof Control
         * @description Fires when a user releases the right mouse button and after the rightmousedown event.
         */
        ['rightMouseUp:','v@:@', rightMouseUp.bind(this)],
        /**
         * @event keydown
         * @memberof Control
         * @description Fires when a keyboard key is down but before its released.
         */
        ['keyDown:','v@:@', keyDown.bind(this)],
        /**
         * @event keyup
         * @memberof Control
         * @description Fires when a keyboard key is up and after the keydown event.
         */
        ['keyUp:','v@:@', keyUp.bind(this)],
        /**
         * @event mouseenter
         * @memberof Control
         * @description Fires when the mouse cursor enters the visible bounds of the control.
         */
        ['mouseEntered:','v@:@', mouseEntered.bind(this)],
        /**
         * @event mouseexit
         * @memberof Control
         * @description Fires when the mouse cursor leaves the visible bounds of the control.
         */
        ['mouseExited:','v@:@', mouseExited.bind(this)],
        /**
         * @event mousemove
         * @memberof Control
         * @description Fires when the mouse moves, and only when its moving over the control.
         */
        ['mouseMoved:','v@:@', mouseMoved.bind(this)]
      ]);
    }

    var nativeViewExtended = this.nativeViewClass.extend(this.nativeViewClass.getName()+Math.round(Math.random()*10000000));
    options.delegates.forEach(function(item) { nativeViewExtended.addMethod(item[0],item[1],item[2]); });
    nativeViewExtended.register();

    if(!options.doNotInitialize) {
      this.nativeView = nativeViewExtended('alloc')('init');
      this.native = (this.nativeClass === this.nativeViewClass) ? this.nativeView : this.nativeClass('alloc')('init');
      this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    }

    this.nativeViewClass = nativeViewExtended;
    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function() { this.private.parent = null; }.bind(this));

    // Fires when a new listener is attached. This only filters listeners
    // that are mouse enter, exit and move, it attaches specific handlers
    // to support these functions that shouldn't normal exist if no one is
    // listening to these events (for speed reasons since they're high-throughput).
    this.addEventListener('event-listener-added', function(event) {
      if(event === "mouseenter" || event === "mouseexit" || event === "mousemove") {
        this.private.needsMouseTracking++;
        if(this.private.needsMouseTracking === 1 && this.nativeView('window')) {
          addTrackingArea.apply(this,null);
        } else if (this.private.needsMouseTracking === 1) {
          this.addEventListener('parent-attached', addTrackingArea.bind(this));
        }
      }
    }.bind(this));

    // If the event mouse move is removed (or mouse exit/enter then make sure
    // we disassociate our tracking and firing of these events internally to save
    // ourselves quite a bit of an unnecessary performance hit.
    this.addEventListener('event-listener-removed', function(event) {
      if(event === "mouseenter" || event === "mouseexit" || event === "mousemove") {
        this.private.needsMouseTracking--;
        if(this.private.needsMouseTracking === 0) {
          this.nativeView('removeTrackingArea',this.private.trackingArea);
          this.private.trackingArea('release');
          this.private.trackingArea = null;
        }
      }
    }.bind(this));
  }

  /**
   * @member animateOnSizeChange
   * @type {boolean}
   * @memberof Control
   * @description This controls whether size changes to this Control (or Window) should animate when changed. 
   *              The default operating system animation is used to animate different size changes.
   * @default false
   */
  Control.prototype.animateOnSizeChange = false;
  /**
   * @member animateOnPositionChange
   * @type {boolean}
   * @memberof Control
   * @description This controls whether position changes in this Control (or Window) should animate when changed.
   *              The default operating system animation is used to animate different position changes.
   * @default false
   */
  Control.prototype.animateOnPositionChange = false;

  /**
   * @member alpha
   * @type {number}
   * @memberof Control
   * @description Gets or sets the translucency of the control.  This is a range 
   *              from 0 to 1 (where 1 = completely visible, 0 = completely hidden).
   * @example
   *  require('Common'); // include defaults, creates application context.
   *  var win = new Window(); // create a new window.
   *  win.visible = true; // make the window visible.
   *  var dateWell = new DateWell();
   *  win.title = "Date well should be 0.5 alpha.";
   *  dateWell.style = "clock";
   *  dateWell.range = true;
   *  win.appendChild(dateWell);
   *  dateWell.left = dateWell.top = 0;
   *  dateWell.width = '300px';
   *  dateWell.alpha = 0.5; // Set our newly added component to 50% visible.
   * @screenshot-window {win}
   * @screenshot-control {dateWell}
   */
  util.makePropertyNumberType(Control.prototype, 'alpha', 'alphaValue','setAlphaValue');

  /**
   * @member visible
   * @type {boolean}
   * @memberof Control
   * @description Gets or sets whether the control is visible or not.
   * @example
   *  require('Common'); // include defaults, creates application context.
   *  var win = new Window(); // create a new window.
   *  win.visible = true; // make the window visible.
   *  var dateWell = new DateWell();
   *  dateWell.style = "clock";
   *  dateWell.range = true;
   *  win.appendChild(dateWell);
   *  dateWell.left = dateWell.top = 0;
   *  dateWell.width = '300px';
   *  dateWell.visible = false; // Make our date picker hidden.
   * @screenshot-window {win}
   */
  util.makePropertyBoolType(Control.prototype, 'visible', 'isHidden', 'setHidden', {inverse:true});

  // Helper function to convert OSX coordinate spaces to 
  // top-left.
  function convY(frame, parentFrame) {
    frame.origin.y = parentFrame.size.height - frame.origin.y - frame.size.height;
    return frame;
  }

  /**
   * @member boundsOnScreen
   * @type {object}
   * @memberof Control
   * @attrib readonly
   * @description Gets an object with the properties width, height, x, and y that represent the position of the
   *              control on the current screen (in logical pixels or adjusted for the monitors DPI or scalefactor)
   *              where the coordinates start from the top (y) and left (x) of the screen. If the control is not on 
   *              a window (e.g., Note it can still in the UI, such as a status bar but not on a Tint window) 
   *              this throws an error.
   * @noscreenshot
   * @example
   *  require('Common'); // include defaults, creates application context.
   *  var win = new Window(); // create a new window.
   *  win.visible = true; // make the window visible.
   *  var bounds = win.boundsOnScreen;
   *  console.log('Windows content area is '+bounds.x+' from the left.');
   *  console.log('Windows content area is '+bounds.y+' from the top.');
   *  console.log('Windows content area is '+bounds.width+' wide.');
   *  console.log('Windows content area is '+bounds.height+' tall.');
   */
  util.def(Control.prototype, 'boundsOnScreen',
    function() {
      if(!this.nativeView('superview')) {
        return null;
      }
      var b = this.nativeView('window')('convertRectToScreen',this.nativeView('convertRect',this.nativeView('bounds'),'toView',null));
      var bnds = convY(b,$.NSScreen('mainScreen')('frame'));
      var offsetY = 0;
      if(!this.nativeView('isEqual',this.nativeView('window')('contentView'))) {
        offsetY = 1;
      }
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  /**
   * @member boundsOnWindow
   * @type {object}
   * @memberof Control
   * @attrib readonly
   * @description Gets an object with the properties width, height, x, and y that represent the position of the
   *              control on the current window content area (in logical pixels or adjusted for the monitors DPI or scalefactor)
   *              where the coordinates start from the top (y) and left (x) of the window's content area. Note that
   *              this takes into account non-content area of the window such as frame.  E.g., if your window is at 500 pixels
   *              from the top, and your control is placed at 20 pixels from the top of the window the boundsOnWindow will return
   *              500 + (the native windows titlebar height) + 20.  If the control is not on a window this throws an error.
   * @noscreenshot
   * @example
   *  require('Common'); // include defaults, creates application context.
   *  var win = new Window(); // create a new window.
   *  win.visible = true; // make the window visible.
   *
   *  var bounds = win.boundsOnWindow;
   *  console.log('Windows content area is '+bounds.x+' from the left corner of window frame.');
   *  console.log('Windows content area is '+bounds.y+' from the top of the window frame.');
   *  console.log('Windows content area is '+bounds.width+' wide.');
   *  console.log('Windows content area is '+bounds.height+' tall.');
   *
   *  var buttonNormal = new Button();
   *  buttonNormal.title = "Hello"; // set its text label.
   *  win.appendChild(buttonNormal); // add button to window.
   *  buttonNormal.left = buttonNormal.top = 0; // position top left.
   *
   *  var bounds = buttonNormal.boundsOnWindow; // get the buttons location.
   *  console.log('The button is '+bounds.x+' from the left corner of window frame.');
   *  console.log('The button is '+bounds.y+' from the top of the window frame.');
   *  console.log('The button is '+bounds.width+' wide.');
   *  console.log('The button is '+bounds.height+' tall.');
   */
  util.def(Control.prototype, 'boundsOnWindow',
    function() {
      if(!this.nativeView('superview')) {
        return null;
      }
      var bnds = convY(this.nativeView('frame'), this.nativeView('window')('frame'));
      var offsetY = 0;
      if(!this.nativeView('isEqual',this.nativeView('window')('contentView'))) {
        offsetY = 1;
      }
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  /**
   * @member bounds
   * @type {object}
   * @memberof Control
   * @attrib readonly
   * @description Gets an object with the properties width, height, x, and y that represent the position of the
   *              control from its parent control (in logical pixels or adjusted for the monitors DPI or scalefactor)
   *              where the coordinates start from the top (y) and left (x) of the parent. If the control is not on 
   *              a window (e.g., Note it can still in the UI, such as a status bar but not on a Tint window)
   *              this throws an error.
   * @noscreenshot
   * @example
   *  require('Common'); // include defaults, creates application context.
   *  var win = new Window(); // create a new window.
   *  win.visible = true; // make the window visible.
   *  var buttonNormal = new Button();
   *  buttonNormal.title = "Hello"; // set its text label.
   *  win.appendChild(buttonNormal); // add button to window.
   *  buttonNormal.left = buttonNormal.top = 0; // position top left.
   *  var bounds = win.bounds;
   *  console.log('Button is '+bounds.x+' from the left.');
   *  console.log('Button is '+bounds.y+' from the top.');
   *  console.log('Button is '+bounds.width+' wide.');
   *  console.log('Button is '+bounds.height+' tall.');
   */
  util.def(Control.prototype, 'bounds',
    function() {
      if(!this.nativeView('superview')) {
        return null;
      }
      var bnds = convY(this.nativeView('frame'), this.nativeView('superview')('frame'));
      var offsetY = 0;
      if(this.nativeView('superview')('isEqual',this.nativeView('window')('contentView')) && bnds.origin.y === -1) {
        offsetY = 1;
      }
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  /**
   * @method addEventListener
   * @param {string} eventName The name of the control event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof Control
   * @description Adds an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonNormal = new Button();
   * buttonNormal.title = "Hello";
   * buttonNormal.middle = '100%'; // Vertically centered to window.
   * buttonNormal.center = '100%'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   * win.appendChild(buttonNormal);
   *
   * buttonNormal.addEventListener('mousedown', function() {
   *   console.log('mouse is down over button!');
   * });
   */

  /**
   * @method removeEventListener
   * @param {string} eventName The name of the control event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof Control
   * @description Removes an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonNormal = new Button();
   * buttonNormal.title = "Hello";
   * buttonNormal.middle = '100%'; // Vertically centered to window.
   * buttonNormal.center = '100%'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   * win.appendChild(buttonNormal);
   *
   * var mouseDown = function() {
   *   console.log('mouse is down over button!');
   * }
   * // Listen to event.
   * buttonNormal.addEventListener('mousedown', mouseDown);
   * // Stop listening to event.
   * buttonNormal.removeEventListener('mousedown', mouseDown);
   */
  util.defEvents(Control.prototype);

  var attributeMap = { 
    'left':$.NSLayoutAttributeLeft,
    'right':$.NSLayoutAttributeRight,
    'top':$.NSLayoutAttributeTop,
    'bottom':$.NSLayoutAttributeBottom,
    'leading':$.NSLayoutAttributeLeading,
    'trailing':$.NSLayoutAttributeTrailing,
    'width':$.NSLayoutAttributeWidth,
    'height':$.NSLayoutAttributeHeight,
    'center':$.NSLayoutAttributeCenterX,
    'middle':$.NSLayoutAttributeCenterY,
    'baseline':$.NSLayoutAttributeBaseline,
    '<':$.NSLayoutRelationLessThanOrEqual,
    '<=':$.NSLayoutRelationLessThanOrEqual,
    '>':$.NSLayoutRelationGreaterThanOrEqual, 
    '>=':$.NSLayoutRelationGreaterThanOrEqual,
    '=':$.NSLayoutRelationEqual,
    '==':$.NSLayoutRelationEqual
  };

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints)
    {
      return null;
    }
    var constraint = $.NSLayoutConstraint('constraintWithItem',
                        (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView),
                        'attribute',(attributeMap[layoutObject.firstAttribute] || $.NSLayoutAttributeNotAnAttribute),
                        'relatedBy',(attributeMap[layoutObject.relationship] || $.NSLayoutRelationEqual),
                        'toItem',(layoutObject.secondItem ? layoutObject.secondItem.nativeView : null),
                        'attribute',(attributeMap[layoutObject.secondAttribute] || $.NSLayoutAttributeNotAnAttribute),
                        'multiplier', (layoutObject.multiplier ? layoutObject.multiplier : 0), 
                        'constant', (layoutObject.constant ? layoutObject.constant : 0));

    constraint('setPriority', 490); // NSLayoutPriorityDragThatCannotResizeWindow
    this.nativeView('setContentHuggingPriority',250,'forOrientation', 1); // NSLayoutPriorityDefaultLow
    this.nativeView('setContentHuggingPriority',250,'forOrientation', 0); // NSLayoutPriorityDefaultLow

    this.private.parent.nativeView('addConstraint', constraint);
    this.private.parent.nativeView('updateConstraintsForSubtreeIfNeeded');
    this.private.parent.nativeView('layoutSubtreeIfNeeded');

    return constraint;
  };

  Control.prototype.changeLayoutConstraint = function(previousConstraint, layoutObject) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints) 
    {
      return null;
    }
    if(previousConstraint('multiplier') !== layoutObject.multiplier  ||
        previousConstraint('secondItem') === null && layoutObject.secondItem !== null || 
        previousConstraint('secondItem') !== null && layoutObject.secondItem === null || 
        previousConstraint('firstItem') !== null && layoutObject.firstItem === null ) 
    {
      this.removeLayoutConstraint(previousConstraint);
      return this.addLayoutConstraint(layoutObject);
    }
    if(this.animateOnSizeChange || this.animateOnPositionChange) {
      previousConstraint('animator')('setConstant', layoutObject.constant);
    } else {
      previousConstraint('setConstant', layoutObject.constant);
    }
    return previousConstraint;
  };

  Control.prototype.removeLayoutConstraint = function(obj) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints) 
    {
      return;
    } else if(this.private.parent !== null) {
      this.private.parent.nativeView('removeConstraint',obj);
      this.private.parent.nativeView('updateConstraintsForSubtreeIfNeeded');
      this.private.parent.nativeView('layoutSubtreeIfNeeded');
    }
  };

  /**
   * @member top
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred top position of the control.  If this is set to a number its considered the amount
   *              of pixels below the top of the parent control.  If a percentage represented as a string (E.g., '50%') is passed in, this
   *              is translated as positioning the top at fifty percent of the parents height. If a control is set to the top the top
   *              is translated as placing it right below the assigned control element.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonSecond = new Button();
   * var buttonThird = new Button();
   * var buttonNormal = new Button();
   * buttonNormal.title = "Hello";
   * buttonNormal.middle = '100%'; // Vertically centered to window.
   * buttonNormal.center = '100%'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   * // buttonNormal uses the default height requested by button.
   *
   * buttonSecond.title = "Second";
   * buttonSecond.top = 0; // Position at the top of the window.
   * buttonSecond.right = 0; // "Right align" or make this button flush
   *                         // with the right of the window.
   *
   * buttonThird.title = "Third";
   * buttonThird.left = 0; // Position at the top of the window.
   * buttonThird.top = 0; // "Left align" or make this button flush
   *                      // with the left of the window.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonSecond);
   * win.appendChild(buttonNormal);
   * win.appendChild(buttonThird);
   * @screenshot-window {win}
   */
  util.createLayoutProperty(Control.prototype, 'top', 'top', util.identity, 'top', util.identity, ['bottom','height']);

  /**
   * @member bottom
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred bottom position of the control.  If this is set to a number its translated as the amount
   *              of pixels the bottom of the control should be to the bottom of the parent control.  If a percentage represented 
   *              as a string (E.g., '50%') is passed in, this is translated as positioning the bottom of the control at fifty percent of the parents height. 
   *              If a control is passed in, this is translated as positioning the bottom it to the top of the passed in control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonSecond = new Button();
   * var buttonThird = new Button();
   * var buttonNormal = new Button();
   * buttonNormal.title = "Aligned to bottom";
   * buttonNormal.bottom = '0'; // Vertically aligned to bottom
   * buttonNormal.center = '100%'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   * // buttonNormal uses the default height requested by button.
   *
   * buttonSecond.title = "20px from bottom";
   * buttonSecond.bottom = '20px'; // Position it 20 pixels from the bottom
   * buttonSecond.right = 0; // "Right align" or make this button flush
   *                         // with the right of the window.
   *
   * buttonThird.title = "Third";
   * buttonThird.left = 0; // Position to the left of the window
   * buttonThird.bottom = '-20%'; // align it 20% of the parent height
   *                             // from the bottom.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonSecond); 
   * win.appendChild(buttonNormal);
   * win.appendChild(buttonThird);
   * @screenshot-window {win}
   */
  util.createLayoutProperty(Control.prototype, 'bottom', 'bottom', util.negate, 'bottom', util.negate, ['top','height']);

  /**
   * @member left
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred left position of the control.  If this is set to a number its translated as the amount
   *              of pixels to the right the control should be to the left of the parent control.  If a percentage represented 
   *              as a string (E.g., '50%') is passed in, this is translated as positioning the left of the control at fifty percent of the parents width. 
   *              If a control is passed in, this is translated as positioning the left of the control to the right of the passed in control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonSecond = new Button();
   * var buttonThird = new Button();
   * var buttonNormal = new Button();
   * buttonNormal.title = "Aligned to top-left";
   * buttonNormal.left = '0'; // align to left
   * buttonNormal.top = '0'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   *
   * buttonSecond.title = "20px from left";
   * buttonSecond.left = '20px'; // Position it 20 pixels from the left
   * buttonSecond.top = '200px'; // Align it to the top by 200 pixels.
   *
   * buttonThird.title = "Third";
   * buttonThird.left = '50%'; // Position it 50% from the left.
   * buttonThird.bottom = '-20%'; // align it 20% of the parent height
   *                             // from the bottom.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonSecond); 
   * win.appendChild(buttonNormal);
   * win.appendChild(buttonThird);
   * @screenshot-window {win}
   */

  util.createLayoutProperty(Control.prototype, 'left', 'left', util.identity, 'left', util.identity, ['right','width']);
  /**
   * @member right
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred right position of the control.  If this is set to a number its translated as the amount
   *              of pixels to the left of the parent's right the control should be.  If a percentage represented 
   *              as a string (E.g., '50%') is passed in, this is translated as positioning the right of the control at fifty percent of the parents width. 
   *              If a control is passed in, this is translated as positioning the right of the control to the left of the passed in control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonSecond = new Button();
   * var buttonThird = new Button();
   * var buttonNormal = new Button();
   * buttonNormal.title = "Aligned to top-right";
   * buttonNormal.right = '0'; // align to right
   * buttonNormal.top = '0'; // Horizontally centered to window.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   *
   * buttonSecond.title = "20px from right";
   * buttonSecond.right = '20px'; // Position it 20 pixels from the right
   * buttonSecond.top = '200px'; // Align it to the top by 200 pixels.
   *
   * buttonThird.title = "Third";
   * buttonThird.right = '50%'; // Position it 50% from the right.
   * buttonThird.bottom = '20px'; // align it 20px of the parent height
   *                              // from the bottom.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonSecond); 
   * win.appendChild(buttonNormal);
   * win.appendChild(buttonThird);
   * @screenshot-window {win}
   */

  util.createLayoutProperty(Control.prototype, 'right', 'right', util.identity, 'right', util.negate, ['left','width']);
  /**
   * @member height
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred height of the control.  If the value of this is a number its translated as the pixel height
   *              that the control should have.  If the value is a string representing a percentage (e.g., '50%') then the height is
   *              set to 50% of the parents height.  Note that height cannot be calculated if both top and bottom are set (as the height
   *              is implicitly set in that circumstance).
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var box = new Box();
   * box.left=box.right=0;
   * box.height='150px';
   * win.appendChild(box);
   * @screenshot-window {win}
   */

  util.createLayoutProperty(Control.prototype, 'height', 'height', util.identity, null, util.identity, ['top','bottom']);
  /**
   * @member width
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred width of the control.  If the value of this is a number its translated as the pixel width
   *              that the control should have.  If the value is a string representing a percentage (e.g., '50%') then the width is
   *              set to 50% of the parents width.  Note that width cannot be calculated if both left and right are set (as the width
   *              is implicitly set in that circumstance).
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonSecond = new Button();
   * var buttonThird = new Button();
   * var buttonNormal = new Button();
   * buttonNormal.title = "width 200px";
   * buttonNormal.left = '0'; // align to left
   * buttonNormal.top = '0'; // align to top
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   *
   * buttonSecond.title = "20px from right";
   * buttonSecond.left = '0px'; // align to left
   * buttonSecond.top = '30px'; // align to top by 30px
   * buttonSecond.width = '50%'; // 50% of the width of parent.
   *
   * buttonThird.title = "Third";
   * buttonThird.left = '0'; // Position it left
   * buttonThird.top = '100px'; // align it 100px of the parent height
   *                            // from the bottom.
   * buttonThird.width = buttonSecond; // make the width equal to buttonSecond.
   *                                   // or 50% of the width.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonSecond); 
   * win.appendChild(buttonNormal);
   * win.appendChild(buttonThird);
   * @screenshot-window {win}
   */
  util.createLayoutProperty(Control.prototype, 'width', 'width', util.identity, null, util.identity, ['left','right']);
  /**
   * @member middle
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred middle position of the control. If the value of this is set to a number the control's
   *              middle (or verticla center) is positioned to parent's middle plus the offset (positive being below, negative above).
   *              If the passed in value is a string representing a percentage (e.g., 50%) the control's middle (or vertical center) is
   *              positioned to the parents middle + the parents height/2 times the percentage. For example, to ensure the control is
   *              positioned at the half-of-middle of the parents control (or in the first 1/4 of the height), use 50%. If a control
   *              is set as the value the middle of this controls is aligned to the middle of the assigned control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonNormal = new Button();
   * buttonNormal.title = "Aligned to middle";
   * buttonNormal.middle = '0'; // align to middle of parent.
   * buttonNormal.left = '0'; // align to left.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonNormal);
   * @screenshot-window {win}
   */
  util.createLayoutProperty(Control.prototype, 'middle', 'middle', util.identity, 'middle', util.identity, null);
  /**
   * @member center
   * @type {various}
   * @memberof Control
   * @description Gets or sets the preferred center position of the control. If the value of this is set to a number the control's
   *              center (horizontally) is positioned to parent's center plus the offset (positive being below, negative above).
   *              If the passed in value is a string representing a percentage (e.g., 50%) the control's center is
   *              positioned to the parents center + the parents width/2 times the percentage. For example, to ensure the control is
   *              positioned at half-of-center of the parents control (or in the first 1/4 of the width), use 50%. If a control
   *              is set as the value the center of this controls is aligned to the center of the assigned control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var buttonNormal = new Button();
   * buttonNormal.title = "Aligned to center";
   * buttonNormal.center = '0'; // align to center of parent.
   * buttonNormal.top = '0'; // align to top.
   * buttonNormal.width = '200px'; // 200 logical pixels wide.
   *
   * // Add the buttons to the window.
   * win.appendChild(buttonNormal);
   * @screenshot-window {win}
   */
  util.createLayoutProperty(Control.prototype, 'center', 'center', util.identity, 'center', util.identity, null);

  global.__TINT.Control = Control;
  return Control;
})();
