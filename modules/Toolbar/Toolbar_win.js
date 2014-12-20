module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;
  process.bridge.dotnet.import('System.Xaml.dll');

  function Toolbar() {
    var options = {};
    options.initViewOnly = true;
    Container.call(this, $.System.Windows.Controls.DockPanel, $.System.Windows.Controls.DockPanel, options);
    this.private.toolbar = $.System.Xaml.XamlServices.Parse("<ToolBar xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\" xmlns:x=\"http://schemas.microsoft.com/winfx/2006/xaml\"><ToolBar.Resources><Style TargetType=\"{x:Type ToolBarPanel}\"><Setter Property=\"Orientation\" Value=\"Vertical\"/></Style></ToolBar.Resources></ToolBar>");
    this.nativeView.InternalChildren.Add(this.private.toolbar);
    this.private.grid = new $.System.Windows.Controls.Grid();
    this.private.grid.Margin = new $.System.Windows.Thickness(3);
    this.private.toolbar.Items.Add(this.private.grid);
    this.private.cols = 0;

    this.appendChild = function(control) {
      var isSpace = false;
      if(control == 'space') {
        control = new $.System.Windows.Controls.Control();
        control.Width = 12;
        isSpace = true;
      }
      if(Array.isArray(control))
        for(var i=0; i < control.length; i++) this.appendChild(control[i]);
      else {
        var columnDef = new $.System.Windows.Controls.ColumnDefinition();
        // TODO Figure out a way to get whether its an indeterminate width.
        if(control.nativeClass == $.System.Windows.Controls.TextBox)
          columnDef.Width = new $.System.Windows.GridLength(1,$.System.Windows.GridUnitType.Star);
        else
          columnDef.Width = new $.System.Windows.GridLength(1,$.System.Windows.GridUnitType.Auto);

        this.private.grid.ColumnDefinitions.Add(columnDef);
        if(!isSpace) {
          this.private.children.push(control);
          this.private.grid.InternalChildren.Add(control.native);
          control.nativeView.SetValue($.System.Windows.Controls.Grid.ColumnProperty, this.private.cols);
          control.nativeView.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
          control.fireEvent('parent-attached', [this]);
          this.fireEvent('child-attached', [control]);
        } else {
          this.private.grid.InternalChildren.Add(control);
          control.SetValue($.System.Windows.Controls.Grid.ColumnProperty, this.private.cols);
          control.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
        }
        this.private.cols++;
      }
    }

    this.removeChild = function(control) {
      if(control == 'space') return;
      this.fireEvent('remove', element);
      if(this.private.children.indexOf(control) != -1) 
        this.private.children.splice(children.indexOf(control),1);
      this.private.grid.InternalChildren.Remove(control.native);
      control.fireEvent('parent-dettached', [this]);
      this.fireEvent('child-dettached', [control]);
    }

  }

  Toolbar.prototype = Object.create(Container.prototype);
  Toolbar.prototype.constructor = Toolbar;

  // TODO: Finish me
  // iconandlabel
  // icon
  // label
  Object.defineProperty(Toolbar.prototype, 'state', {
    get:function() { return "iconandlabel"; },
    set:function(e) { }
  });

  // TODO: Finish me
  // regular
  // small
  // default
  Object.defineProperty(Toolbar.prototype, 'size', {
    get:function() { return "default"; },
    set:function(e) { }
  });

  return Toolbar;
})();