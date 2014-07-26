module.exports = (function() {
	function Menu(title) {
		if(typeof(title) == 'undefined') title = "";

		var $menu = $.NSMenu('alloc')('initWithTitle',$(title));
		var children = [];

		this.appendChild = function(menuitem) {
			children.push(menuitem);
			$menu('addItem',menuitem.internal);
		}
		this.removeChild = function(menuitem) {
			if(children.indexOf(menuitem) != -1) children.splice(children.indexOf(menuitem),1);
	   		$menu('removeItem',menuitem.internal);
		}
		Object.defineProperty(this, 'internal', {
	      get:function() { return $menu; }
	    });
	} 
	return Menu;
})();