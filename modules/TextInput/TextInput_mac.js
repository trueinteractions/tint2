module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');
  var Color = require('Color');

  /**
   * @class TextInput
   * @description Creates a text label or text input area for the user to
   *              provide a free-form value from the keyboard.
   * @extends Container
   */

  /**
   * @new
   * @memberof TextInput
   * @description Creates a new TextInput control.
   */
  function TextInput(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      /**
       * @event input
       * @memberof TextInput
       * @description Fires when the text has changed and new text is available.
       *              This is after the keydown event. This is useful if you'd
       *              not like to listen to keyup or keydown as those events may
       *              fire even if the value did not change (e.g., if the user
       *              changes the cursor selection with the arrow keys.)
       */
      ['controlTextDidChange:','v@:@', function() {
          // NSTextField's do not allow overriding the keyDown component, however
          // the input event is fired directly after the event has been processed.
          this.fireEvent('keydown'); 
          this.fireEvent('input');
        }.bind(this)
      ],
      /**
       * @event inputstart
       * @memberof TextInput
       * @description Fires when the user begins inputting text prior to keyup, 
       *              keydown or input. This event is useful if an animation
       *              or other event should fire when the user first types, but
       *              not on every key afterwards.  For example, you might listen
       *              to this event to show some sort of in-context dialog or
       *              menu while the user is typing (like an auto-fill menu).
       */
      ['controlTextDidBeginEditing:','v@:@', function() { this.fireEvent('inputstart'); }.bind(this)],
      /**
       * @event inputend
       * @memberof TextInput
       * @description Fires when the user has finished inputting text.  This is
       *              determined by when the user presses return when linewrap = false
       *              (e.g., the text input only takes a single line of text), or
       *              when the control looses focus or another event prevents input.
       *              This event is useful to listen to if you need to take an action
       *              AFTER a user has fully inputted all the text, for example the URL
       *              input field on a browser, only until the user is fully done typing
       *              should we try and load the URL.
       */
      ['controlTextDidEndEditing:','v@:@', function() { this.fireEvent('inputend'); }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSTextField, $.NSTextField, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setDelegate', this.nativeView);
  }

  TextInput.prototype = Object.create(Container.prototype);
  TextInput.prototype.constructor = TextInput;

  /**
   * @member value
   * @type {string}
   * @memberof TextInput
   * @description Gets or sets the text as the value of the input or label.
   */
  Object.defineProperty(TextInput.prototype, 'value', {
    get:function() { return this.nativeView('stringValue')('UTF8String'); },
    set:function(e) { this.nativeView('setStringValue',$(e)); }
  });

  /**
   * @member enabled
   * @type {boolean}
   * @memberof TextInput
   * @description Gets or sets whether the control is editable.  This causes the
   *              control to gray out and visual indicate its unable to take input
   *              or is disabled.
   */
  Object.defineProperty(TextInput.prototype, 'enabled', {
    get:function() { return this.nativeView('isEnabled'); },
    set:function(e) { this.nativeView('setEnabled',e); }
  });

  /**
   * @member textcolor
   * @type {Color}
   * @memberof TextInput
   * @description Gets or sets the color of the text on the input or label.
   */
  Object.defineProperty(TextInput.prototype, 'textcolor', {
    get:function() { return new Color(this.nativeView('textColor')); },
    set:function(e) { this.nativeView('setTextColor',(new Color(e)).native); }
  });

  /**
   * @member readonly
   * @type {boolean}
   * @memberof TextInput
   * @description Gets or sets whether the control is read only or not.
   *              If true, the control is disabled as a label. If false,
   *              its disabled as a text input. The default is false.
   */
  Object.defineProperty(TextInput.prototype, 'readonly', {
    get:function() { return !this.nativeView('isEditable'); },
    set:function(e) {
      var val = e ? $.NO : $.YES;
      this.nativeView('setEditable',val);
      this.nativeView('setBezeled',val);
      this.nativeView('setDrawsBackground',val);
      this.nativeView('setSelectable',val);
    }
  });

  /**
   * @member placeholder
   * @type {string}
   * @memberof TextInput
   * @description Gets or sets the text that is displayed in the text input or
   *              label prior to being modified by the user or programmatically.
   *              This is useful if you're collecting a field and want to use the
   *              area in the text input as an indicator of what value should be
   *              provided rather than create a seperate label. The default is an
   *              empty string. 
   */
  Object.defineProperty(TextInput.prototype, 'placeholder', {
    get:function() { return this.nativeView('cell')('placeholderString'); },
    set:function(e) { this.nativeView('cell')('setPlaceholderString', $(e.toString())); }
  });

  /**
   * @member alignment
   * @type {string}
   * @memberof TextInput
   * @description Gets or sets the alignment of the label or text input. The values
   *              that are allowed are left, right or center. 
   */
  Object.defineProperty(TextInput.prototype, 'alignment', {
    get:function() {
      if (this.nativeView('alignment') == 0) return "left";
      else if (this.nativeView('alignment') == 1) return "right";
      else if (this.nativeView('alignment') == 2) return "center";
      else return "unknown";
    },
    set:function(e) {
      if(e == 'left') this.nativeView('setAlignment', 0);
      else if (e == 'right') this.nativeView('setAlignment', 1);
      else if (e == 'center') this.nativeView('setAlignment', 2);
    }
  });

  /**
   * @member visible
   * @type {boolean}
   * @memberof TextInput
   * @description Gets or sets whether the control is visible on screen.
   *              The default is true.
   */
  Object.defineProperty(TextInput.prototype, 'visible', {
    get:function() { return !this.nativeView('isHidden'); },
    set:function(e) { this.nativeView('setHidden',e ? false : true); }
  });

  /**
   * @member linewrap
   * @type {boolean}
   * @memberof TextInput
   * @description Gets or sets whether the ENTER key creates a new line or
   *              when text reaches the end of the control it wraps to a new line.
   *              The default is false.
   */
  Object.defineProperty(TextInput.prototype, 'linewrap', {
    get:function() { return this.nativeView('cell')('wraps'); },
    set:function(e) { this.nativeView('cell')('setWraps', e ? true : false ); }
  });

  /**
   * @member scrollable
   * @type {boolean}
   * @memberof TextInput
   * @description Gets or sets whether the text input has a visible scroll bar.  
   *              If linewrap is set to false, the control does not display a 
   *              scrollbar by default.  The default is false.
   */
  Object.defineProperty(TextInput.prototype, 'scrollable', {
    get:function() { return this.nativeView('cell')('isScrollable'); },
    set:function(e) { this.nativeView('cell')('setScrollable', e ? true : false ); }
  });

  return TextInput;
})();
