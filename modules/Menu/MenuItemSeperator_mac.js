module.exports = (function() {
	function MenuItemSeperator() {
		var $ = process.bridge;
    	var $menu = $.NSMenuItem('seperatorItem');;
    	Object.defineProperty(this, 'internal', {
      		get:function() { $menu }
    	});
    }
    return MenuItemSeperator;
})();
