module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

  function DateWell(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSDatePicker, $.NSDatePicker, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.nativeView('setDatePickerStyle', $.NSTextFieldDatePickerStyle);
    this.nativeView('setBordered', $.NO);
    this.nativeView('setDateValue', $.NSDate('date'));
  }

  DateWell.prototype = Object.create(Container.prototype);
  DateWell.prototype.constructor = DateWell;

  Object.defineProperty(DateWell.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView('backgroundColor')); },
    set:function(e) { this.nativeView('setBackgroundColor',e.native); }
  });

  Object.defineProperty(DateWell.prototype, 'transparent', {
    get:function() { return this.nativeView('drawsBackground') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setDrawsBackground',e ? $.YES : $.NO); }
  });

  Object.defineProperty(DateWell.prototype, 'textColor', {
    get:function() { return new Color(this.nativeView('textColor')); },
    set:function(e) { this.nativeView('setTextColor',e.native); }
  });

  Object.defineProperty(DateWell.prototype, 'border', {
    get:function() { return this.nativeView('isBordered') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setBordered',e ? $.YES : $.NO); }
  });

  Object.defineProperty(DateWell.prototype, 'style', {
    get:function() {
      var nsstyle = this.nativeView('datePickerStyle');
      if(nsstyle == $.NSTextFieldAndStepperDatePickerStyle) return "step";
      else if (nsstyle == $.NSClockAndCalendarDatePickerStyle) return "clock";
      else return "default";
    },
    set:function(e) {
      if(e == "step") this.nativeView('setDatePickerStyle', $.NSTextFieldAndStepperDatePickerStyle);
      else if (e == "clock") this.nativeView('setDatePickerStyle', $.NSClockAndCalendarDatePickerStyle);
      else if (e == "default") this.nativeView('setDatePickerStyle', $.NSTextFieldDatePickerStyle);
    }
  });

  Object.defineProperty(DateWell.prototype, 'range', {
    get:function() { return this.nativeView('datePickerMode') == $.NSRangeDateMode ? true : false; },
    set:function(e) { this.nativeView('setDatePickerMode', e ? $.NSRangeDateMode : $.NSSingleDateMode); }
  });

  Object.defineProperty(DateWell.prototype, 'value', {
    get:function() { return new Date(this.nativeView('dateValue')('timeIntervalSince1970')*1000); },
    set:function(e) {
      var d = new Date(e);
      this.nativeView('setDateValue',$(d));
    }
  });

  return DateWell;
})();

