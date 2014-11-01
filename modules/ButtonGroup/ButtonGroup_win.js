module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var Button = require('Button');
  var $ = process.bridge.dotnet;

  function ButtonGroup(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.StackPanel, $.System.Windows.Controls.StackPanel, options);
    }
    //TODO: Switch to ToggleButton in WPF for more common capability.
    this.native.Orientation = $.System.Windows.Controls.Horizontal;
    this.native.BorderBrush = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.DarkGray);
    this.native.BorderThickness = new $.System.Windows.Thickness(1);
    this.private.segmentedButtons = [];
    this.private.selected = 0;
  }

  ButtonGroup.prototype = Object.create(Container.prototype);
  ButtonGroup.prototype.constructor = ButtonGroup;

  // STUB
  ButtonGroup.prototype.style = "default";
  //TODO: See how we can shore this up with OSX.
  //Object.defineProperty(ButtonGroup.prototype, 'style', {
  //  get:function() { 
  //    var buttonStyle = this.nativeView('segmentStyle');
  //    if (buttonStyle == $.NSSegmentStyleRounded) return "rounded";
  //    else if (buttonStyle == $.NSSegmentStyleTexturedRounded) return "textured";
  //    else if (buttonStyle == $.NSSegmentStyleRoundRect) return "roundrect";
  //    else if (buttonStyle == $.NSSegmentStyleTexturedSquare) return "square";
  //    else if (buttonStyle == $.NSSegmentStyleCapsule) return "capsule";
  //    else if (buttonStyle == $.NSSegmentStyleSmallSquare) return "smallsquare";
  //    else return "default";
  //  },
  //  set:function(type) {
  //    if (type == "rounded") this.nativeView('setSegmentStyle',$.NSSegmentStyleRounded);
  //   else if (type == "textured") this.nativeView('setSegmentStyle',$.NSSegmentStyleTexturedRounded);
  //   else if (type == "roundrect") this.nativeView('setSegmentStyle', $.NSSegmentStyleRoundRect);
  //    else if (type == "capsule") this.nativeView('setSegmentStyle', $.NSSegmentStyleCapsule);
  //    else if (type == "smallsquare") this.nativeView('setSegmentStyle', $.NSSegmentStyleSmallSquare);
  //    else if (type == "square") this.nativeView('setSegmentStyle', $.NSSegmentStyleTexturedSquare);
  //    else this.native('setSegmentStyle', $.NSSegmentStyleAutomatic);
  //  }
  //});

  Object.defineProperty(ButtonGroup.prototype, 'selected', {
    get:function() { return this.private.selected; },
    set:function(e) {
      var buttons = this.private.segmentedButtons;
      if(buttons.length == 0) this.private.selected = 0;
      else if(e > (buttons.length-1)) this.private.selected = buttons.length-1;
      else if(e < 0) this.private.selected = 0;
      else this.private.selected = e;
      for(var i=0; i < buttons.length ; i++) {
        if(i==e) buttons[i].native.IsChecked = true;
        else buttons[i].native.IsChecked = false;
      }
    }
  });

  ButtonGroup.prototype.appendChild = function(button) {
    var ndx = this.private.segmentedButtons.push(button)-1;
    button.addEventListener('private-pre-mousedown', function() {
      this.selected = ndx;
    }.bind(this));
    var buttons = this.private.segmentedButtons;
    for(var i=0; i < buttons.length ; i++) {
      buttons[i].native.BorderBrush = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
      buttons[i].native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
    }
    this.native.Children.Add(button.native);
  }

  ButtonGroup.prototype.removeChild = function(button) {
    this.private.segmentedButtons.splice(this.private.segmentedButtons.indexOf(button), 1);
    this.native.Children.Remove(button.native);
  }

  return ButtonGroup;

})();
