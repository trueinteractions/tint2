module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');
  var TextInput = require('TextInput');
  var Color = require('Color');

  function Table(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['tableView:viewForTableColumn:row:','@@:@@l', function(self,cmd,table,column,rowIndex) {
        var identifier = column('identifier').toString();
        if(this.private.views[identifier] && 
            this.private.views[identifier][rowIndex])
          return this.private.views[identifier][rowIndex].native;
        return null;
      }.bind(this)],
      ['tableView:didAddRowView:forRow:','v@:@@l', function(self,cmd,table,row,rowIndex) { this.fireEvent('row-added',[rowIndex]); }.bind(this)],
      ['tableView:didRemoveRowView:forRow:','v@:@@l', function(self,cmd,table,row,rowIndex) { this.fireEvent('row-removed',[rowIndex]); }.bind(this)],
      ['tableView:shouldEditTableColumn:row:','B@:@l', function(self,cmd,table,column,rowIndex) { return $.NO; }.bind(this)],
      ['tableView:heightOfRow:','d@:@l', function(self,cmd,table,rowIndex) { return this.nativeView('rowHeight'); }.bind(this)],
      ['tableView:sizeToFitWidthOfColumn:','d@:@', function(self,cmd,table,columnIndex) { return this.private.columnWidth[columnIndex]; }.bind(this)],
      ['selectionShouldChangeInTableView:','B@:@', function(self,cmd,table) { return $.YES; }.bind(this)],
      ['tableView:shouldSelectRow:','B@:@l', function(self,cmd,table,rowIndex) { return $.YES; }.bind(this)],
      ['tableView:selectionIndexesForProposedSelection:','@@:@@', function(self,cmd,table,indexSet) { return indexSet; }.bind(this)],
      ['tableView:shouldSelectTableColumn:','B@:@@', function(self,cmd,table,column) { return $.YES; }.bind(this)],
      ['tableViewSelectionIsChanging:','v@:@', function(self,cmd,notif) { this.fireEvent('select'); }.bind(this)],
      ['tableViewSelectionDidChange:','v@:@', function(self,cmd,notif) { this.fireEvent('selected'); }.bind(this)],
      ['tableView:shouldTypeSelectForEvent:withCurrentSearchString:','B@:@@@', function(self,cmd,table,eventnotif,searchString) { return $.YES; }.bind(this)],
      ['tableView:shouldReorderColumn:toColumn:','B@:@ll', function(self,cmd,table,fromColumnIndex,toColumnIndex) { return $.YES; }.bind(this)],
      ['tableView:didDragTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-move',[column('identifier').toString()]); }.bind(this)],
      ['tableViewColumnDidMove:','v@:@', function(self,cmd,notif) { this.fireEvent('column-moved'); }.bind(this)],
      ['tableViewColumnDidResize:','v@:@', function(self,cmd,notif) { this.fireEvent('column-resized'); }.bind(this)],
      ['tableView:didClickTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-clicked',[column('identifier').toString()]); }.bind(this)],
      ['tableView:mouseDownInHeaderOfTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-mousedown', [column('identifier').toString()]); }.bind(this)],
      ['tableView:shouldTrackCell:forTableColumn:row:','B@:@@l', function(self,cmd,table,cell,column,rowIndex) { return $.YES; }.bind(this)],
      ['numberOfRowsInTableView:','l@:@', function(self,cmd,table) { return this.nativeView('numberOfRows'); }.bind(this)] 
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSTableView, $.NSTableView, options);

    this.private.views = {};
    this.private.columns = [];
    this.private.selectable = true;

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');    
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setDelegate', this.nativeView);
    this.native('setDataSource', this.nativeView);    
    this.native('setRowSizeStyle', $.NSTableViewRowSizeStyleMedium);
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  Table.prototype.addColumn = function(e) {
    var column = $.NSTableColumn('alloc')('initWithIdentifier', $(e.toString()));
    this.private.columns[e] = column;
    this.private.views[e] = [];
    column('headerCell')('setStringValue', $(e));
    this.nativeView('addTableColumn', column);
    this.nativeView('reloadData');
  }

  Table.prototype.removeColumn = function(e) {
    var column = this.private.columns[e];
    column('release');
    this.nativeView('removeTableColumn', column);
    this.private.columns[e] = null;
    this.private.columnWidth[e] = null;
    this.nativeView('reloadData');
  }

  Table.prototype.addRow = function(ndx) {
    ndx = ndx || this.nativeView('numberOfRows');
    this.nativeView('insertRowsAtIndexes', $.NSIndexSet('indexSetWithIndex',ndx),
                'withAnimation', $.NSTableViewAnimationSlideUp);
  }

  Table.prototype.removeRow = function(ndx) {
    ndx = ndx || this.nativeView('numberOfRows');
    this.nativeView('removeRowsAtIndexes', $.NSIndexSet('indexSetWithIndex',ndx),
            'withAnimation', $.NSTableViewAnimationSlideUp);
  }

  Table.prototype.moveColumn = function(ndx, toNdx) {
    this.native('moveColumn', $.NSIndexSet('indexSetWithIndex',ndx),
            'toColumn', $.NSIndexSet('indexSetWithIndex',toNdx));
  }

  Table.prototype.moveRow = function(ndx, toNdx) {
    this.native('moveRowAtIndex', $.NSIndexSet('indexSetWithIndex',ndx),
            'toIndex', $.NSIndexSet('indexSetWithIndex',toNdx));
  }

  Table.prototype.setColumnWidth = function(id,e) {
    var column = this.private.columns[id];
    this.private.columnWidth[id] = e;
    column('setWidth',e);
  }

  Table.prototype.setValueAt = function(columnId,row,value) {
    this.private.views[columnId][row] = value;
    this.nativeView('reloadDataForRowIndexes', $.NSIndexSet('indexSetWithIndex',row),
                    'columnIndexes',$.NSIndexSet('indexSetWithIndex', this.nativeView('columnWithIdentifier',$(columnId))));
  }

  Object.defineProperty(Table.prototype, 'rowHeightStyle', {
    get:function() { 
      var rowSize = this.nativeView('rowSizeStyle');
      if(rowSize == $.NSTableViewRowSizeStyleDefault) return "default";
      else if(rowSize == $.NSTableViewRowSizeStyleSmall) return "small";
      else if(rowSize == $.NSTableViewRowSizeStyleMedium) return "medium";
      else if(rowSize == $.NSTableViewRowSizeStyleLarge) return "large";
      else return "unknown";
    },
    set:function(e) { 
      if(e == "default") this.nativeView('setRowSizeStyle',$.NSTableViewRowSizeStyleDefault);
      else if(e == "small") this.nativeView('setRowSizeStyle',$.NSTableViewRowSizeStyleSmall);
      else if(e == "medium") this.nativeView('setRowSizeStyle',$.NSTableViewRowSizeStyleMedium);
      else if(e == "large") this.nativeView('setRowSizeStyle',$.NSTableViewRowSizeStyleLarge);
    }
  });

  Object.defineProperty(Table.prototype, 'columnsCanBeMoved', {
    get:function() { return this.nativeView('allowsColumnRecording') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAllowsColumnReordering', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Table.prototype, 'columnsCanBeResized', {
    get:function() { return this.nativeView('allowsColumnResizing') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAllowsColumnResizing', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Table.prototype, 'multiple', {
    get:function() { return this.nativeView('allowsMultipleSelection') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAllowsMultipleSelection', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Table.prototype, 'emptySelection', {
    get:function() { return this.nativeView('allowsEmptySelection') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAllowsEmptySelection', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Table.prototype, 'columnsCanBeSelected', {
    get:function() { return this.nativeView('allowsColumnSelection') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAllowsColumnSelection', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Table.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView('backgroundColor')); },
    set:function(e) { this.nativeView('setBackgroundColor',e.native); }
  });

  Object.defineProperty(Table.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView('gridColor')); },
    set:function(e) { this.nativeView('setGridColor',e.native); }
  });

  Object.defineProperty(Table.prototype, 'spaceX', {
    get:function() { return this.nativeView('intercellSpacing').width; },
    set:function(e) { 
      var rect = this.nativeView('intercellSpacing');
      rect.width = e;
      this.nativeView('setIntercellSpacing', rect);
    }
  });

  Object.defineProperty(Table.prototype, 'spaceY', {
    get:function() { return this.nativeView('intercellSpacing').height; },
    set:function(e) { 
      var rect = this.nativeView('intercellSpacing');
      rect.height = e;
      this.nativeView('setIntercellSpacing', rect);
    }
  });

  Object.defineProperty(Table.prototype, 'rowHeight', {
    get:function() { return this.nativeView('rowHeight'); },
    set:function(e) { this.nativeView('setRowHeight',e.native); }
  });

  Object.defineProperty(Table.prototype, 'focusedColumn', {
    get:function() { return this.nativeView('focusedColumn'); },
    set:function(e) { this.nativeView('setFocusedColumn', e); }
  });

  Object.defineProperty(Table.prototype, 'numberOfColumns', {
    get:function() { return this.nativeView('numberOfColumns'); }
  });

  Object.defineProperty(Table.prototype, 'numberOfRows', {
    get:function() { return this.nativeView('numberOfRows'); }
  });

  Object.defineProperty(Table.prototype, 'alternatingColors', {
    get:function() { return this.nativeView('usesAlternatingRowBackgroundColors') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setUsesAlternatingRowBackgroundColors',e ? $.YES : $.NO); }
  });

  Table.prototype.scrollToRow = function(ndx) { this.nativeView('scrollRowToVisible',ndx); }

  Table.prototype.scrollToColumn = function(ndx) { this.nativeView('scrollColumnToVisible',ndx); }

  return Table;
})();
