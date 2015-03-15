
module.exports = (function() {
  if(global.__TINT.PopOver) {
    return global.__TINT.PopOver;
  }

  var arrowHeight = 11.5;
  var arrowWidth = 27.5;
  var margin = 10;

  var Container = require('Container');
  var $ = process.bridge.dotnet;
  $.import('System.Xaml.dll');

  function PopOver(options) {
    options = options || {};

    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Primitives.Popup;
    this.nativeViewClass = this.nativeViewClass || $.AutoLayout.AutoLayoutPanel;
    Container.call(this, options);

    this.native.Child = this.private.canvas = $.System.Xaml.XamlServices.Parse("<Canvas xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\" Margin=\"0,0,0,0\"><Canvas.Effect><DropShadowEffect Opacity=\"1\" BlurRadius=\"3\" ShadowDepth=\"0.5\"/></Canvas.Effect></Canvas>");
    this.private.rect = $.System.Xaml.XamlServices.Parse("<Rectangle xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\"  Stretch=\"Fill\" Fill=\"#f7f7f7\" Opacity=\"1\" Canvas.Left=\"12\" RadiusX=\"6\" RadiusY=\"6\"></Rectangle>");
    this.private.arrow = $.System.Xaml.XamlServices.Parse("<Path xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\" Fill=\"#f7f7f7\" Opacity=\"1\" Data=\"M11.7,27.2V0c0,0-0.7,3.4-3.4,5.7C5,8.6,0,11.9,0,13.6s5,5,8.3,7.9C11,23.9,11.7,27.2,11.7,27.2z\" Canvas.Top=\"100\" Canvas.Left=\"0.5\"></Path>");
    this.private.canvas.Children.Add(this.private.rect);
    this.private.canvas.Children.Add(this.private.arrow);
    this.private.canvas.Children.Add(this.nativeView);
    this.native.AllowsTransparency = true;

    $.System.Windows.Controls.Canvas.SetLeft(this.nativeView, margin + margin/2);
    $.System.Windows.Controls.Canvas.SetTop(this.nativeView, 2*margin);

    this.private.attached = false;

    this.private.updateLocation = function() {

      this.native.HorizontalOffset = 0;
      this.native.VerticalOffset = 0;

      if (this.private.side === "left") {
        this.private.arrow.RenderTransform = new $.System.Windows.Media.RotateTransform($.System.Double.Parse("180.0"));
        $.System.Windows.Controls.Canvas.SetLeft(this.private.rect, arrowHeight - margin/2);
        $.System.Windows.Controls.Canvas.SetTop(this.private.rect, margin);
        $.System.Windows.Controls.Canvas.SetLeft(this.private.arrow, this.private.rect.Width + arrowHeight*2 - margin/2);
        $.System.Windows.Controls.Canvas.SetTop(this.private.arrow, this.private.rect.Height/2 + arrowWidth/2 + margin);
        this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Left;
      } else if (this.private.side === "top") {
        this.private.arrow.RenderTransform = new $.System.Windows.Media.RotateTransform($.System.Double.Parse("270.0"));
        $.System.Windows.Controls.Canvas.SetLeft(this.private.rect, margin);
        $.System.Windows.Controls.Canvas.SetTop(this.private.rect, arrowHeight- margin/2);
        $.System.Windows.Controls.Canvas.SetLeft(this.private.arrow, this.private.rect.Width/2 - arrowWidth/2 + margin);
        $.System.Windows.Controls.Canvas.SetTop(this.private.arrow, this.private.rect.Height + arrowHeight*2 - margin/2);
        this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Top;
      } else if (this.private.side === "bottom") {
        this.private.arrow.RenderTransform = new $.System.Windows.Media.RotateTransform($.System.Double.Parse("90.0"));
        $.System.Windows.Controls.Canvas.SetLeft(this.private.rect, margin);
        $.System.Windows.Controls.Canvas.SetTop(this.private.rect, arrowHeight + margin/2);
        $.System.Windows.Controls.Canvas.SetLeft(this.private.arrow, this.private.rect.Width/2 + arrowWidth/2 + margin);
        $.System.Windows.Controls.Canvas.SetTop(this.private.arrow, margin/2);
        this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Bottom;
      } else {
        this.private.arrow.RenderTransform = new $.System.Windows.Media.RotateTransform($.System.Double.Parse("0.0"));
        $.System.Windows.Controls.Canvas.SetLeft(this.private.rect, arrowHeight + margin/2);
        $.System.Windows.Controls.Canvas.SetTop(this.private.rect, margin);
        $.System.Windows.Controls.Canvas.SetLeft(this.private.arrow, margin/2);
        $.System.Windows.Controls.Canvas.SetTop(this.private.arrow, this.private.rect.Height/2 - arrowWidth/2 + margin);
        this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Right;
      }

      this.native.PlacementTarget = this.private.container.nativeView;

    }.bind(this);

    this.private.locationChange = function() {
      if(this.private.attached) {
        this.native.VerticalOffset = this.native.VerticalOffset + 1;
        this.native.VerticalOffset = this.native.VerticalOffset - 1;
        this.native.HorizontalOffset = this.native.HorizontalOffset + 1;
        this.native.HorizontalOffset = this.native.HorizontalOffset - 1;
        this.private.updateLocation();
      }
    }.bind(this);
      
    var opened = function() {
      this.fireEvent('opened');
    }.bind(this);
    var closed = function() {
      this.fireEvent('closed');
    }.bind(this);

    this.private.callbacks.push(opened);
    this.private.callbacks.push(closed);

    this.native.addEventListener('Opened', opened);
    this.native.addEventListener('Closed', closed);
    this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Right;

    this.height = 300;
    this.width = 300;

    // Scroll, Slide, Fade & None
    this.native.PopupAnimation = $.System.Windows.Controls.Primitives.PopupAnimation.Slide;
  }

  PopOver.prototype = Object.create(Container.prototype);
  PopOver.prototype.constructor = PopOver;


  Object.defineProperty(PopOver.prototype, 'width', {
    get:function() { return this.native.Width; },
    set:function(e) {
      if(typeof(e) === "number") {
        this.native.Width = e;
        this.private.canvas.Width = e;
        this.private.rect.Width = e - arrowHeight - margin;
        this.nativeView.Width = e - margin * 4;
      }
    }
  });

  Object.defineProperty(PopOver.prototype, 'height', {
    get:function() { return this.native.Height; },
    set:function(e) {
      if(typeof(e) === "number") {
        this.native.Height = e;
        this.private.canvas.Height = e;
        this.private.rect.Height = e - arrowHeight- margin;
        this.nativeView.Height = e - margin * 4;
      }
    }
  });

  PopOver.prototype.open = function(container, side) {
    if(!(container && container.native)) {
      throw new Error('Container wasnt a valid Tint object.');
    }
    var targetWindow = $.System.Windows.Window.GetWindow(container.native);
    if(targetWindow === null) {
      throw new Error('Container wasn\'t attached to a window.');
    }
    this.private.side = side;
    this.private.container = container;
    this.private.attached = true;

    targetWindow.addEventListener('LocationChanged', this.private.locationChange);
    targetWindow.addEventListener('SizeChanged', this.private.locationChange);
    this.private.updateLocation();
    this.fireEvent('open');
    this.native.IsOpen = true;
  };

  PopOver.prototype.close = function() {
    this.private.attached = false;
    this.private.container = null;
    this.private.side = null;
    this.native.IsOpen = false;
  };

  global.__TINT.PopOver = PopOver;
  return PopOver;
})();
