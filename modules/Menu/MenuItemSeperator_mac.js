module.exports = (function() {
	function MenuItemSeperator() {
		var $ = process.bridge.objc;
    	var $menu = $.NSMenuItem('seperatorItem');;
    	Object.defineProperty(this, 'native', {
      		get:function() { $menu }
    	});
    }
    return MenuItemSeperator;
})();
