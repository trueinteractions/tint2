module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function createNewDefinition(split, size) {
    var definition = null;
    if(split.orientation == "vertical") {
      definition = new $.System.Windows.Controls.ColumnDefinition();
      if(size && typeof(size) == 'number')
        definition.Width = new $.System.Windows.GridLength(size);
      else if(size)
        definition.Width = size;
    }
    else {
      definition = new $.System.Windows.Controls.RowDefinition();
      if(size && typeof(size) == 'number')
        definition.Height = new $.System.Windows.GridLength(size);
      else if(size)
        definition.Height = size;
    }
    return definition;
  }

  function setGridSplitterDirection(splitter, isVertical, index, size) {
    if(isVertical) {
      splitter.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Center;
      splitter.VerticalAlignment = $.System.Windows.VerticalAlignment.Stretch;
      splitter.Width = size;
      splitter.Height = $.System.Double.NaN;
      splitter.SetValue($.System.Windows.Controls.Grid.ColumnProperty, index);
      splitter.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
    } else {
      splitter.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
      splitter.VerticalAlignment = $.System.Windows.VerticalAlignment.Center;
      splitter.Width = $.System.Double.NaN;
      splitter.Height = size;
      splitter.SetValue($.System.Windows.Controls.Grid.ColumnProperty, 0);
      splitter.SetValue($.System.Windows.Controls.Grid.RowProperty, index);
    }
  }

  function Split(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Grid, $.System.Windows.Controls.Grid, options);
    }
    this.private.orientation = "vertical";
    this.private.backupAppend = Container.prototype.appendChild;
    this.private.backupRemove = Container.prototype.removeChild;
    this.private.definitions = [];
    this.private.dividers = [];
    this.private.dividerWidth = 1;
  }

  Split.prototype = Object.create(Container.prototype);
  Split.prototype.constructor = Split;

  Split.prototype.appendChild = function(e) {
    var isVertical = this.orientation == "vertical" ? true : false;
    var index = this.private.definitions.length;

    if(index != 0) 
    {
      var definition1 = createNewDefinition(this, 5);
      if(isVertical) this.nativeView.ColumnDefinitions.Add(definition1);
      else this.nativeView.RowDefinitions.Add(definition1);
      this.private.definitions.push(definition1);
      
      var divider = new $.System.Windows.Controls.GridSplitter();
      setGridSplitterDirection(divider, isVertical, index, 5);
      divider.addEventListener('DragCompleted', function() {
        this.fireEvent('resized');
      }.bind(this));

      // we need to "fake" a regular control element which requires a native field, 
      // and fireEvent function to inform it of parent/child relationships
      var splitObj = {native:divider,fireEvent:function(){},isSplitter:true};
      this.private.backupAppend.apply(this,[splitObj]);
      this.private.dividers.push(splitObj);
      index++;
    }

    this.private.backupAppend.apply(this,arguments);
    
    var definition = createNewDefinition(this,null);
    if(isVertical) {
      this.nativeView.ColumnDefinitions.Add(definition);
      e.native.SetValue($.System.Windows.Controls.Grid.ColumnProperty, index);
    } else {
      this.nativeView.RowDefinitions.Add(definition);
      e.native.SetValue($.System.Windows.Controls.Grid.RowProperty, index);
    }
    this.private.definitions.push(definition);
  }

  Split.prototype.removeChild = function(e) {
    var isVertical = this.orientation == "vertical" ? true : false;
    var index = this.private.children.indexOf(e);
    if(this.private.children.length < 1) {
      if(isVertical) {
        this.nativeView.ColumnDefinitions.RemoveAt(index);
        this.nativeView.ColumnDefinitions.RemoveAt(index + 1);
      } else {
        this.nativeView.RowDefinitions.RemoveAt(index + 1);
        this.nativeView.RowDefinitions.RemoveAt(index);
      }
      this.private.definitions.splice(index, 1);
      this.private.definitions.splice(index + 1, 1);
      // we need to "fake" a regular control element which requires a native field, 
      // take the divider we have and put it into a user object with a native property.
      this.private.backupRemove.apply(this,[this.private.dividers[index/2]]);
      this.private.dividers.splice(index/2,1);
    } else {
      if(isVertical)
        this.nativeView.ColumnDefinitions.RemoveAt(0);
      else
        this.nativeView.RowDefinitions.RemoveAt(0);
      this.private.definitions.splice(index, 1);
    }
    this.private.backupRemove.apply(this,arguments);
  }

  Split.prototype.setPosition = function(position, index) {
    var isVertical = this.orientation == "vertical" ? true : false,
        defs = this.private.definitions,
        totalSize = 0,
        runningPercent = 0,
        diff = 0;
    
    // Bounds and error checking.
    position = position > 1 ? 1 : position;
    position = position < 0 ? 0 : position;
    index = index * 2 + 1;
    if(index >= defs.length) 
      throw new Error('The second argument, the index of the seperator doesnt exist.');

    // Prior to calculating new layout positions make sure our 
    // layout is correct. If someone calls setPosition twice in
    // a row we'll incorrectly set the bounds without updating.
    this.nativeView.UpdateLayout();

    // Get the total width of the Grid.
    for(var i=0; i < defs.length; i++)
      totalSize += isVertical ? defs[i].ActualWidth : defs[i].ActualHeight;
    // Update the panel before and after the split view use 0-1 percentages
    // for each of the widths.
    for(var i=0; i < defs.length; i++) {
      var percent = (isVertical ? defs[i].ActualWidth : defs[i].ActualHeight) / totalSize;
      // Do not reassign sizes for dividers, or all even rows/columns
      if(i % 2 == 0) {
        if(i == index - 1) {
          diff = position - (percent + runningPercent);
          percent = position - runningPercent;
        } 
        else if(i == index + 1)
          percent -= diff;

        var unit = new $.System.Windows.GridLength(percent, $.System.Windows.GridUnitType.Star);
        
        if(isVertical) 
          defs[i].Width = unit;
        else 
          defs[i].Height = unit;
      }

      runningPercent += percent;
    }
  }

  Object.defineProperty(Split.prototype, 'orientation', {
    get:function() { return this.private.orientation; },
    set:function(e) { 
      if(e == "vertical" && this.private.orientation != "vertical") {
        // This must be changed otherwise helper methods may
        // accidently still think we're horizontal.
        this.private.orientation = "vertical";

        // Recreate the row definitions as column definitions,
        // but do not add them yet.
        var defs = this.private.definitions;
        var newdefs = [];
        defs.forEach(function(item, index, arr) {
          newdefs.push(createNewDefinition(this,item.Height));
        }.bind(this));

        // Clear any existing column definitions,
        // any definitions in our own set.
        this.nativeView.ColumnDefinitions.Clear();
        this.nativeView.RowDefinitions.Clear();
        this.private.definitions = [];

        // Re-add column definitions from above,
        // ensure we flip the horizontal/veritcal alignments
        // and settings on the GridSlidder
       /* newdefs.forEach(function(item, index, arr) {
          this.nativeView.ColumnDefinitions.Add(item);
          this.private.definitions.push(item);
          if(index % 2 == 1)
            setGridSplitterDirection(this.private.dividers[((index - 1) / 2)], false, index, 5);
        }.bind(this));*/

        for(var i=0; i < this.private.children.length; i=i+2) {
          this.private.children[i].native.SetValue($.System.Windows.Controls.Grid.ColumnProperty, i);
          this.private.children[i].native.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
        }

      } else if (e == "horizontal" && this.private.orientation != "horizontal") {
        // This must be changed otherwise helper methods may
        // accidently still think we're vertical.
        this.private.orientation = "horizontal";

        // Recreate the column definitions as row definitions,
        // but do not add them yet.
        //var defs = this.private.definitions;
        //var newdefs = [];
        this.private.definitions.forEach(function(item, index, arr) {
          arr[index] = createNewDefinition(this, item.Width);
        }.bind(this));

        // Clear any existing column definitions,
        // any definitions in our own set.
        this.nativeView.ColumnDefinitions.Clear();
        this.nativeView.RowDefinitions.Clear();

        // Re-add row definitions from above,
        // Re-set the grid splitter dirctions.
        // reassign column/row values for children.
        for(var index=0; index < this.private.definitions.length; index++) {
          var item = this.private.definitions[index];
          this.nativeView.RowDefinitions.Add(item);
          var child = this.private.children[index];
          if(child.isSplitter)
            setGridSplitterDirection(this.private.children[index].native, false, index, 5);
          else {
            this.private.children[index].native.SetValue($.System.Windows.Controls.Grid.ColumnProperty, 0);
            this.private.children[index].native.SetValue($.System.Windows.Controls.Grid.RowProperty, index);
          }
        }
      }
    }
  });

  Object.defineProperty(Split.prototype, 'style', {
    get:function() {
      // thick, thin, pane
      if(this.private.dividerWidth == 1) return "thin";
      else if(this.private.dividerWidth == 3) return "pane";
      else if(this.private.dividerWidth == 5) return "thick";
    },
    set:function(e) {
      var isVertical = this.orientation == "vertical" ? true : false;
      if(e == "thin") this.private.dividerWidth = 1;
      else if(e == "pane") this.private.dividerWidth = 3;
      else if(e == "thick") this.private.dividerWidth = 5;
      for(var i=0; i < this.private.definitions.length; i++) {
        var child = this.private.children[i];
        if(child.isSplitter)
        {
          child.native.Width = this.private.dividerWidth;
          this.private.definitions.Width.Value = this.private.dividerWidth;
        }
      }
    }
  });

  return Split;

})();
