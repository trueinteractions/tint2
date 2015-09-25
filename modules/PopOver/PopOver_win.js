
module.exports = (function() {
  if(global.__TINT.PopOver) {
    return global.__TINT.PopOver;
  }

  var arrowHeight = 11.5;
  var arrowWidth = 27.5;
  var margin = 10;

  var Container = require('Container');
  var util = require('Utilities');
  var System = require('System');
  var $ = process.bridge.dotnet;
  $.import('System.Xaml.dll');


  function updateLocation() {
    this.native.HorizontalOffset = 0;
    this.native.VerticalOffset = 0;

    var transform = "0.0", 
        rectLeft  = arrowHeight + margin/2,
        rectTop   = this.private.rect.Height/2 - arrowWidth/2 + margin, 
        arrowLeft = margin/2, 
        arrowTop  = rectTop,
        placement = $.System.Windows.Controls.Primitives.PlacementMode.Right;

    if(this.private.side === "left") {
      transform   = "180.0";
      rectLeft    = arrowHeight - margin/2;
      rectTop     = margin;
      arrowLeft   = this.private.rect.Width + arrowHeight*2 - margin/2;
      arrowTop    = this.private.rect.Height/2 + arrowWidth/2 + margin;
      placement   = $.System.Windows.Controls.Primitives.PlacementMode.Left;
    }  else if (this.private.side === "top") {
      transform   = "270.0";
      rectLeft    = margin;
      rectTop     = arrowHeight - margin/2;
      arrowLeft   = this.private.rect.Width/2 - arrowWidth/2 + margin;
      arrowTop    = this.private.rect.Height + arrowHeight*2 - margin/2;
      placement   = $.System.Windows.Controls.Primitives.PlacementMode.Top;
    } else if (this.private.side === "bottom") {
      transform   = "90.0";
      rectLeft    = margin;
      rectTop     = arrowHeight + margin/2;
      arrowLeft   = this.private.rect.Width/2 + arrowWidth/2 + margin;
      arrowTop    = margin/2;
      placement   = $.System.Windows.Controls.Primitives.PlacementMode.Bottom;
    }

    this.private.arrow.RenderTransform = new $.System.Windows.Media.RotateTransform($.System.Double.Parse(transform));
    $.System.Windows.Controls.Canvas.SetLeft(this.private.rect, rectLeft);
    $.System.Windows.Controls.Canvas.SetTop(this.private.rect, rectTop);
    $.System.Windows.Controls.Canvas.SetLeft(this.private.arrow, arrowLeft);
    $.System.Windows.Controls.Canvas.SetTop(this.private.arrow, arrowTop);
    this.native.Placement = placement;

    if(this.private.container instanceof StatusBar) {
      var mPos = System.mousePosition;
      this.native.VerticalOffset = mPos.y;
      this.native.HorizontalOffset = ( mPos.x - (this.native.Width / 2) );
    } else {
      this.native.PlacementTarget = this.private.container.nativeView;
    }
  }

  function updateLocationChange() {
    if(this.private.attached) {
      this.native.VerticalOffset = this.native.VerticalOffset + 1;
      this.native.VerticalOffset = this.native.VerticalOffset - 1;
      this.native.HorizontalOffset = this.native.HorizontalOffset + 1;
      this.native.HorizontalOffset = this.native.HorizontalOffset - 1;
      updateLocation.call(this);
    }
  }  
  function opened() {
    this.fireEvent('opened');
  }

  function closed() {
    this.fireEvent('closed');
  }

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

    this.native.addEventListener('Opened', opened.bind(this));
    this.native.addEventListener('Closed', closed.bind(this));
    this.native.Placement = $.System.Windows.Controls.Primitives.PlacementMode.Right;

    this.height = 300;
    this.width = 300;

    // Scroll, Slide, Fade & None
    this.native.PopupAnimation = $.System.Windows.Controls.Primitives.PopupAnimation.Slide;
    $.System.Windows.Application.Current.addEventListener('Deactivated', function() {
      this.native.IsOpen = false;
    }.bind(this));
    this.native.addEventListener('LostFocus', function() {
      this.native.IsOpen = false;
    }.bind(this));
    this.native.addEventListener('PreviewLostKeyboardFocus', function() {
      this.native.IsOpen = false;
    }.bind(this));
  }

  PopOver.prototype = Object.create(Container.prototype);
  PopOver.prototype.constructor = PopOver;

  util.def(PopOver.prototype, 'width', 
    function() { return this.native.Width; },
    function(e) {
      if(typeof(e) === "number") {
        this.native.Width = e;
        this.private.canvas.Width = e;
        this.private.rect.Width = e - arrowHeight - margin;
        this.nativeView.Width = e - margin * 4;
      }
    });

  util.def(PopOver.prototype, 'height',
    function() { return this.native.Height; },
    function(e) {
      if(typeof(e) === "number") {
        this.native.Height = e;
        this.private.canvas.Height = e;
        this.private.rect.Height = e - arrowHeight- margin;
        this.nativeView.Height = e - margin * 4;
      }
    });

  PopOver.prototype.open = function(container, side) {
    if(!(container && container.native)) {
      throw new Error('Container wasnt a valid Tint object.');
    }
    this.private.side = side;
    this.private.container = container;
    this.private.attached = true;

    if(!(container instanceof StatusBar)) {
      var targetWindow = $.System.Windows.Window.GetWindow(container.native);
      if(targetWindow === null) {
        throw new Error('Container wasn\'t attached to a window.');
      }
      targetWindow.addEventListener('LocationChanged', updateLocationChange.bind(this));
      targetWindow.addEventListener('SizeChanged',  updateLocationChange.bind(this));
    } else {
      this.private.side = 'top';
    }
    updateLocation.call(this);
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
