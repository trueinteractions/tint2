module.exports = (function() {
  if(global.__TINT.Table) {
    return global.__TINT.Table;
  }
  var $ = process.bridge.dotnet;
  var utils = require('Utilities');
  var Container = require('Container');
  var assert = require('assert');

  function Table(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.DataGrid;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.DataGrid;
    Container.call(this, options);
    this.private.spaceX = 1;
    this.private.spaceY = 1;
    this.private.columns = {};
    this.private.columnsIndex = {};
    this.private.rows = [];
    this.private.allowEmptySelection = true;
    this.nativeView.AutoGenerateColumns = false;
    this.nativeView.IsReadOnly = true;
    this.alternatingColors = true;
    this.nativeView.BorderThickness = new $.System.Windows.Thickness(0);
    this.nativeView.GridLinesVisibility = $.System.Windows.Controls.DataGridGridLinesVisibility.None;
    this.nativeView.ColumnWidth = new $.System.Windows.Controls.DataGridLength(1, $.System.Windows.Controls.DataGridLengthUnitType.Star);

    // These settings force the grid to act similar to OSX.
    this.nativeView.VerticalScrollBarVisibility =  $.System.Windows.Controls.ScrollBarVisibility.Disabled;
    this.nativeView.HorizontalScrollBarVisibility =  $.System.Windows.Controls.ScrollBarVisibility.Disabled;
    this.nativeView.AlternatingRowBackground = $.System.Windows.SystemColors.ControlLightLightBrush;
    this.nativeView.RowHeaderWidth = 0.0;
    this.nativeView.SelectionUnit = $.System.Windows.Controls.DataGridSelectionUnit.FullRow;

    this.private.select = function() { this.fireEvent('select'); }.bind(this);
    this.private.selected = function() { this.fireEvent('selected'); }.bind(this);
    this.private.columnMoved = function() { this.fireEvent('column-moved'); }.bind(this);
    this.private.columnResized = function(name) { this.fireEvent('column-resized', [name]); }
    this.private.columnClicked = function(name) { this.fireEvent('column-clicked', [name]); }
    this.private.columnMouseDown = function(name) { this.fireEvent('column-mousedown', [name]); }

    utils.lazyLoadEventListener(this, 'select',
      this.native.addEventListener.bind(this.native,'SelectionChanged', this.private.select),
      this.native.removeEventListener.bind(this.native, 'SelectionChanged', this.private.select));
    utils.lazyLoadEventListener(this, 'selected',
      this.native.addEventListener.bind(this.native,'SelectionChanged', this.private.selected),
      this.native.removeEventListener.bind(this.native, 'SelectionChanged', this.private.selected));
    utils.lazyLoadEventListener(this, 'column-moved',
      this.native.addEventListener.bind(this.native,'ColumnReordered', this.private.columnMoved),
      this.native.removeEventListener.bind(this.native, 'ColumnReordered', this.private.columnMoved));
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  var columnCount = 0;
  Table.prototype.addColumn = function(name) {
    var column = new $.TintInterop.TintDataGridColumn();
    column.Header = name;
    column.Binding = new $.System.Windows.Data.Binding(name);
    column.MaxWidth = 2000;
    column.MinWidth = 20;
    this.native.Columns.Add(column);
    this.private.columns[name] = column;
    column.DisplayIndex = columnCount;
    columnCount++;
    this.fireEvent('column-added');
    var crFireFunc = this.private.columnResized.bind(this, name); 
    utils.lazyLoadEventListener(this, 'column-resized',
      this.native.addEventListener.bind(column,'ColumnReordered', crFireFunc),
      this.native.removeEventListener.bind(column, 'ColumnReordered', crFireFunc));
    var ccFireFunc = this.private.columnClicked.bind(this, name); 
    utils.lazyLoadEventListener(this, 'column-clicked',
      this.native.addEventListener.bind(column,'PreviewMouseDown', ccFireFunc),
      this.native.removeEventListener.bind(column, 'PreviewMouseDown', ccFireFunc));
    var cmFireFunc = this.private.columnMouseDown.bind(this, name); 
    utils.lazyLoadEventListener(this, 'column-mousedown',
      this.native.addEventListener.bind(column,'PreviewMouseDown', cmFireFunc),
      this.native.removeEventListener.bind(column, 'PreviewMouseDown', cmFireFunc));
  };

  Table.prototype.removeColumn = function(name) {
    assert(amountOfColumns !== 0, 'There are no more columns to be removed.');
    this.nativeView.Columns.RemoveAt(this.nativeView.Columns.IndexOf(this.private.columns[name]));
    this.private.columns[name] = null;
    this.fireEvent('column-removed');
  };

  Table.prototype.addRow = function(ndx) {
    ndx = ndx || this.numberOfRows;
    assert(ndx <= this.numberOfRows, 
      'The passed in index ' + ndx + ' was greater than the number of rows.');
    var itemsRow = {};
    for(var name in this.private.columns) {
      if(name) {
        var label = new $.System.Windows.Controls.Label();
        label.Content = '';
        itemsRow[name] = label;
      }
    }
    this.private.rows[ndx] = itemsRow;
    this.nativeView.Items.Insert(ndx, this.private.rows[ndx]);
    this.fireEvent('row-added', [ndx]);
  };

  Table.prototype.removeRow = function(ndx) {
    ndx = (typeof(ndx) === "number") ? ndx : this.numberOfRows;
    assert(ndx < this.numberOfRows, 
      'The passed in index ' + ndx + ' was greater than the number of rows.');
    var items = this.nativeView.Items;
    var columnCount = this.nativeView.Columns.Count;
    for(var i=0; i < columnCount; i++) {
      items.RemoveAt(ndx * columnCount);
    }
    this.fireEvent('row-removed',[ndx]);
  };

  Table.prototype.moveColumn = function(ndx, toNdx) {
    if(ndx === toNdx) {
      return;
    }
    for(var key in this.private.columns) {
      if(this.private.columns[key].DisplayIndex === ndx) {
        this.private.columns[key].DisplayIndex = toNdx;
        break;
      }
    }
  };

  Table.prototype.moveRow = function(ndx, toNdx) {
    if(ndx === toNdx) {
      return;
    }
    var row = this.private.rows.splice(ndx, 1);
    this.private.rows.splice(toNdx, row[0]); //(ndx < toNdx) ? (toNdx - 1) : 
    this.nativeView.Items.RemoveAt(ndx);
    this.nativeView.Items.Insert(toNdx, row[0]); //(ndx < toNdx) ? (toNdx - 1) : 
  };

  Table.prototype.setColumnWidth = function(name,width) {
    this.private.columns[name].Width = new $.System.Windows.Controls.DataGridLength(width, 
      $.System.Windows.Controls.DataGridLengthUnitType.Pixel);
  };

  Table.prototype.setValueAt = function(name,rowIndex,value) {
    if(typeof(value) === 'string') {
      var label = new $.System.Windows.Controls.Label();
      label.Content = value;
      this.private.rows[rowIndex][name] = label;
    } else {
      this.private.rows[rowIndex][name] = value.nativeView;
    }
    this.nativeView.Items.RemoveAt(rowIndex);
    this.nativeView.Items.Insert(rowIndex, this.private.rows[rowIndex]);
  };

  Object.defineProperty(Table.prototype, 'rowHeightStyle', {
    get:function() {
      if(this.rowHeight === 22) {
        return "small";
      } else if (this.rowHeight === 24) {
        return "medium";
      } else if (this.rowHeight === 36) {
        return "large";
      } else {
        return "unknown";
      }
    },
    set:function(e) {
      if(e === "small") {
        this.rowHeight = 22;
      } else if (e === "medium") {
        this.rowHeight = 24;
      } else if (e === "large") {
        this.rowHeight = 36;
      }
    }
  });

  Object.defineProperty(Table.prototype, 'multipleSelection', {
    get:function() { return this.nativeView.SelectionMode === $.System.Windows.Controls.DataGridSelectionMode.Extended; },
    set:function(e) { 
      this.nativeView.SelectionMode = e ? 
        $.System.Windows.Controls.DataGridSelectionMode.Extended : 
        $.System.Windows.Controls.DataGridSelectionMode.Single;
    }
  });
  
  Object.defineProperty(Table.prototype, 'emptySelection', {
    get:function() { this.private.allowEmptySelection },
    set:function(e) { this.private.allowEmptySelection = e ? true : false; }
  });

  Object.defineProperty(Table.prototype, 'columnsCanBeMoved', {
    get:function() { return this.nativeView.CanUserReorderColumns ? true : false; },
    set:function(e) { this.nativeView.CanUserReorderColumns = (e ? true : false); }
  });

  Object.defineProperty(Table.prototype, 'columnsCanBeResized', {
    get:function() { return this.nativeView.CanUserResizeColumns ? true : false; },
    set:function(e) { this.nativeView.CanUserResizeColumns = (e ? true : false); }
  });

  Object.defineProperty(Table.prototype, 'spaceX', {
    get:function() { return this.private.spaceX; },
    set:function(e) { this.private.spaceX = e; }
  });

  Object.defineProperty(Table.prototype, 'spaceY', {
    get:function() { return this.private.spaceY; },
    set:function(e) { 
      this.private.spaceY = e; 
      this.nativeView.RowHeight = this.nativeView.RowHeight + (this.private.spaceY * 2); 
    }
  });

  Object.defineProperty(Table.prototype, 'rowHeight', {
    get:function() { return this.nativeView.RowHeight - (this.private.spaceY * 2); },
    set:function(e) { this.nativeView.RowHeight = e + (this.private.spaceY * 2); }
  });

  Object.defineProperty(Table.prototype, 'selectedRows', {
    get:function() { 
      var selItems = this.nativeView.SelectedItems;
      var selCount = selItems.Count;
      var selIndexes = [];
      for(var i=0; i < selCount; i++) {
        selIndexes.push(selItems.Item.GetValue(i).GetIndex());
      }
      return selIndexes; 
    },
    set:function(rows) {
      this.fireEvent('select');
      var selItems = this.nativeView.SelectedItems;
      var selCount = selItems.Count;
      for(var i=0; i < selCount; i++) {
        if(rows.indexOf(i) > -1) {
          selItems.Items.GetValue(i).IsSelected = true;
        }
      }
      this.fireEvent('selected');
    }
  });

  Object.defineProperty(Table.prototype, 'numberOfColumns', {
    get:function() { return this.nativeView.Columns.Count; }
  });

  Object.defineProperty(Table.prototype, 'numberOfRows', {
    get:function() { return this.nativeView.Items.Count; }
  });

  Object.defineProperty(Table.prototype, 'alternatingColors', {
    get:function() { this.nativeView.AlternationIndex === 2 ? true : false; },
    set:function(e) { 
      if(e) {
        this.nativeView.AlternationIndex = 2;
        this.nativeView.RowBackground = $.System.Windows.SystemColors.ControlBrush;
      } else {
        this.nativeView.AlternationIndex = 0;
        this.nativeView.RowBackground = $.System.Windows.SystemColors.ControlLightLightBrush;
      } 
    }
  });

  global.__TINT.Table = Table;

  return Table;
})();
