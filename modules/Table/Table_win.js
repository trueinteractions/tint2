module.exports = (function() {
  var $ = process.bridge.dotnet;
  var Container = require('Container');
  var TextInput = require('TextInput');
  var Color = require('Color');

  function Table(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Grid, $.System.Windows.Controls.Grid, options);
    }
    // select
    // selected
    // column-resized
    // column-clicked (id)
    // column-mousedown (id)
    this.private.findColumn = function(name) {
      var column = null;
      var ndx = -1;
      for(var i=0; i < this.private.columns.length; i++)
        if(this.private.columns[i].title == name) {
          column = this.private.columns[i];
          ndx = i;
        }
      return ndx;
    }.bind(this);

    this.private.rowheight = 25;
    this.private.header = new $.System.Windows.Controls.RowDefinition();
    this.private.header.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.header);

    this.private.columns = [];
    this.private.rows = [];
    this.private.items = [];
    this.private.selectable = true;
    this.private.multiple = false;
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  Table.prototype.addColumn = function(e) {
    var view = new $.System.Windows.Controls.Label(); 
    this.private.columns.push({
      definition:(new $.System.Windows.Controls.ColumnDefinition()),
      title:e,
      view:view
    });
    var ndx = this.private.columns.length - 1;
    view.Content = e.toString();
    this.nativeView.ColumnDefinitions.Add(this.private.columns[ndx].definition);
    view.SetValue($.System.Windows.Controls.Grid.ColumnProperty, ndx);
    view.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
    this.nativeView.InternalChildren.Add(view);
  }

  Table.prototype.removeColumn = function(e) {
    var ndx = this.private.findColumn(e);
    if(ndx == -1) throw new Error("Column named: " + e + " was not found.");
    this.native.ColumnDefinitions.Remove(column.definition);
    this.private.columns.splice(ndx,1);
  }

  Table.prototype.addRow = function(ndx) {
    this.private.rows.push({
      definition:(new $.System.Windows.Controls.RowDefinition())
    });
    var ndx = this.private.rows.length - 1;
    this.private.rows[ndx].definition.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.rows[ndx].definition);
    this.fireEvent('row-added');
  }

  Table.prototype.removeRow = function(ndx) {
    if(ndx < 0 || (ndx > this.private.rows.length -1 ))
      throw new Error("Row at index: " + ndx + " was not found.");
    this.native.RowDefinitions.Remove(this.private.rows.definition);
    this.private.rows.splice(ndx,1);
    this.fireEvent('row-removed');
  }

  Table.prototype.moveColumn = function(ndx, toNdx) {
    var a = this.private.columns[ndx];
    var b = this.private.columns[toNdx];
    this.private.columns[toNdx] = a;
    this.private.columns[ndx] = b;
    this.native.ColumnDefinitions.Remove(a.definition);
    this.native.ColumnDefinitions.Remove(b.definition);
    if(toNdx < ndx) {
      this.native.ColumnDefinitions.Insert(toNdx,a.definition);
      this.native.ColumnDefinitions.Insert(ndx,b.definition);
    } else {
      this.native.ColumnDefinitions.Insert(ndx,a.definition);
      this.native.ColumnDefinitions.Insert(toNdx,b.definition);
    }
    for(var i=0; i < this.private.items.length ; i++) {
      var item = this.private.items[i];
      if(item.column == ndx) {
        item.container.SetValue($.System.Windows.Controls.Grid.ColumnProperty, toNdx);
        item.column = toNdx;
      } else if (item.column == toNdx) {
        item.container.SetValue($.System.Windows.Controls.Grid.ColumnProperty, ndx);
        item.column = ndx;
      }
    }
    this.fireEvent('column-move',[a.title]);
  }

  Table.prototype.moveRow = function(ndx, toNdx) {
    var a = this.private.rows[ndx];
    var b = this.private.rows[toNdx];
    this.private.rows[toNdx] = a;
    this.private.rows[ndx] = b;
    this.native.RowDefinitions.Remove(a.definition);
    this.native.RowDefinitions.Remove(b.definition);
    if(toNdx < ndx) {
      this.native.RowDefinitions.Insert(toNdx,a.definition);
      this.native.RowDefinitions.Insert(ndx,b.definition);
    } else {
      this.native.RowDefinitions.Insert(ndx,a.definition);
      this.native.RowDefinitions.Insert(toNdx,b.definition);
    }
    for(var i=0; i < this.private.items.length ; i++) {
      var item = this.private.items[i];
      if(item.row == ndx) {
        item.container.SetValue($.System.Windows.Controls.Grid.RowProperty, toNdx);
        item.row = toNdx;
      } else if (item.row == toNdx) {
        item.container.SetValue($.System.Windows.Controls.Grid.RowProperty, ndx);
        item.row = ndx;
      }
    }
  }

  Table.prototype.setColumnWidth = function(id,e) {
    var ndx = this.private.findColumn(id);
    if(ndx == -1) throw new Error("Column named: " + e + " was not found.");
    this.private.columns[ndx].definition.Width = new $.System.Windows.GridLength(e, $.System.Windows.GridLength.Pixel);
  }

  Table.prototype.setValueAt = function(columnId,row,value) {
    if(typeof(value) == "string" || typeof(value) == "number")
    {
      var v = value;
      value = new TextInput();
      value.value = v.toString();
    }
    var s = new $.System.Windows.Controls.Border();
    var item = {
      view:value,
      column:this.private.findColumn(columnId),
      row:row,
      container:s
    };
    s.Child = item.view.native;
    //if(row % 2 == 0)
    //  s.Backgorund = $.System.Windows.SystemColors.GrayTextBrush;
    this.private.items.push(item);
    s.SetValue($.System.Windows.Controls.Grid.RowProperty, row + 1); //item.view.native
    this.nativeView.InternalChildren.Add(s);
  }

  // default, small, medium, large
  /*Object.defineProperty(Table.prototype, 'rowHeightStyle', {
    get:function() { },
    set:function(e) { }
  });*/

  // TODO: Implement me.  User interface to move columns.
  Object.defineProperty(Table.prototype, 'columnsCanBeMoved', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: Implement me.  User interface to resize columns.
  Object.defineProperty(Table.prototype, 'columnsCanBeResized', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Table.prototype, 'multiple', {
    get:function() { return this.private.multiple; },
    set:function(e) { this.private.multiple = e ? true : false; }
  });
  
  // TODO: Implement me.
  Object.defineProperty(Table.prototype, 'emptySelection', {
    get:function() { return false; },
    set:function(e) { }
  });

  // TODO: Implement me.
  Object.defineProperty(Table.prototype, 'columnsCanBeSelected', {
    get:function() { return this.private.selectable; },
    set:function(e) { this.private.selectable = e ? true : false; }
  });

  Object.defineProperty(Table.prototype, 'backgroundColor', {
    get:function() { return new Color(this.native.Background.Color); },
    set:function(e) { this.native.Background = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  // TODO: implement me.
  Object.defineProperty(Table.prototype, 'borderColor', {
    get:function() {  },
    set:function(e) {  }
  });

  // TODO: implement me.
  Object.defineProperty(Table.prototype, 'spaceX', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: implement me.
  Object.defineProperty(Table.prototype, 'spaceY', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Table.prototype, 'rowHeight', {
    get:function() { return this.private.rowHeight; },
    set:function(e) { 
      this.private.rowHeight = e;
      for(var i=0; i < this.private.rows.length; i++) {
        this.private.rows[i].definition.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
      }
    }
  });

  // TODO: implement me
  Object.defineProperty(Table.prototype, 'focusedColumn', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Table.prototype, 'numberOfColumns', {
    get:function() { return this.private.columns.length; }
  });

  Object.defineProperty(Table.prototype, 'numberOfRows', {
    get:function() { return this.private.rows.length; }
  });

  Object.defineProperty(Table.prototype, 'alternatingColors', {
    get:function() { return this.private.alternatingColor; },
    set:function(e) { this.private.alternatingColor = e ? true : false; }
  });

  // TODO: implement me
  Table.prototype.scrollToRow = function(ndx) { }

  // TODO: implement me
  Table.prototype.scrollToColumn = function(ndx) { }

  return Table;
})();
