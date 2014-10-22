module.exports = (function() {
  var $ = process.bridge.dotnet;
  
  function Menu(title) {
    if(typeof(title) == 'undefined')
      title = "";

    this.native = new $.System.Windows.Controls.Menu();
    this.children = [];

    this.appendChild = function(menuitem) {
      this.children.push(menuitem);
      this.native.Items.Add(menuitem.native);
      return menuitem;
    }
    this.removeChild = function(menuitem) {
      if(this.children.indexOf(menuitem) != -1) {
        this.children.splice(this.children.indexOf(menuitem),1);
        this.native.Items.Remove(menuitem.native);
      }
    }
  }
  return Menu;
})();