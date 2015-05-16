module.exports = (function() {
  var TextInput = require('TextInput');
  var Button = require('Button');
  var Control = require('Control');
  var assert = require('assert');
  var utils = require('Utilities');
  var $ = process.bridge.dotnet;

  function SearchInput(options)  {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Border;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Border;
    Control.call(this, options);
    this.nativeView.MinWidth = 180;
    this.nativeView.MaxWidth = 2000;
    this.nativeView.MinHeight = 2;
    this.nativeView.MaxHeight = 22;
    this.nativeView.Padding = new $.System.Windows.Thickness(2);
    this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.White);
    this.nativeView.Foreground = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Black);
    this.nativeView.BorderBrush = new $.System.Windows.Media.LinearGradientBrush();
    this.nativeView.BorderBrush.StartPoint = new $.System.Windows.Point(0,0);
    this.nativeView.BorderBrush.EndPoint = new $.System.Windows.Point(0,1);
    this.nativeView.BorderThickness = new $.System.Windows.Thickness(1);
    
    var stopGradient = new $.System.Windows.Media.GradientStopCollection();
    stopGradient.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFABADB3"),0.05));
    stopGradient.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFE2E3EA"),0.07));
    stopGradient.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFE3E9EF"),1));
    this.nativeView.BorderBrush.GradientStops = stopGradient;
    
    var stopGradientOver = new $.System.Windows.Media.GradientStopCollection();
    stopGradientOver.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FF5C97C1"),0.05));
    stopGradientOver.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFB9D7EB"),0.07));
    stopGradientOver.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFC7E2F1"),1));

    //var iconBackground = new $.System.Windows.Media.GradientStopCollection();
    //iconBackground.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFE7F5FD"),0.0));
    //iconBackground.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFD2EDFC"),0.5));
    //iconBackground.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FFB6E3FD"),0.51));
    //iconBackground.Add(new $.System.Windows.Media.GradientStop($.System.Windows.Media.ColorConverter.ConvertFromString("#FF9DD5F3"),1));

    this.private.nativeViewPanel = new $.System.Windows.Controls.Grid();
    var col1 = new $.System.Windows.Controls.ColumnDefinition();
    col1.Width = new $.System.Windows.GridLength(1,$.System.Windows.GridUnitType.Star);
    var col2 = new $.System.Windows.Controls.ColumnDefinition();
    col2.Width = new $.System.Windows.GridLength(24,$.System.Windows.GridUnitType.Pixel);
    this.private.nativeViewPanel.ColumnDefinitions.Add(col1);
    this.private.nativeViewPanel.ColumnDefinitions.Add(col2);

    this.nativeView.Child = this.private.nativeViewPanel;
    var textBox = new $.System.Windows.Controls.TextBox();
    textBox.BorderThickness = new $.System.Windows.Thickness(0);
    textBox.Padding = new $.System.Windows.Thickness(0);
    textBox.Margin = new $.System.Windows.Thickness(0);
    $.System.Windows.Controls.Grid.SetColumn(textBox, 0);
    this.private.nativeViewPanel.Children.Add(textBox);

    this.private.recentSearches = [];
    //this.addEventListener('inputend', function(e) {
    //  this.private.recentSearches.push(this.value);
    //}.bind(this));

    var img = utils.makeImage('reveal');
    img.MaxWidth = 24;
    $.System.Windows.Controls.Grid.SetColumn(img, 1);
    this.private.nativeViewPanel.Children.Add(img);

    //var imgbg = new $.System.Windows.Media.LinearGradientBrush();
    //imgbg.GradientStops = iconBackground;

    this.nativeView.addEventListener('MouseEnter', function() {
      this.nativeView.BorderBrush.GradientStops = stopGradientOver;
    }.bind(this));
    this.nativeView.addEventListener('MouseLeave', function() {
      this.nativeView.BorderBrush.GradientStops = stopGradient;
    }.bind(this));   
    
    //this.private.cancelButton = new Button();
    //this.private.cancelButton.image = 'stop-inverse';
  }

  SearchInput.prototype = Object.create(TextInput.prototype);
  SearchInput.prototype.constructor = SearchInput;

  Object.defineProperty(SearchInput.prototype, 'searches', {
    get:function() { return this.private.recentSearches; },
    set:function(e) {
      assert(Array.isArray(e), 'The recent searches must be an array of strings.');
      this.private.recentSearches = e; 
    }
  });

  Object.defineProperty(SearchInput.prototype, 'searchButton', {
    get:function() { return this.private.searchButton; },
    set:function(e) {
      this.private.nativeViewPanel.Children.Remove(this.private.nativeViewPanel.Children.IndexOf(this.private.searchButton.native));
      this.private.searchButton = e;
      this.private.nativeViewPanel.Children.Add(this.private.searchButton.native);
    }
  });

  Object.defineProperty(SearchInput.prototype, 'cancelButton', {
    get:function() { return this.private.cancelButton; },
    set:function(e) { 
      this.private.nativeViewPanel.Children.Remove(this.private.nativeViewPanel.Children.IndexOf(this.private.cancelButton.native));
      this.private.cancelButton = e;
      this.private.nativeViewPanel.Children.Add(this.private.cancelButton.native);
    }
  });

  return SearchInput;

})();