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

    this.private.amountSelected = 0;
    this.private.rowHeight = 22;
    this.private.containers = [];
    this.private.header = new $.System.Windows.Controls.RowDefinition();
    this.private.header.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.header);

    this.private.columns = [];
    this.private.rows = [];
    this.private.items = [];
    this.private.columnsSelectable = true;
    this.private.multiple = false;
    this.private.allowEmptySelection = true;
    this.private.isTrackingSelects = false;
    this.private.alternatingColors = true;
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  function setRowState(rowIndex, state) {
    for(var colIndex = 0; colIndex < this.private.containers.length; colIndex++)
    {
      var item = this.private.containers[colIndex][rowIndex];
      if(state == "selected") {
        item.itemSelected = true;
        item.BorderBrush = $.System.Windows.SystemColors.HighlightBrush;
        item.Background = $.System.Windows.SystemColors.HighlightBrush;
      } else {
        item.itemSelected = false;
        item.BorderBrush = item.OriginalBorderBrush;
        item.Background = item.OriginalBackground;
      }
    }
  }

  function addCell(rowNdx,colNdx) {
    var onCellSelect = function() {
      this.fireEvent('select');
      var conts = this.private.containers;
      var item = conts[colNdx][rowNdx];
      var selected = item.itemSelected;
      var shiftDown = $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.LeftShift) 
                    || $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.RightShift);
      var cntlDown = $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.LeftCtrl) 
                    || $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.RightCtrl);
      var multiple = this.private.multiple;
      var canBeEmpty = this.private.allowEmptySelection;
      var rowAmount = this.private.rowsSelected;
      var firstIndex = null;
      var lastIndex = null;

      conts[0].forEach(function(item, index, array) {
        if(item.itemSelected && firstIndex == null) firstIndex = index;
        if(item.itemSelected) lastIndex = index;
      }.bind(this));

      // add/remove selection
      if(multiple && cntlDown) {
        setRowState.apply(this,[rowNdx, !selected ? "selected" : "unselected"]);
      // range
      } else if (multiple && shiftDown && firstIndex != null) {
        for(var i=firstIndex; i <= rowNdx; i++)
          setRowState.apply(this,[i, !selected ? "selected" : "unselected"]);
        if(firstIndex <= rowNdx) selected = !selected;
        for(var i=rowNdx+1; i < lastIndex; i++)
          setRowState.apply(this,[i, !selected ? "selected" : "unselected"]);
      // force "selected"
      } else if (!multiple || multiple && firstIndex == null || !shiftDown && multiple) {
        conts[0].forEach(function(val,index,arr) {
            setRowState.apply(this,[index, (rowNdx == index) ? "selected" : "unselected"]);
        }.bind(this));
      }
      this.fireEvent('selected');
    }

    var s = new $.System.Windows.Controls.Border();
    s.BorderThickness = new $.System.Windows.Thickness(1);
    if(rowNdx % 2 == 1) {
      s.BorderBrush = $.System.Windows.SystemColors.ControlBrush;
      s.Background = $.System.Windows.SystemColors.ControlBrush;
    } else {
      s.BorderBrush = $.System.Windows.SystemColors.ControlLightLightBrush;
      s.Background = $.System.Windows.SystemColors.ControlLightLightBrush;
    }
    s.OriginalBorderBrush = s.BorderBrush;
    s.OriginalBackground = s.Background;
    s.Height = this.private.rowHeight;
    s.SetValue($.System.Windows.Controls.Grid.ColumnProperty, colNdx);
    s.SetValue($.System.Windows.Controls.Grid.RowProperty, rowNdx+1);
    s.itemSelected = false;
    s.addEventListener('PreviewMouseUp', function() {
      onCellSelect.apply(this);
    }.bind(this));
    this.private.containers[colNdx][rowNdx] = s;
    this.nativeView.InternalChildren.Add(s);
  }

  Table.prototype.addColumn = function(e) {
    var view = new $.System.Windows.Controls.Label(); 
    view.addEventListener('PreviewMouseDown', function() {
      this.fireEvent('column-mousedown',e);
    }.bind(this));
    view.addEventListener('PreviewMouseUp', function() {
      this.fireEvent('column-clicked',e);
    }.bind(this));
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
    view.BorderBrush = $.System.Windows.SystemColors.ControlLightBrush;
    view.BorderThickness = new $.System.Windows.Thickness(0,0,1,1);
    this.nativeView.InternalChildren.Add(view);
    if(!this.private.containers[ndx])
      this.private.containers[ndx] = [];
    for(var i=0; i < this.numberOfRows; i++) 
      addCell.apply(this,[i,ndx]);
  }

  Table.prototype.removeColumn = function(e) {
    var ndx = this.private.findColumn(e);
    if(ndx == -1) throw new Error("Column named: " + e + " was not found.");
    this.native.ColumnDefinitions.Remove(column.definition);
    this.private.columns.splice(ndx,1);
    this.private.containers.splice(ndx,1);
  }

  Table.prototype.addRow = function(ndx) {
    this.private.rows.push({
      definition:(new $.System.Windows.Controls.RowDefinition())
    });
    var ndx = this.private.rows.length - 1;
    this.private.rows[ndx].definition.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.rows[ndx].definition);
    this.fireEvent('row-added');
    for(var i=0; i < this.numberOfColumns; i++)
      addCell.apply(this,[ndx,i]);
  }

  Table.prototype.removeRow = function(ndx) {
    if(ndx < 0 || (ndx > this.private.rows.length -1 ))
      throw new Error("Row at index: " + ndx + " was not found.");
    this.native.RowDefinitions.Remove(this.private.rows.definition);
    this.private.rows.splice(ndx,1);
    this.fireEvent('row-removed');
    for(var i=0; i < this.numberOfColumns; i++)
      this.private.containers[i].splice(ndx,1);
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
    var c = this.private.containers[toNdx];
    for(var i=0; i < c.length; i++)
      c[i].SetValue($.System.Windows.Controls.Grid.ColumnProperty, toNdx);
    var d = this.private.containers[ndx];
    for(var i=0; i < c.length; i++)
      c[i].SetValue($.System.Windows.Controls.Grid.ColumnProperty, ndx);
    this.private.containers[toNdx] = c;
    this.private.containers[ndx] = d;
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
    for(var i=0; i < this.private.containers.length; i++) {
      var col = this.private.containers[i];
      var a = col[ndx]
      var b = col[toNdx];
      a.SetValue($.System.Windows.Controls.Grid.RowProperty, toNdx);
      b.SetValue($.System.Windows.Controls.Grid.RowProperty, ndx);
      col[toNdx] = a;
      col[ndx] = b;
    }
  }

  Table.prototype.setColumnWidth = function(id,e) {
    var ndx = this.private.findColumn(id);
    if(ndx == -1) throw new Error("Column named: " + e + " was not found.");
    this.private.columns[ndx].definition.Width = new $.System.Windows.GridLength(e, $.System.Windows.GridLength.Pixel);
    this.fireEvent('column-resized');
  }

  Table.prototype.setValueAt = function(columnId,row,value) {
    if(typeof(value) == "string" || typeof(value) == "number") {
      var v = value;
      value = new TextInput();
      value.value = v.toString();
    }
    this.private.containers[this.private.findColumn(columnId)][row].Child = value.native;
  }

  Object.defineProperty(Table.prototype, 'rowHeightStyle', {
    get:function() {
      if(this.rowHeight == 22) return "small";
      else if (this.rowHeight == 24) return "medium";
      else if (this.rowHeight == 36) return "large";
      else return "unknown";
    },
    set:function(e) {
      if(e == "small") this.rowHeight = 22;
      else if (e == "medium") this.rowHeight = 24;
      else if (e == "large") this.rowHeight = 36;
    }
  });

  Object.defineProperty(Table.prototype, 'multipleSelection', {
    get:function() { return this.private.multiple; },
    set:function(e) { this.private.multiple = e ? true : false; }
  });
  
  Object.defineProperty(Table.prototype, 'emptySelection', {
    get:function() { return this.private.allowEmptySelection; },
    set:function(e) { this.private.allowEmptySelection = e ? true : false; }
  });

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

  // TODO: Implement me.
  Object.defineProperty(Table.prototype, 'columnsCanBeSelected', {
    get:function() { return this.private.columnsSelectable; },
    set:function(e) { this.private.columnsSelectable = e ? true : false; }
  });

  /* Not implemeneted, OSX doesn't seem to obey this.
  Object.defineProperty(Table.prototype, 'backgroundColor', {
    get:function() { return new Color(this.native.Background.Color); },
    set:function(e) { this.native.Background = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });
  */
  /* Not implemeneted, OSX doesn't seem to obey this.
  Object.defineProperty(Table.prototype, 'borderColor', {
    get:function() {  },
    set:function(e) {  }
  });
  */

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
      for(var i=0; i < this.private.rows.length; i++)
        this.private.rows[i].definition.Height = new $.System.Windows.GridLength(this.private.rowHeight, $.System.Windows.GridLength.Pixel);
      for(var i=0; i < this.private.containers.length ; i++) {
        var col = this.private.containers[i];
        for(var j=0; j < col.length; j++) {
          this.private.containers[i][j].Height = this.private.rowHeight;
        }
      } 
    }
  });

  // TODO: implement me
  Object.defineProperty(Table.prototype, 'selectedColumns', {
    get:function() {
    },
    set:function(e) {
    }
  });

  Object.defineProperty(Table.prototype, 'selectedRows', {
    get:function() {
      var cols = this.private.containers;
      var rows = [];
      for(var i=0; i < cols.length; i++)
        for(var j=0; j < cols[i].length; j++)
          if(cols[i][j].itemSelected == true
              && rows.indexOf(j) == -1)
            rows.push(j);
      return rows;
    },
    set:function(e) {
      this.fireEvent('select');
      var conts = this.private.containers;
      for(var i=0; i < conts[0].length; i++) {
        var selected = e.indexOf(i) == -1 ? false : true;
        setRowState.apply(this,[i, selected ? "selected" : "unselected"]);
      }
      this.fireEvent('selected');
    }
  });

  Object.defineProperty(Table.prototype, 'numberOfColumns', {
    get:function() { return this.private.columns.length; }
  });

  Object.defineProperty(Table.prototype, 'numberOfRows', {
    get:function() { return this.private.rows.length; }
  });

  // TODO: Implement me.
  Object.defineProperty(Table.prototype, 'alternatingColors', {
    get:function() { return this.private.alternatingColors; },
    set:function(e) { this.private.alternatingColors = e ? true : false; }
  });


  return Table;
})();
