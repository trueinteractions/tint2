module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');
  var Color = require('Color');

  /**
   * @class TextInput
   * @description Creates a label or text input area.
   * @extends Container
   */
  function TextInput(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['controlTextDidChange:','v@:@', function() {
          // NSTextField's do not allow overriding the keyDown component, however
          // the input event is fired directly after the event has been processed.
          this.fireEvent('keydown'); 
          this.fireEvent('input');
        }.bind(this)
      ],
      ['controlTextDidBeginEditing:','v@:@', function() { this.fireEvent('inputstart'); }.bind(this)],
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
   * @member readonly
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
