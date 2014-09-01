module.exports = (function() {
  var $ = process.bridge.objc;
  var TextInput = require('TextInput');

  function SelectInput(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['comboBoxSelectionDidChange:','v@:@', function(self,_cmd,frame) { this.fireEvent('change');  }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      TextInput.call(this, NativeObjectClass, NativeViewClass, options);
    else
      TextInput.call(this, $.NSComboBox, $.NSComboBox, options);
  }

  SelectInput.prototype = Object.create(TextInput.prototype);
  SelectInput.prototype.constructor = SelectInput;

  Object.defineProperty(SelectInput.prototype, 'value', {
    get:function() {
      if(this.selectedIndex == -1) return this.nativeView('stringValue')('UTF8String'); 
      else return this.nativeView('itemObjectValueAtIndex',this.nativeView('indexOfSelectedItem'));
    },
    set:function(e) { this.nativeView('setStringValue',$(e)); }
  });

  Object.defineProperty(SelectInput.prototype, 'selectedIndex', {
    get:function() { return this.nativeView('indexOfSelectedItem'); },
    set:function(e) { this.nativeView('selectItemAtIndex', e); }
  });

  Object.defineProperty(SelectInput.prototype, 'length', { get:function() { return this.nativeView('numberOfItems'); } });
  SelectInput.prototype.addItem = function(item) { this.nativeView('addItemWithObjectValue',$(item)); }
  SelectInput.prototype.addItemAtIndex = function(item, index) { this.nativeView('insertItemWithObjectValue',$(item),'atIndex',index); }
  SelectInput.prototype.removeItemAtIndex = function(index) { this.nativeView('removeItemAtIndex', index); }
  SelectInput.prototype.removeItem = function(item) { this.nativeView('removeItemWithObjectValuel',$(item));  }
  SelectInput.prototype.item = function(index) { return this.nativeView('itemObjectValueAtIndex',index); }

  return SelectInput;
})();