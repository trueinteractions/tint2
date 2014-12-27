module.exports = (function() {
  if(global.__TINT.ButtonGroup) {
    return global.__TINT.ButtonGroup;
  }
  var util = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class ButtonGroup
   * @description Creates a set of buttons that can represent various states and
   *              similar to a toggle button can be toggled between modes.
   * @see Button
   * @extends Container
   */
  /**
   * @new
   * @memberof ButtonGroup
   * @description Creates a collection that buttons can be added to.
   */
  function ButtonGroup(options) {
    options = options || {};
    options.mouseDownBlocks = true;
    this.nativeClass = this.nativeClass || $.NSSegmentedControl;
    this.nativeViewClass = this.nativeViewClass || $.NSSegmentedControl;
    Container.call(this, options);
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
  };

  ButtonGroup.prototype = Object.create(Container.prototype);
  ButtonGroup.prototype.constructor = ButtonGroup;

  // TODO: Not supported in OSX, standardize?
  util.def(ButtonGroup.prototype, 'style',
    function() { 
      var buttonStyle = this.nativeView('segmentStyle');
      if (buttonStyle === $.NSSegmentStyleRounded) {
        return "rounded";
      }
      else if (buttonStyle === $.NSSegmentStyleTexturedRounded) {
        return "textured";
      }
      else if (buttonStyle === $.NSSegmentStyleRoundRect) {
        return "roundrect";
      }
      else if (buttonStyle === $.NSSegmentStyleTexturedSquare) {
        return "square";
      }
      else if (buttonStyle === $.NSSegmentStyleCapsule) {
        return "capsule";
      }
      else if (buttonStyle === $.NSSegmentStyleSmallSquare) {
        return "smallsquare";
      }
      else {
        return "default";
      }
    },
    function(type) {
      if (type === "rounded") {
        this.nativeView('setSegmentStyle',$.NSSegmentStyleRounded);
      }
      else if (type === "textured") {
        this.nativeView('setSegmentStyle',$.NSSegmentStyleTexturedRounded);
      }
      else if (type === "roundrect") {
        this.nativeView('setSegmentStyle', $.NSSegmentStyleRoundRect);
      }
      else if (type === "capsule") {
        this.nativeView('setSegmentStyle', $.NSSegmentStyleCapsule);
      }
      else if (type === "smallsquare") {
        this.nativeView('setSegmentStyle', $.NSSegmentStyleSmallSquare);
      }
      else if (type === "square") {
        this.nativeView('setSegmentStyle', $.NSSegmentStyleTexturedSquare);
      }
      else {
        this.native('setSegmentStyle', $.NSSegmentStyleAutomatic);
      }
    }
  );

  /**
   * @member selected
   * @type {number}
   * @memberof ButtonGroup
   * @description Gets or sets the index of the button that is selected, the value must be
   *              from 0 to the amount of buttons in the group.  This returns null if no item
   *              is selected.
   */
  util.def(ButtonGroup.prototype, 'selected',
    function() { return this.nativeView('selectedSegment'); },
    function(e) { this.nativeView('setSelectedSegment', e); }
  );


  /**
   * @method appendChild
   * @memberof ButtonGroup
   * @param {Button} button A button to add as a segment to the group.
   * @description Append child adds the passed in button as a segment in the group. 
   * @see removeChild
   */
  ButtonGroup.prototype.appendChild = function(button) {
    console.assert(!button.private.outOfBoundsListener);
    var ndx = this.private.segmentedButtons.push(button)-1;
    this.nativeView('setSegmentCount',ndx+1);

    button.private.outOfBoundsListener = function(property, value) {
      if(property === 'image') {
        this.nativeView('setImage',util.makeNSImage(value),'forSegment',ndx);
      }
      else if (property === 'title') {
        this.nativeView('setLabel',$(value),'forSegment',ndx);
      }
      else if (property === 'enabled') {
        this.nativeView('setEnabled',(value ? $.YES : $.NO),'forSegment',ndx);
      }
    }.bind(this);
    button.addEventListener('property-change',button.private.outOfBoundsListener);

    if(button.image !== null && button.image) {
      this.nativeView('setImage',util.makeNSImage(button.image),'forSegment',ndx);
    }
    if(button.title !== null && button.title) {
      this.nativeView('setLabel',$(button.title),'forSegment',ndx);
    }

    this.nativeView('setEnabled', button.enabled ? $.YES : $.NO);
    this.nativeView('setImageScaling',$.NSImageScaleProportionallyDown,'forSegment',ndx);
  };

  /**
   * @method removeChild
   * @memberof ButtonGroup
   * @param {Button} button The button to remove as a segment to the group.
   * @description Remove child removes the passed in button from the group. 
   * @see appendChild
   */
  ButtonGroup.prototype.removeChild = function(button) {
    console.assert(button.private.outOfBoundsListener);
    button.removeEventListener('property-change', button.private.outOfBoundsListener);
    button.private.outOfBoundsListener = null;
    this.private.segmentedButtons.splice(this.private.segmentedButtons.indexOf(button), 1);
    this.nativeView('setSegmentCount',this.private.segmentedButtons.length);
  };

  global.__TINT.ButtonGroup = ButtonGroup;
  return ButtonGroup;

})();
