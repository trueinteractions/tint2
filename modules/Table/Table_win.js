module.exports = (function() {
  if(global.__TINT.Table) {
    return global.__TINT.Table;
  }
  var $ = process.bridge.dotnet;
  var Container = require('Container');
  var TextInput = require('TextInput');

  var headerColor = $.System.Windows.SystemColors.ControlLightBrush;
  var oddColor = $.System.Windows.SystemColors.ControlBrush;
  var evenColor = $.System.Windows.SystemColors.ControlLightLightBrush;
  var highlightColor = $.System.Windows.SystemColors.HighlightBrush;
  var rowHeight = 22;

  function Column() {
    var column = new $.System.Windows.Controls.ColumnDefinition();
    var label = new $.System.Windows.Controls.Label();
    var parent = null;

    column.Width = new $.System.Windows.GridLength(1, $.System.Windows.GridUnitType.Star);
    label.BorderBrush = headerColor;
    label.BorderThickness = new $.System.Windows.Thickness(0,0,1,1);

    var columnSplitter = new $.System.Windows.Controls.ColumnDefinition();
    columnSplitter.Width = new $.System.Windows.GridLength(2, $.System.Windows.GridUnitType.Auto);
    var splitter = new $.System.Windows.Controls.GridSplitter();
    splitter.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Center;
    splitter.VerticalAlignment = $.System.Windows.VerticalAlignment.Stretch;
    splitter.Width = 2;
    splitter.Height = $.System.Double.NaN;
    splitter.addEventListener('DragCompleted', function() { 
      if(parent) {
        parent.fireEvent('column-resized');
      }
    });

    Object.defineProperty(this, 'width', {
      set:function(e) {
        column.Width = new $.System.Windows.GridLength(e, $.System.Windows.GridUnitType.Pixel);
        if(parent) {
          parent.nativeView.UpdateLayout();
          parent.fireEvent('column-resized', [e]);
        }
      },
      get:function() { return column.Width; }
    });

    Object.defineProperty(this, 'title', {
      set:function(e) { label.Content = e.toString(); },
      get:function() { return label.Content === null ? "" : label.Content.toString(); }
    });

    Object.defineProperty(this, 'parent', {
      set:function(e) {
        if(parent) {
          parent.nativeView.InternalChildren.Remove(label);
          parent.nativeView.ColumnDefinitions.Remove(column);
          parent.nativeView.InternalChildren.Remove(splitter);
          parent.nativeView.ColumnDefinitions.Remove(columnSplitter);
        }
        parent = e; 
        parent.nativeView.ColumnDefinitions.Add(column);
        label.SetValue($.System.Windows.Controls.Grid.ColumnProperty, this.index * 2);
        label.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
        parent.nativeView.InternalChildren.Add(label);
        parent.nativeView.ColumnDefinitions.Add(columnSplitter);
        splitter.SetValue($.System.Windows.Controls.Grid.ColumnProperty, this.index * 2 + 1);
        parent.nativeView.InternalChildren.Add(splitter);
        this.resizable = parent.columnsCanBeResized;
      },
      get:function() { return parent; }
    });

    Object.defineProperty(this, 'index', {
      set:function(newNdx) {
        parent.nativeView.ColumnDefinitions.Remove(column);
        parent.nativeView.ColumnDefinitions.Insert(newNdx * 2, column);
        parent.nativeView.ColumnDefinitions.Remove(columnSplitter);
        parent.nativeView.ColumnDefinitions.Insert((newNdx * 2) + 1, columnSplitter);

        label.SetValue($.System.Windows.Controls.Grid.ColumnProperty, newNdx * 2);
        splitter.SetValue($.System.Windows.Controls.Grid.ColumnProperty, (newNdx * 2) + 1);

        parent.private.items.forEach(function(e) {
          if(e.column === this) {
            e.native.SetValue($.System.Windows.Controls.Grid.ColumnProperty, newNdx * 2);
          }
        }.bind(this));
      },
      get:function() {
        if(parent) {
          return parent.nativeView.ColumnDefinitions.IndexOf(column) / 2;
        } else {
          return -1;
        }
      }
    });

    Object.defineProperty(this, 'resizable', {
      get:function() { return splitter.Width > 0; },
      set:function(e) { 
        if(e) {
          splitter.Width = 2;
          columnSplitter.Width = new $.System.Windows.GridLength(2, $.System.Windows.GridUnitType.Pixel);
        } else {
          splitter.Width = 0;
          columnSplitter.Width = new $.System.Windows.GridLength(0, $.System.Windows.GridUnitType.Pixel);
        }
      }
    })

    label.addEventListener('PreviewMouseDown', function() {
      if(parent !== null) {
        //$.System.Windows.DragDrop.DoDragDrop(label, label, $.System.Windows.DragDropEffects.All);
        parent.fireEvent('column-mousedown',[this.title]);
      }
    }.bind(this));

    label.addEventListener('PreviewMouseUp', function() {
      if(parent !== null) {
        parent.fireEvent('column-clicked',[this.title]);
      }
    }.bind(this));
  }

  function Row() {
    var row = new $.System.Windows.Controls.RowDefinition();
    var parent = null;
    row.Height = new $.System.Windows.GridLength(rowHeight, $.System.Windows.GridLength.Pixel);

    Object.defineProperty(this, 'height', {
      set:function(e) {
        if(parent) {
          parent.fireEvent('row-resized', [e]);
        }
        row.Height = new $.System.Windows.GridLength(e, $.System.Windows.GridUnitType.Pixel);
      },
      get:function(e) { return row.Height; }
    });

    Object.defineProperty(this, 'parent', {
      set:function(e) {
        if(parent) {
          parent.nativeView.RowDefinitions.Remove(row);
        }
        parent = e; 
        parent.nativeView.RowDefinitions.Add(row);
      },
      get:function() { return parent; }
    });

    Object.defineProperty(this, 'index', {
      set:function(newNdx) {
        parent.nativeView.RowDefinitions.Remove(row);
        parent.nativeView.RowDefinitions.Insert(newNdx, row);
        parent.private.items.forEach(function(e) {
          if(e.row === this) {
            e.native.SetValue($.System.Windows.Controls.Grid.RowProperty, newNdx);
          }
        }.bind(this));
      },
      get:function() {
        if(parent) {
          return parent.nativeView.RowDefinitions.IndexOf(row);
        } else {
          return -1;
        }
      }
    });

    Object.defineProperty(this, 'selected', {
      set:function(e) { 
        parent.private.items.forEach(function(item) {
          if(item.row === this) {
            item.selected = e;
          }
        }.bind(this));
      },
      get:function() {
        var selected = false;
        parent.private.items.forEach(function(item) {
          if(item.row === this) {
            selected = item.selected;
          }
        }.bind(this));
        return selected;
      }
    });
  }

  function Cell(control) {
    var selected = false, row = null, column = null, parent = null,
        container = new $.System.Windows.Controls.Border();

    if(control) {
      container.Child = control.nativeView;
    }

    container.addEventListener('PreviewMouseUp', function() {
      if(parent !== null) {
        parent.fireEvent('select');
      }
    }.bind(this));

    Object.defineProperty(this, 'row', {
      set:function(e) { 
        row = e;
        container.SetValue($.System.Windows.Controls.Grid.RowProperty, row.index);
      },
      get:function() { return row; }
    });

    Object.defineProperty(this, 'column', {
      set:function(e) { 
        column = e;
        container.SetValue($.System.Windows.Controls.Grid.ColumnProperty, column.index * 2);
      },
      get:function() { return column; }
    });

    Object.defineProperty(this, 'parent', {
      set:function(e) {
        if(parent) {
          parent.nativeView.InternalChildren.Remove(parent);
        }
        parent = e;
        container.Height = parent.private.rowHeight;
        container.BorderThickness = new $.System.Windows.Thickness(
          parent.private.spaceX/2, parent.private.spaceY/2,
          parent.private.spaceX/2, parent.private.spaceY/2);
        parent.nativeView.InternalChildren.Add(container);
        if(row && row.index % 2 === 1 && parent.private.alternatingColors) {
          container.BorderBrush = oddColor;
          container.Background = oddColor;
        } else if (row && parent.private.alternatingColors) {
          container.BorderBrush = evenColor;
          container.Background = evenColor;
        }
        container.OriginalBorderBrush = container.BorderBrush;
        container.OriginalBackground = container.Background;
      },
      get:function() { return parent; }
    });

    Object.defineProperty(this, 'selected', {
      set:function(e) { 
        selected = e;
        container.BorderBrush = e ? highlightColor : container.OriginalBorderBrush;
        container.Background = e ? highlightColor : container.OriginalBackground;
      },
      get:function() { return selected; }
    });

    Object.defineProperty(this, 'height', {
      set:function(e) { container.Height = e; },
      get:function() { return container.Height; }
    });

    Object.defineProperty(this, 'native', {
      get:function() { return container; }
    });

    container.addEventListener('PreviewMouseDown', function() {
      if(parent) {
        parent.fireEvent('select');
        var shiftDown = $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.LeftShift) 
                    || $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.RightShift);
        var cntlDown = $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.LeftCtrl) 
                      || $.System.Windows.Input.Keyboard.IsKeyDown($.System.Windows.Input.Key.RightCtrl);
        var multiple = parent.private.multiple;
        var canBeEmpty = parent.private.allowEmptySelection;
        var isSelected = !this.selected;
        var firstSelectedIndex = 1e20;
        var lastSelectedIndex = -1;
        var thisIndex = this.row.index;
        var items = parent.private.items;

        if(multiple && shiftDown && !cntlDown) {
          items.forEach(function(e) {
            var index = e.row.index;
            if(e.selected) {
              if(index < firstSelectedIndex) {
                firstSelectedIndex = index;
              }
              if(index > lastSelectedIndex) {
                lastSelectedIndex = index;
              }
            }
          });
          if(thisIndex < firstSelectedIndex) {
            firstSelectedIndex = thisIndex;
          }
          if(thisIndex > lastSelectedIndex) {
            lastSelectedIndex = thisIndex;
          }
        }
        items.forEach(function(e) {
          if(multiple && shiftDown && !cntlDown) {
            var index = e.row.index;
            if(index <= lastSelectedIndex && index >= firstSelectedIndex) {
              e.selected = true;
            }
          } else if(multiple && !shiftDown && cntlDown) {
            if(e.row === this.row) {
              e.selected = isSelected;
            }
          } else {
            e.selected = (e.row === this.row);
          }
        }.bind(this));
        parent.fireEvent('selected');
      }
    }.bind(this));
  }

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
    this.private.header.Height = new $.System.Windows.GridLength(rowHeight, $.System.Windows.GridLength.Pixel);
    this.nativeView.RowDefinitions.Add(this.private.header);
    this.private.rowHeight = rowHeight;
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
    var column = new Column();
    column.title = e;
    column.parent = this;
    this.private.columns.push(column);
    for(var i=0; i < this.private.rows.length; i++) {
      var cell = new Cell();
      var row = this.private.rows[i];
      this.private.setCell(cell, column, row);
    }
    this.fireEvent('column-added');
  }

  Table.prototype.removeColumn = function(e) {
    var column = this.private.findColumnByName(e);
    column.parent = null;
    this.private.columns.splice(this.private.columns.indexOf(column),1);
    // ?
    this.fireEvent('column-removed');
  }

  Table.prototype.addRow = function() {
    var row = new Row();
    row.parent = this;
    this.private.rows.push(row);
    for(var i=0; i < this.private.columns.length; i++) {
      var cell = new Cell();
      var column = this.private.findColumnByIndex(i);
      this.private.setCell(cell, column, row);
    }
    this.fireEvent('row-added');
  }

  Table.prototype.removeRow = function(ndx) {
    var row = this.private.findRowByIndex(ndx);
    row.parent = null;
    this.private.rows.splice(this.private.rows.indexOf(row),1);
    // ?
    this.fireEvent('row-removed');
  }

  Table.prototype.moveColumn = function(ndx, toNdx) {
    var columnFrom = this.private.findColumnByIndex(ndx);
    var columnTo = this.private.findColumnByIndex(toNdx);
    columnFrom.index = toNdx;
    columnTo.index = ndx;
  }

  Table.prototype.moveRow = function(ndx, toNdx) {
    var row = this.private.findRowByIndex(ndx)
    row.index = toNdx;
  }

  Table.prototype.setColumnWidth = function(name,e) {
    var column = this.private.findColumnByName(name);
    column.width = e;
  }

  Table.prototype.setValueAt = function(columnId,rowIndex,value) {
    if(typeof(value) === "string" || typeof(value) === "number") {
      var v = value;
      value = new TextInput();
      value.value = v.toString();
      value.readonly = true;
    }
    var cell = new Cell(value);
    var column = this.private.findColumnByName(columnId);
    var row = this.private.findRowByIndex(rowIndex+1);
    this.private.setCell(cell, column, row);
  }

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
        var color = ((item.row.index % 2) === 1 && e) ? oddColor : evenColor;
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
