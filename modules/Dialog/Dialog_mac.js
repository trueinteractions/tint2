module.exports = (function() {
	var $ = process.bridge.objc;

	function Dialog(type) {
		var $dialog = (type == "save") ? $.NSSavePanel('savePanel') : $.NSOpenPanel('openPanel');
		var allowedFileTypes = null, events = {};

	    function fireEvent(event, args) {
	      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
	    }

	    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
	    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

		Object.defineProperty(this, "title", {
			get:function() { return $dialog('title'); },
			set:function(e) { $dialog('setTitle', $(e)); }
		});
		Object.defineProperty(this, "message", {
			get:function() { return $dialog('message'); },
			set:function(e) { $dialog('setMessage', $(e)); }
		});
		Object.defineProperty(this, "prompt", {
			get:function() { return $dialog('prompt'); },
			set:function(e) { $dialog('setPrompt', $(e)); }
		});
		Object.defineProperty(this, "directory", {
			get:function() { return $dialog('directoryURL')('absoluteString'); },
			set:function(e) { $dialog('setDirectoryURL', $.NSURL('URLWithString',$(e))); }
		});
		Object.defineProperty(this, 'filename', {
			get:function() { return $dialog('nameFieldStringValue'); },
			set:function(val) { $dialog('setNameFieldStringValue', $(val)); }
		});
		Object.defineProperty(this, 'type', {
			get:function() { return type; }
		});
		Object.defineProperty(this, 'allowAnyFileType', {
			get:function() { return $dialog('allowsOtherFileTypes') ? true : false; },
			set:function(val) { $dialog('setAllowedOtherFileTypes', val ? $.YES : $.NO); }
		});
		Object.defineProperty(this, "allowFileTypes", {
			get:function() { return allowedFileTypes; },
			set:function(items) { 
				console.assert(Array.isArray(items));
				allowedFileTypes = items;
				var arr = $.NSMutableArray('arrayWithCapacity',items.length);
				items.forEach(function(item,i) { arr('insertObject',$(item),'atIndex',i); });
				$dialog('setAllowedFileTypes',arr);
			}
		});
		Object.defineProperty(this, "allowMultiple", {
			get:function() {
				if(type == "save") return false;
				return $dialog('allowsMultipleSelection') ? true : false;
			},
			set:function(e) {
				if(type == "save" && e) throw new Error('Save dialogs cannot ask for multiple file paths.');
				else if(type == "save" && !e) return;
				$dialog('setAllowsMultipleSelection',e); 
			}
		});
		Object.defineProperty(this, "allowDirectories", {
			get:function() {
				if(type == "save") return false;
				return $dialog('canChooseDirectories') ? true : false;
			},
			set:function(e) {
				if(type == "save") return;
				$dialog('setCanChooseDirectories', e ? true : false);
			}
		});
		Object.defineProperty(this, "selection", {
			get:function() {
				if(type == "open") {
					var urls = $dialog('URLs');
					var count = urls('count');
					var result = [];
					for(var i=0; i < count; i++) 
						result.push(urls('objectAtIndex',i)('absoluteString'));
					return result;
				} else
					return $dialog('URL')('absoluteString');
			}
		});
		this.setChild = function(e) { $dialog('setAccessoryView',e); }
		this.open = function(z) {
			var w = z ? z : $.NSApplication('sharedApplication')('mainWindow');
			if(w) {
				w = w.native ? w.native : w;
				var comp = $(function(self,e) {
					if(e == $.NSFileHandlingPanelOKButton) fireEvent('select');
					else fireEvent('cancel');
				},[$.void,['?',$.long]]);
				$dialog('beginSheetModalForWindow',w,'completionHandler',comp);
			} else {
				var e = $dialog('runModal');
				if(e == $.NSFileHandlingPanelOKButton) fireEvent('select');
				else fireEvent('cancel');
			}
		}
		this.cancel = function() {
			$dialog('cancel',$dialog);
		}
	}
	return Dialog;
})();