module.exports = (function() {
	var $ = process.bridge.objc;

	function System() {}

	System.getIconForFile = function(e) {
		return "data:image/png;base64," + $$.TintInterop.Shell.GetIconForFile(e);
	}
	return System;
})();