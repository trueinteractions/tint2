module.exports = (function() {
  if(global.__TINT.DateWell) {
    return global.__TINT.DateWell;
  }

  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.dotnet;

  function DateWell(options) {
    options = options || {};

    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Calendar;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Calendar;
    Container.call(this, options);

    this.native.SelectedDate = new Date();
    this.nativeView.SelectionMode = $.System.Windows.Controls.CalendarSelectionMode.SingleDate;
  }

  DateWell.prototype = Object.create(Container.prototype);
  DateWell.prototype.constructor = DateWell;

  Object.defineProperty(DateWell.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView.Background); },
    set:function(e) { this.nativeView.Background = new Color(e.native); }
  });

  // TODO: Unsure what to do, set background color to transparent? why was this added
  // to OSX build? Investigate and see best solution.
  //Object.defineProperty(DateWell.prototype, 'transparent', {
  //  get:function() { return this.nativeView.Backgrou },
  //  set:function(e) { this.nativeView('setDrawsBackground',e ? $.YES : $.NO); }
  //});
  // TODO: See above
  //Object.defineProperty(DateWell.prototype, 'textColor', {
  //  get:function() { return new Color(this.nativeView('textColor')); },
  //  set:function(e) { this.nativeView('setTextColor',e.native); }
  //});
  // TODO: See above
  //Object.defineProperty(DateWell.prototype, 'border', {
  //  get:function() { return this.nativeView('isBordered') === $.YES ? true : false; },
  //  set:function(e) { this.nativeView('setBordered',e ? $.YES : $.NO); }
  //});

  /*
  TODO: equivelant on Win?..
  Object.defineProperty(DateWell.prototype, 'style', {
    get:function() {
      var nsstyle = this.nativeView('datePickerStyle');
      if(nsstyle === $.NSTextFieldAndStepperDatePickerStyle) return "step";
      else if (nsstyle === $.NSClockAndCalendarDatePickerStyle) return "clock";
      else return "default";
    },
    set:function(e) {
      if(e === "step") this.nativeView('setDatePickerStyle', $.NSTextFieldAndStepperDatePickerStyle);
      else if (e === "clock") this.nativeView('setDatePickerStyle', $.NSClockAndCalendarDatePickerStyle);
      else if (e === "default") this.nativeView('setDatePickerStyle', $.NSTextFieldDatePickerStyle);
    }
  });*/

  Object.defineProperty(DateWell.prototype, 'range', {
    get:function() { return this.nativeView.SelectionMode === $.System.Windows.Controls.CalendarSelectionMode.SingleDate ? true : false; },
    set:function(e) { 
      this.nativeView.SelectionMode =  e ? $.System.Windows.Controls.CalendarSelectionMode.SingleRange : 
        $.System.Windows.Controls.CalendarSelectionMode.SingleDate;
    }
  });

  Object.defineProperty(DateWell.prototype, 'value', {
    get:function() { return this.nativeView.SelectedDate.getTime(); },
    set:function(e) {
      var d = new Date(e);
      this.nativeView.SelectedDate = d;
    }
  });

  global.__TINT.DateWell = DateWell;
  return DateWell;
})();

