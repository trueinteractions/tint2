module.exports = (function() {
  var $ = process.bridge.dotnet;

  var exports = {};
  exports.headerColor = $.System.Windows.SystemColors.ControlLightBrush;
  exports.oddColor = $.System.Windows.SystemColors.ControlBrush;
  exports.evenColor = $.System.Windows.SystemColors.ControlLightLightBrush;
  exports.highlightColor = $.System.Windows.SystemColors.HighlightBrush;
  exports.rowHeight = 22;

  function Column() {
    var column = new $.System.Windows.Controls.ColumnDefinition();
    var label = new $.System.Windows.Controls.Label();
    var parent = null;

    column.Width = new $.System.Windows.GridLength(1, $.System.Windows.GridUnitType.Star);
    label.BorderBrush = exports.headerColor;
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
    row.Height = new $.System.Windows.GridLength(exports.rowHeight, $.System.Windows.GridLength.Pixel);

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
          container.BorderBrush = exports.oddColor;
          container.Background = exports.oddColor;
        } else if (row && parent.private.alternatingColors) {
          container.BorderBrush = exports.evenColor;
          container.Background = exports.evenColor;
        }
        container.OriginalBorderBrush = container.BorderBrush;
        container.OriginalBackground = container.Background;
      },
      get:function() { return parent; }
    });

    Object.defineProperty(this, 'selected', {
      set:function(e) { 
        selected = e;
        container.BorderBrush = e ? exports.highlightColor : container.OriginalBorderBrush;
        container.Background = e ? exports.highlightColor : container.OriginalBackground;
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

  exports.Cell = Cell;
  exports.Column = Column;
  exports.Row = Row;
  return exports;
})()