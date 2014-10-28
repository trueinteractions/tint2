module.exports = (function() {
  var $ = process.bridge.dotnet;
  var TextInput = require('TextInput');

  function SelectInput(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      TextInput.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      TextInput.call(this, $.System.Windows.Controls.ComboBox, $.System.Windows.Controls.ComboBox, options);

      this.native.addEventListener('GotFocus', function() { 
        setTimeout(function() { this.fireEvent('inputstart'); }.bind(this),5);
      }.bind(this));
      this.native.addEventListener('LostFocus', function() { this.fireEvent('inputend'); }.bind(this));
      this.native.addEventListener('TextInput', function() { 
        setTimeout(function() { this.fireEvent('input'); }.bind(this),0);
      }.bind(this));
    }
    this.native.IsEditable = true;
    this.native.addEventListener('SelectionChanged', function() {
      this.fireEvent('change');
    }.bind(this));
  }

  SelectInput.prototype = Object.create(TextInput.prototype);
  SelectInput.prototype.constructor = TextInput;

  Object.defineProperty(SelectInput.prototype, 'value', {
    get:function() {
      if(this.native.SelectedIndex == -1) return this.native.Text;
      else return this.native.SelectedValue.toString();
    },
    set:function(e) { this.native.Text = e.toString(); }
  });

  Object.defineProperty(SelectInput.prototype, 'selectedIndex', {
    get:function() { return this.native.SelectedIndex; },
    set:function(e) { this.native.SelectedIndex = e; }
  });

  Object.defineProperty(SelectInput.prototype, 'length', { get:function() { return this.native.Items.Count; } });
  SelectInput.prototype.addItem = function(item) {
    this.native.Items.Add(item);
  }
  SelectInput.prototype.addItemAtIndex = function(item, index) {
    this.native.Items.Insert(index, item);
  }
  SelectInput.prototype.removeItemAtIndex = function(index) { 
    this.native.Items.RemoveAt(index);
  }
  SelectInput.prototype.removeItem = function(item) {
    this.native.Items.Remove(item);
  }
  SelectInput.prototype.item = function(index) { 
    return this.native.Items.GetItemAt(index);
  }

  return SelectInput;
})();