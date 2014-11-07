module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Toolbar() {
    var options = {};
    options.initViewOnly = true;
    Container.call(this, $.System.Windows.Controls.DockPanel, $.System.Windows.Controls.DockPanel, options);
    this.native.Orientation = $.System.Windows.Controls.Orientation.Horizontal;
    this.native.Height = 22;
    this.private.backupAppend = this.appendChild;
    this.private.backupRemove = this.removeChild;

    this.appendChild = function(e) {
      if(Array.isArray(e)) {
        var dst = [];
        for(var i=0; i < e.length; i++)
          if(e[i] != 'space') dst.push(e[i]);
        this.private.backupAppend.apply(this,[dst]);
      } else if(e != 'space') {
        this.private.backupAppend.apply(this,[e]);
      }
    }.bind(this);
    //this.removeChild = 
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