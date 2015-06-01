module.exports = (function() {
  if(global.__TINT.Table) {
    return global.__TINT.Table;
  }
  var $ = process.bridge.objc;
  var Container = require('Container');
  var TextInput = require('TextInput');
  var util = require('Utilities');

  /**
   * @class Table
   * @description Creates a table view to place UI elements into a column and row grid system.
   *              It also provides the ability to highlight rows, columns and allow users to
   *              move items up or down. 
   * @extends Container
   */
  function Table(options) {
    options = options || {};
    options.mouseDownBlocks = true;
    options.keyDownBlocks = true;
    options.delegates = options.delegates || [];

    options.delegates = options.delegates.concat([
      ['tableView:viewForTableColumn:row:','@@:@@l', function(self,cmd,table,column,rowIndex) {
        var identifier = column('identifier').toString();
        if(this.private.views[identifier] && this.private.views[identifier][rowIndex])
        {
          var view = this.private.views[identifier][rowIndex].native;
          return view;
        }
        return null;
      }.bind(this)],
      /**
       * @event row-added
       * @memberof Table
       * @description Fires when a new row is added to the table by the user or programmatically.
       */
      ['tableView:didAddRowView:forRow:','v@:@@l', function(self,cmd,table,row,rowIndex) { this.fireEvent('row-added',[rowIndex]); }.bind(this)],
      /**
       * @event row-removed
       * @memberof Table
       * @description Fires when a row is removed form the table by the user or programmatically.
       */
      ['tableView:didRemoveRowView:forRow:','v@:@@l', function(self,cmd,table,row,rowIndex) { this.fireEvent('row-removed',[rowIndex]); }.bind(this)],
      ['tableView:heightOfRow:','d@:@l', function() { return this.nativeView('rowHeight'); }.bind(this)],
      ['selectionShouldChangeInTableView:','B@:@', function() { return $.YES; }.bind(this)],
      ['tableView:shouldSelectRow:','B@:@l', function() { return $.YES; }.bind(this)],
      ['tableView:shouldSelectTableColumn:','B@:@@', function() { return $.YES; }.bind(this)],
      /**
       * @event select
       * @memberof Table
       * @description Fires when the selected rows change by the user or programmatically. This fires 
       *              prior to the selection actually changing.
       */
      ['tableViewSelectionIsChanging:','v@:@', function() { this.fireEvent('select'); }.bind(this)],
      /**
       * @event selected
       * @memberof Table
       * @description Fires when the selected rows change by the user or programmatically. This fires
       *              after the selection has changed.
       */
      ['tableViewSelectionDidChange:','v@:@', function() { this.fireEvent('selected'); }.bind(this)],
      ['tableView:shouldTypeSelectForEvent:withCurrentSearchString:','B@:@@@', function() { return $.YES; }.bind(this)],
      ['tableView:shouldReorderColumn:toColumn:','B@:@ll', function() { return $.YES; }.bind(this)],
      ['tableView:didDragTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-move',[column('identifier').toString()]); }.bind(this)],
      ['tableViewColumnDidMove:','v@:@', function() { this.fireEvent('column-moved'); }.bind(this)],
      ['tableViewColumnDidResize:','v@:@', function() { this.fireEvent('column-resized'); }.bind(this)],
      /**
       * @event column-clicked
       * @memberof Table
       * @param {string} columnName The name of the column that was clicked.
       * @description Fires when the user clicks a column (e.g., after any processing has occured).
       */
      ['tableView:didClickTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-clicked',[column('identifier').toString()]); }.bind(this)],
      /**
       * @event column-mousedown
       * @memberof Table
       * @param {string} columnName The name of the column that was clicked.
       * @description Fires when the user begins to click a column but prior to any processing.
       */
      ['tableView:mouseDownInHeaderOfTableColumn:','v@:@@', function(self,cmd,table,column) { this.fireEvent('column-mousedown', [column('identifier').toString()]); }.bind(this)],
      ['tableView:shouldTrackCell:forTableColumn:row:','B@:@@l', function() { return $.YES; }.bind(this)],
      ['numberOfRowsInTableView:','l@:@', function() { return this.nativeView('numberOfRows'); }.bind(this)] 
    ]);
    this.nativeClass = this.nativeClass || $.NSTableView;
    this.nativeViewClass = this.nativeViewClass || $.NSTableView;
    Container.call(this, options);
    this.private.views = {};
    this.private.columns = [];
    this.private.selectable = true;
    this.private.columnWidth = {};
    this.native('setDelegate', this.nativeView);
    this.native('setDataSource', this.nativeView);    
    this.native('setRowSizeStyle', $.NSTableViewRowSizeStyleSmall);
    this.columnsCanBeResized = true;
  }

  Table.prototype = Object.create(Container.prototype);
  Table.prototype.constructor = Table;

  /**
   * @method addColumn
   * @memberof Table
   * @param {string} columnName The name used for identifying the column and the label used in the header.
   * @description Adds a new column to the table, the columns name is used in the header's label, and 
   *              uniquely identifies the column in the table (regardless if its moved by a user).
   */
  Table.prototype.addColumn = function(e) {
    var column = $.NSTableColumn('alloc')('initWithIdentifier', $(e.toString()));
    column('setResizingMask',$.NSTableColumnAutoresizingMask);
    this.private.columns[e] = column;
    this.private.views[e] = [];
    column('headerCell')('setStringValue', $(e.toString()));
    this.nativeView('addTableColumn', column);
    this.nativeView('headerView')('setNeedsLayout', $.YES);
    this.nativeView('reloadData');
  };

  /**
   * @method removeColumn
   * @memberof Table
   * @param {string} columnName The name used for identifying the column and the label used in the header.
   * @description Removes the column specified by the name passed in (or the headers label).
   */
  Table.prototype.removeColumn = function(e) {
    var column = this.private.columns[e];
    column('release');
    this.nativeView('removeTableColumn', column);
    this.private.columns[e] = null;
    this.private.columnWidth[e] = null;
    this.nativeView('reloadData');
  };

  /**
   * @method addRow
   * @memberof Table
   * @param {number} rowIndex A positive whole number that represents the index to add a row at, if
   *                 nothing is passed for this value the row is appended to the end of the table.
   * @description Appends a new row to the end of the table, if a index is passed in the row is added
   *              at that location.
   */
  Table.prototype.addRow = function(ndx) {
    ndx = ndx || this.nativeView('numberOfRows');
    this.nativeView('insertRowsAtIndexes', $.NSIndexSet('indexSetWithIndex',ndx),
                'withAnimation', $.NSTableViewAnimationSlideUp);
  };

  /**
   * @method removeRow
   * @memberof Table
   * @param {number} rowIndex A positive whole number that represents the index to remove.
   * @description Removes the last row in the table, if an index is passed in the specified row
   *              is removed.
   */
  Table.prototype.removeRow = function(ndx) {
    ndx = ndx || this.nativeView('numberOfRows');
    this.nativeView('removeRowsAtIndexes', $.NSIndexSet('indexSetWithIndex',ndx),
            'withAnimation', $.NSTableViewAnimationSlideUp);
  };

  /**
   * @method moveColumn
   * @memberof Table
   * @param {number} fromIndex A positive whole number that represents the column's index to move from.
   * @param {number} toIndex A positive whole number that represents the column's index to move to.
   * @description Moves the column specified by fromIndex to the location specified by toIndex.
   */
  Table.prototype.moveColumn = function(ndx, toNdx) {
    this.native('moveColumn', $.NSIndexSet('indexSetWithIndex',ndx),
            'toColumn', $.NSIndexSet('indexSetWithIndex',toNdx));
  };

  /**
   * @method moveRow
   * @memberof Table
   * @param {number} fromIndex A positive whole number that represents the row's index to move from.
   * @param {number} toIndex A positive whole number that represents the row's index to move to.
   * @description Moves the row specified by fromIndex to the location specified by toIndex.
   */
  Table.prototype.moveRow = function(ndx, toNdx) {
    this.native('moveRowAtIndex', $.NSIndexSet('indexSetWithIndex',ndx),
            'toIndex', $.NSIndexSet('indexSetWithIndex',toNdx));
  };

  /**
   * @method setColumnWidth
   * @memberof Table
   * @param {string} columnName The name of the column (or header's label).
   * @param {number} width A positive whole number that represents the logical pixel width of the column.
   * @description Resizes a column's width to the specified width passed in.
   */
  Table.prototype.setColumnWidth = function(id,e) {
    var column = this.private.columns[id];
    this.private.columnWidth[id] = e;
    column('setWidth',e);
  };

  /**
   * @method setValueAt
   * @memberof Table
   * @param {string} columnName The name of the column (or header's label).
   * @param {number} rowIndex A positive whole number that represents the rows index.
   * @param {Control} control Control to render at the specified row and column.  
   *        This can be either a string, or any user interface control.
   * @description Set the value of the specified cell at the column indicated by columnName, 
   *              and the row indicated by rowIndex.  The value can be either a user interface control
   *              string.
   */

  /**
   * @method setValueAt
   * @memberof Table
   * @param {string} columnName The name of the column (or header's label).
   * @param {number} rowIndex A positive whole number that represents the rows index.
   * @param {string} text Text to render at the specified row and column.  
   *        This can be either a string, or any user interface control.
   * @description Set the value of the specified cell at the column indicated by columnName, 
   *              and the row indicated by rowIndex.  The value can be either a user interface control
   *              string.
   */
  Table.prototype.setValueAt = function(columnId,row,value) {
    if(typeof(value) === "string" || typeof(value) === "number") {
      var v = value;
      value = new TextInput();
      value.value = v.toString();
      value.readonly = true;
      value.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.YES);
    }
    this.private.views[columnId][row] = value;
    this.nativeView('reloadDataForRowIndexes', $.NSIndexSet('indexSetWithIndex',row),
                    'columnIndexes',$.NSIndexSet('indexSetWithIndex', this.nativeView('columnWithIdentifier',$(columnId))));
  };

  /**
   * @member rowHeightStyle
   * @type {string}
   * @memberof Table
   * @description Gets or sets the height of the row based on user preferences and
   *              system recommendations, this can be either "default", "small", 
   *              "medium" or "large". Note that this will override the value of
   *              rowHeight.
   */
  util.makePropertyMapType(Table.prototype, 'rowHeightStyle', 'rowSizeStyle', 'setRowSizeStyle', {
    'default':$.NSTableViewRowSizeStyleDefault,
    'small':$.NSTableViewRowSizeStyleSmall,
    'medium':$.NSTableViewRowSizeStyleMedium,
    'large':$.NSTableViewRowSizeStyleLarge
  });

  util.makePropertyBoolType(Table.prototype, 'columnsCanBeMoved','allowsColumnReordering','setAllowsColumnReordering', {display:true});

  /**
   * @member columnsCanBeResized
   * @type {boolean}
   * @memberof Table
   * @description Gets or sets whether the columns can be resized by the user.
   * @default true
   */
  util.makePropertyBoolType(Table.prototype, 'columnsCanBeResized','allowsColumnResizing','setAllowsColumnResizing', {display:true});

  /**
   * @member multipleSelection
   * @type {boolean}
   * @memberof Table
   * @description Gets or sets whether multiple items can be selected, the default value is 
   *              true.
   */
  util.makePropertyBoolType(Table.prototype, 'multipleSelection','allowsMultipleSelection','setAllowsMultipleSelection', {display:true});

  /**
   * @member emptySelection
   * @type {boolean}
   * @memberof Table
   * @description Gets or sets whether no items are allowed to be selected, 
   *              the default value is true. Note that if set to false, and
   *              no item is selected use selectedRows to specify a default
   *              selection.  This only prevents the user for deselecting an item
   *              it does not prevent no items from being selected.
   */
  util.makePropertyBoolType(Table.prototype, 'emptySelection','allowsEmptySelection','setAllowsEmptySelection', {display:true});


  function setIntercellSpacing(type, obj, value) {
    var rect = obj('intercellSpacing');
    if(type === "y") {
      rect.height = value;
    } else if (type === "x") {
      rect.width = value;
    }
    obj('setIntercellSpacing', rect);
  }
  /**
   * @member spaceX
   * @type {number}
   * @memberof Table
   * @description Gets or sets the horizontal intercell spacing between cells in logical pixels.
   *              The default value depends on the native OS defaults.
   */
  Object.defineProperty(Table.prototype, 'spaceX', {
    get:function() { return this.nativeView('intercellSpacing').width; },
    set:function(e) { setIntercellSpacing('x', this.nativeView, e); }
  });

  /**
   * @member spaceY
   * @type {number}
   * @memberof Table
   * @description Gets or sets the vertical intercell spacing between cells in logical pixels.
   *              The default value depends on the native OS defaults.
   */
  Object.defineProperty(Table.prototype, 'spaceY', {
    get:function() { return this.nativeView('intercellSpacing').height; },
    set:function(e) { setIntercellSpacing('y', this.nativeView, e); }
  });

  /**
   * @member rowHeight
   * @type {number}
   * @memberof Table
   * @description Gets or sets the height of the rows by pixel value.  Note
   *              that setting this will override the value of rowHeightStyle.
   */
  util.makePropertyBoolType(Table.prototype, 'rowHeight','rowHeight','setRowHeight',{display:true});

  /**
   * @member numberOfColumns
   * @type {number}
   * @memberof Table
   * @description Gets the number of columns in the table.
   */
  util.def(Table.prototype, 'numberOfColumns', function() { return this.nativeView('numberOfColumns'); });

  /**
   * @member numberOfRows
   * @type {number}
   * @memberof Table
   * @description Gets the number of rows in the table.
   */
  util.def(Table.prototype, 'numberOfRows', function() { return this.nativeView('numberOfRows'); });

  /**
   * @member selectedRows
   * @type {array}
   * @memberof Table
   * @description Gets or sets an array of the rows that are selected. The array 
   *              contains the indexes of all the rows selected.
   */
  Object.defineProperty(Table.prototype, 'selectedRows', {
    get:function() {
      var indexes = this.nativeView('selectedRowIndexes');
      var ind = [];
      indexes('enumerateIndexesUsingBlock', $(function(self, index, boolStop) {
        ind.push(index);
      },['v',['?','I','B']]));
      return ind;
    },
    set:function(e) {
      var indexes = $.NSMutableIndexSet('indexSet');
      for(var i=0; i < e.length; i++) {
        indexes('addIndex',e[i]);
      }
      this.nativeView('selectRowIndexes',indexes,'byExtendingSelection',false);
    }
  });

  /**
   * @member alternatingColors
   * @type {boolean}
   * @memberof Table
   * @description Gets or sets whether a table will have alternating colors or not.
   *              The alternating colors default to system values.
   */
  util.makePropertyBoolType(Table.prototype, 'alternatingColors','usesAlternatingRowBackgroundColors','setUsesAlternatingRowBackgroundColors',{display:true});

  global.__TINT.Table = Table;

  return Table;
})();
