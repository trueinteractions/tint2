module.exports = (function() {
	var $ = process.bridge.objc;

	function Control(NativeObjectClass, NativeViewClass, options) {
    var events = {}, native, nativeView;
		//width, height
		//maxwidth, maxheight
		//minwidth, minheight
		//left, top, right, bottom
		this.fireEvent = function(event,args) {
			var returnvalue = undefined;
      if(events[event]) {
        (events[event]).forEach(function(item,index,arr) { 
          var tmp = item(args);
          if(tmp) returnvalue = tmp;
        });
      }
      return returnvalue;
    }

    this.addEventListener = function(event, func) {
      if(!events[event]) events[event] = []; 
      events[event].push(func);
    }

    this.removeEventListener = function(event, func) {
      if(events[event] && events[event].indexOf(func) != -1) 
        events[event].splice(events[event].indexOf(func), 1);
    }

    var nativeViewExt = NativeViewClass.extend('NSView'+Math.round(Math.random()*10000));
    nativeViewExt.addMethod('mouseDown:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseDown',events);
      try { 
        this.fireEvent('mouseDown');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
		//TODO: Does not work.
		nativeViewExt.addMethod('mouseUp:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
			self.super('mouseUp',events);
			try { 
				this.fireEvent('mouseUp');
			} catch(e) { 
				console.log(e.message);
				console.log(e.stack);
				process.exit(1);
			}
		}.bind(this));
		//TODO: Does not work.
		nativeViewExt.addMethod('mouseEntered:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
			self.super('mouseEntered',events);
			try {
				this.fireEvent('mouseEntered');
			} catch(e) { 
				console.log(e.message);
				console.log(e.stack);
				process.exit(1);
			}
		}.bind(this));
		//TODO: Does not work.
		nativeViewExt.addMethod('mouseExited:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
			self.super('mouseExited',events);
			try { 
				this.fireEvent('mouseExited');
			} catch(e) { 
				console.log(e.message);
				console.log(e.stack);
				process.exit(1);
			}
		}.bind(this));
		//TODO: Does not work.
		nativeViewExt.addMethod('mouseMoved:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
			self.super('mouseMoved',events);
			try {
				this.fireEvent('mouseMoved');
			} catch(e) { 
				console.log(e.message);
				console.log(e.stack);
				process.exit(1);
			}
		}.bind(this));
		nativeViewExt.register();

		Object.defineProperty(this,'boundsOnScreen', {
			get:function() {
				var scnBounds = $.NSScreen('mainScreen')('frame');
				var vwBounds = this.nativeView('bounds');
				var winBounds = this.nativeView('convertRect', vwBounds, 'toView', null);
				var bounds = this.nativeView('window')('convertRectToScreen',winBounds);
				return {
          x:bounds.origin.x,
          y:(scnBounds.size.height - bounds.origin.y) - vwBounds.size.height,
          width:bounds.size.width,
          height:bounds.size.height
        };
			}
		});

		Object.defineProperty(this,'boundsOnWindow', {
			get:function() {
				var vwBounds = this.nativeView('bounds');
				var bounds = this.nativeView('convertRect', vwBounds, 'toView', null);
				return {
          x:bounds.origin.x, 
          y:bounds.origin.y - vwBounds.size.height, 
          width:bounds.size.width, 
          height:bounds.size.height
        };
			}
		});

		Object.defineProperty(this,'bounds',{
			get:function() {
				var bounds = this.nativeView('bounds');
				return {x:bounds.origin.x, y:bounds.origin.y, width:bounds.size.width, height:bounds.size.height};
			}
		});

		Object.defineProperty(this, 'nativeClass', { get:function() { return NativeObjectClass; } });
		Object.defineProperty(this, 'nativeViewClass', { get:function() { return nativeViewExt; } });
		
		Object.defineProperty(this, 'native', {
			get:function() { return native; },
			set:function(e) { native = e; }
		});

		Object.defineProperty(this, 'nativeView', {
			get:function() { return nativeView; },
			set:function(e) { nativeView = e; }
		});

   Object.defineProperty(this, 'visible', {
    configurable:true,
    get:function() { return !this.nativeView('isHidden'); },
    set:function(e) { return this.nativeView('setHidden',!e); }
  });


 }
 return Control;
})();