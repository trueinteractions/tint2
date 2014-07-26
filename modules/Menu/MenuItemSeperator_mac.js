module.exports = (function() {
	function MenuItemSeperator() {
    	var $menu = $.NSMenuItem('seperatorItem');;
    	Object.defineProperty(this, 'internal', {
      		get:function() { $menu }
    	});
    }
    return MenuItemSeperator;
})();
