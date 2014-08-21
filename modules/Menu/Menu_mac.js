module.exports = (function() {
	function Menu(title) {
		var $ = process.bridge.objc;
		if(typeof(title) == 'undefined') title = "";

		var $menu = $.NSMenu('alloc')('initWithTitle',$(title));
		var children = [];

		this.appendChild = function(menuitem) {
			children.push(menuitem);
			$menu('addItem',menuitem.native);
		}
		this.removeChild = function(menuitem) {
			if(children.indexOf(menuitem) != -1) children.splice(children.indexOf(menuitem),1);
	   		$menu('removeItem',menuitem.native);
		}
		Object.defineProperty(this, 'native', {
	      get:function() { return $menu; }
	    });
	} 
	return Menu;
})();