module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var Button = require('Button');
  var $ = process.bridge.objc;

  function ButtonGroup(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSSegmentedControl, $.NSSegmentedControl, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setSegmentStyle',$.NSSegmentStyleRounded);

    this.private.segmentedButtons = [];

    // Create proxy for click event.
    this.addEventListener('mouseup', function() {
      var ndx = this.nativeView('selectedSegment');
      this.private.segmentedButtons[ndx].fireEvent('mousedown');
      this.private.segmentedButtons[ndx].fireEvent('click');
      this.private.segmentedButtons[ndx].fireEvent('mouseup');
      this.fireEvent('click');
    }.bind(this));
  }

  ButtonGroup.prototype = Object.create(Container.prototype);
  ButtonGroup.prototype.constructor = ButtonGroup;

  Object.defineProperty(ButtonGroup.prototype, 'style', {
    get:function() { 
      var buttonStyle = this.nativeView('segmentStyle');
      if (buttonStyle == $.NSSegmentStyleRounded) return "rounded";
      else if (buttonStyle == $.NSSegmentStyleTexturedRounded) return "textured";
      else if (buttonStyle == $.NSSegmentStyleRoundRect) return "roundrect";
      else if (buttonStyle == $.NSSegmentStyleTexturedSquare) return "square";
      else if (buttonStyle == $.NSSegmentStyleCapsule) return "capsule";
      else if (buttonStyle == $.NSSegmentStyleSmallSquare) return "smallsquare";
      else return "default";
    },
    set:function(type) {
      if (type == "rounded") this.nativeView('setSegmentStyle',$.NSSegmentStyleRounded);
      else if (type == "textured") this.nativeView('setSegmentStyle',$.NSSegmentStyleTexturedRounded);
      else if (type == "roundrect") this.nativeView('setSegmentStyle', $.NSSegmentStyleRoundRect);
      else if (type == "capsule") this.nativeView('setSegmentStyle', $.NSSegmentStyleCapsule);
      else if (type == "smallsquare") this.nativeView('setSegmentStyle', $.NSSegmentStyleSmallSquare);
      else if (type == "square") this.nativeView('setSegmentStyle', $.NSSegmentStyleTexturedSquare);
      else this.native('setSegmentStyle', $.NSSegmentStyleAutomatic);
    }
  });

  Object.defineProperty(ButtonGroup.prototype, 'selected', {
    get:function() { return this.nativeView('selectedSegment'); },
    set:function(e) { this.nativeView('setSelectedSegment', e); }
  });

  ButtonGroup.prototype.appendChild = function(button) {
    console.assert(!button.private.outOfBoundsListener);
    var ndx = this.private.segmentedButtons.push(button)-1;
    this.nativeView('setSegmentCount',ndx+1);

    button.private.outOfBoundsListener = function(property, value) {
      if(property == 'image')
        this.nativeView('setImage',utilities.makeNSImage(value),'forSegment',ndx);
      else if (property == 'title')
        this.nativeView('setLabel',$(value),'forSegment',ndx);
      else if (property == 'enabled')
        this.nativeView('setEnabled',(value ? $.YES : $.NO),'forSegment',ndx);
    }.bind(this);
    button.addEventListener('property-change',button.private.outOfBoundsListener);

    if(button.image != null && button.image) 
      this.nativeView('setImage',utilities.makeNSImage(button.image),'forSegment',ndx);
    if(button.title != null && button.title)
      this.nativeView('setLabel',$(button.title),'forSegment',ndx);

    this.nativeView('setEnabled',button.enabled ? $.YES : $.NO);
    this.nativeView('setImageScaling',$.NSImageScaleProportionallyDown,'forSegment',ndx);
  }

  ButtonGroup.prototype.removeChild = function(button) {
    console.assert(button.private.outOfBoundsListener);
    button.removeEventListener('property-change', button.private.outOfBoundsListener);
    button.private.outOfBoundsListener = null;
    this.private.segmentedButtons.splice(this.private.segmentedButtons.indexOf(button), 1);
    this.nativeView('setSegmentCount',this.private.segmentedButtons.length);
  }

  return ButtonGroup;

})();
