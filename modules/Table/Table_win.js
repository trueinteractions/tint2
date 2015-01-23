module.exports = (function() {
  if(global.__TINT.Table) {
    return global.__TINT.Table;
  }
  var $ = process.bridge.dotnet;
  var Container = require('Container');
  var TextInput = require('TextInput');
  var tableHelper = require('TableHelper');

  function Table(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Grid;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Grid;
    Container.call(this, options);

    this.private.findColumnByName = function(name) {
      for(var i=0; i < this.private.columns.length; i++) {
        if(this.private.columns[i].title === name) {
          return this.private.columns[i];
        }
      }
      return null;
    }.bind(this);

    this.private.findColumnByIndex = function(ndx) {
      for(var i=0; i < this.private.columns.length; i++) {
        var column = this.private.columns[i];
        if(column.index === ndx) {
          return this.private.columns[i];
        }
      }
      return null;
    }.bind(this);

    this.private.findRowByIndex = function(ndx) {
      for(var i=0; i < this.private.rows.length; i++) {
        if(this.private.rows[i].index === ndx) {
          return this.private.rows[i];
        }
      }
      return null;
    }.bind(this);

    this.private.setCell = function(cell, column, row) {
      cell.row = row;
      cell.column = column;
      cell.parent = this;
      //var removed = [];
      this.private.items = this.private.items.filter(function(item) {
        if(item.column === column && item.row === row) {
          //removed.push(item);
          return false;
        } else {
          return true;
        }
      });
      this.private.items.push(cell);
    }.bind(this);

    this.private.columnsCanBeResized = true;
    this.private.amountSelected = 0;
    this.private.header = new $.System.Windows.Controls.RowDefinition();
    this.private.header.Height = new $.System.Windows.GridLength(tableHelper.rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.header);
    this.private.rowHeight = tableHelper.rowHeight;
    this.private.columns = [];
    this.private.rows = [];
    this.private.items = [];
    this.private.multiple = false;
    this.private.allowEmptySelection = true;
    this.private.alternatingColors = true;
    this.private.spaceX = 1;
    this.private.spaceY = 1;
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  Table.prototype.addColumn = function(e) {
    var column = new tableHelper.Column();
    column.title = e;
    column.parent = this;
    this.private.columns.push(column);
    for(var i=0; i < this.private.rows.length; i++) {
      var cell = new tableHelper.Cell();
      var row = this.private.rows[i];
      this.private.setCell(cell, column, row);
    }
    this.fireEvent('column-added');
  };

  Table.prototype.removeColumn = function(e) {
    var column = this.private.findColumnByName(e);
    column.parent = null;
    this.private.columns.splice(this.private.columns.indexOf(column),1);
    this.fireEvent('column-removed');
  };

  Table.prototype.addRow = function() {
    var row = new tableHelper.Row();
    row.parent = this;
    this.private.rows.push(row);
    for(var i=0; i < this.private.columns.length; i++) {
      var cell = new tableHelper.Cell();
      var column = this.private.findColumnByIndex(i);
      this.private.setCell(cell, column, row);
    }
    this.fireEvent('row-added');
  };

  Table.prototype.removeRow = function(ndx) {
    var row = this.private.findRowByIndex(ndx);
    row.parent = null;
    this.private.rows.splice(this.private.rows.indexOf(row),1);
    this.fireEvent('row-removed');
  };

  Table.prototype.moveColumn = function(ndx, toNdx) {
    var columnFrom = this.private.findColumnByIndex(ndx);
    var columnTo = this.private.findColumnByIndex(toNdx);
    columnFrom.index = toNdx;
    columnTo.index = ndx;
  };

  Table.prototype.moveRow = function(ndx, toNdx) {
    var row = this.private.findRowByIndex(ndx);
    row.index = toNdx;
  };

  Table.prototype.setColumnWidth = function(name,e) {
    var column = this.private.findColumnByName(name);
    column.width = e;
  };

  Table.prototype.setValueAt = function(columnId,rowIndex,value) {
    if(typeof(value) === "string" || typeof(value) === "number") {
      var v = value;
      value = new TextInput();
      value.value = v.toString();
      value.readonly = true;
    }
    var cell = new tableHelper.Cell(value);
    var column = this.private.findColumnByName(columnId);
    var row = this.private.findRowByIndex(rowIndex+1);
    this.private.setCell(cell, column, row);
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
    get:function() { return this.private.multiple; },
    set:function(e) { this.private.multiple = (e ? true : false); }
  });
  
  Object.defineProperty(Table.prototype, 'emptySelection', {
    get:function() { return this.private.allowEmptySelection; },
    set:function(e) { this.private.allowEmptySelection = (e ? true : false); }
  });

  // TODO: Implement me.  User interface to move columns.
  //Object.defineProperty(Table.prototype, 'columnsCanBeMoved', {
  //  get:function() { },
  //  set:function(e) { }
  //});

  Object.defineProperty(Table.prototype, 'columnsCanBeResized', {
    get:function() { return this.private.columnsCanBeResized; },
    set:function(e) { 
      this.private.columnsCanBeResized = e ? true : false;
      this.private.columns.forEach(function(column) {
        column.resizable = this.private.columnsCanBeResized;
      }.bind(this));
    }
  });

  Object.defineProperty(Table.prototype, 'spaceX', {
    get:function() { return this.private.spaceX; },
    set:function(e) {
      this.private.spaceX = e;
      this.private.items.forEach(function(e) { 
        e.native.BorderThickness.Left = (this.private.spaceX / 2);
        e.native.BorderThickness.Right = (this.private.spaceX / 2);
      });
    }
  });

  Object.defineProperty(Table.prototype, 'spaceY', {
    get:function() { return this.private.spaceY; },
    set:function(e) {
      this.private.spaceY = e;
      this.private.rows.forEach(function(e) { 
        e.height = this.private.rowHeight + this.private.spaceY; 
      });
    }
  });

  Object.defineProperty(Table.prototype, 'rowHeight', {
    get:function() { return this.private.rowHeight; },
    set:function(e) { 
      this.private.rowHeight = e;
      this.private.rows.forEach(function(e) { 
        e.height = this.private.rowHeight + this.private.spaceY; 
      });
      this.private.items.forEach(function(e) { 
        e.height = this.private.rowHeight;
      });
    }
  });

  Object.defineProperty(Table.prototype, 'selectedRows', {
    get:function() {
      var rows = [];
      this.private.rows.forEach(function(row) {
        if(row.selected) {
          rows.push(row.index);
        }
      });
      return rows;
    },
    set:function(rows) {
      this.fireEvent('select');
      for(var i=0; i < rows.length; i++) {
        var row = this.private.findRowByIndex(rows[i]);
        row.selected = true;
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

  Object.defineProperty(Table.prototype, 'alternatingColors', {
    get:function() { return this.private.alternatingColors; },
    set:function(e) { 
      this.private.alternatingColors = e ? true : false;
      this.private.items.forEach(function(item) {
        var color = ((item.row.index % 2) === 1 && e) ? tableHelper.oddColor : tableHelper.evenColor;
        if(!item.selected) {
          item.native.BorderBrush = item.native.Background = color;
        }
        item.native.OriginalBorderBrush = item.native.OriginalBackground = color;
      });
    }
  });

  global.__TINT.Table = Table;

  return Table;
})();
