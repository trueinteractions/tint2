module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');

  function SelectInput() 
  {
    Container.call(this, $.NSComboBox, $.NSComboBox,  {mouseDownBlocks:true,keyDownBlocks:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);

    var NSComboBoxDelegate = $.NSObject.extend('NSComboBoxDelegate'+Math.round(Math.random()*10000));
    NSComboBoxDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSComboBoxDelegate.addMethod('controlTextDidChange:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('keydown'); // NSTextField's do not allow overriding the keyDown component, however
                                   // the input event is fired directly after the event has been processed.
        this.fireEvent('input');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSComboBoxDelegate.addMethod('comboBoxSelectionDidChange:','v@:@', function(self,_cmd,frame) {
     try {
        this.fireEvent('change');
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSComboBoxDelegate.addMethod('controlTextDidBeginEditing:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('inputstart');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSComboBoxDelegate.addMethod('controlTextDidEndEditing:','v@:@', function(self,_cmd,frame) { 
      try {
        this.fireEvent('inputend');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    NSComboBoxDelegate.register();
    var NSComboBoxDelegateInstance = NSComboBoxDelegate('alloc')('init');
    this.nativeView('setDelegate',NSComboBoxDelegateInstance);

    Object.defineProperty(this, 'value', {
      get:function() { 
        var ndx = this.selectedIndex;
        if(ndx == -1) return this.nativeView('stringValue')('UTF8String'); 
        else return this.nativeView('itemObjectValueAtIndex',this.nativeView('indexOfSelectedItem'));
      },
      set:function(e) { this.nativeView('setStringValue',$(e)); }
    });

    Object.defineProperty(this, 'selectedIndex', {
      get:function() { return this.nativeView('indexOfSelectedItem'); },
      set:function(e) { this.nativeView('selectItemAtIndex', e); }
    });

    this.addItem = function(item) {
      this.nativeView('addItemWithObjectValue',$(item));
    }

    this.addItemAtIndex = function(item, index) {
      this.nativeView('insertItemWithObjectValue',$(item),'atIndex',index);
    }

    this.removeItemAtIndex = function(index) {
      this.nativeView('removeItemAtIndex', index);
    }

    this.removeItem = function(item) {
      this.nativeView('removeItemWithObjectValuel',$(item));
    }

    this.item = function(index) {
      return this.nativeView('itemObjectValueAtIndex',index);
    }

    Object.defineProperty(this, 'length', {
      get:function() { return this.nativeView('numberOfItems'); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return this.nativeView('isEnabled'); },
      set:function(e) { this.nativeView('setEnabled',e); }
    });

    Object.defineProperty(this, 'alignment', {
      get:function() {
        if (this.nativeView('alignment') == 0) return "left";
        else if (this.nativeView('alignment') == 1) return "right";
        else if (this.nativeView('alignment') == 2) return "center";
        //else if (this.nativeView('alignment') == 3) return "justified";
        //else if (this.nativeView('alignment') == 4) return "natural";
        else return "unknown";
      },
      set:function(e) {
        if(e == 'left') this.nativeView('setAlignment', 0);
        else if (e == 'right') this.nativeView('setAlignment', 1);
        else if (e == 'center') this.nativeView('setAlignment', 2);
        //else if (e == 'justified') $text('setAlignment', 3);
        //else if (e == 'natural') $text('setAlignment', 4);
      }
    });

    Object.defineProperty(this, 'visible', {
      get:function() { return !this.nativeView('isHidden'); },
      set:function(e) { this.nativeView('setHidden',e ? false : true); }
    });

    Object.defineProperty(this, 'readonly', {
      get:function() { return !this.nativeView('isEditable'); },
      set:function(e) { this.nativeView('setEditable',!e); }
    });

    Object.defineProperty(this, 'linewrap', {
      get:function() { return this.nativeView('cell')('wraps'); },
      set:function(e) { this.nativeView('cell')('setWraps', e ? true : false ); }
    });

    Object.defineProperty(this, 'scrollable', {
      get:function() { return this.nativeView('cell')('isScrollable'); },
      set:function(e) { this.nativeView('cell')('setScrollable', e ? true : false ); }
    });
  }

  SelectInput.prototype = Object.create(Container.prototype);
  SelectInput.prototype.constructor = SelectInput;
  return SelectInput;
})();