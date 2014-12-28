module.exports = (function() {
  
  function Menu(title) {
    if(typeof(title) === 'undefined') {
      title = "";
    }

    //this.native = new $.System.Windows.Controls.Menu();
    this.parent = null;
    this.children = [];

    this.appendChild = function(menuitem) {
      this.children.push(menuitem);
      if(this.parent) {
        this.parent.Items.Add(menuitem.native);
      }
      return menuitem;
    }
    this.removeChild = function(menuitem) {
      if(this.children.indexOf(menuitem) !== -1) {
        this.children.splice(this.children.indexOf(menuitem),1);
        if(this.parnet) {
          this.parent.Items.Remove(menuitem.native);
        }
      }
    }
  }
  return Menu;
})();