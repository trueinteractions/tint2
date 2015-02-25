module.exports = (function() {

  // Define the standard set of events we expect to use on most controls.
  // This is by default already contained on object that inherit form Control
  // or Container (and many others).  For objects with no inheritence this
  // can be used to attach a set of event handling functions quickly.
  function defineEvents(target) {
    target.initEvents = function(event) {
      if(!this.private) {
        this.private = {};
      }
      if(!this.private.events) {
        this.private.events = {};
      }
      if(!this.private.events[event]) {
        this.private.events[event] = [];
      }
    }
    target.fireEvent = function(event, args) {
      try {
        event = event.toLowerCase();
        this.initEvents(event);
        var returnvalue;
        (this.private.events[event]).forEach(function(item) { 
          returnvalue = item.apply(null, args) || returnvalue; 
        });
        return returnvalue;
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    };
    target.on = target.addListener = target.addEventListener = function(event, func) {
      event = event.toLowerCase();
      this.initEvents(event);
      // Private event, do not rely on this, used for adding native
      // handles when requested.
      this.fireEvent('event-listener-added', [event]);
      if(!this.private.events[event]) {
        this.private.events[event] = []; 
      }
      this.private.events[event].push(func);
    };
    target.off = target.removeListener = target.removeEventListener = function(event, func) {
      event = event.toLowerCase();
      this.initEvents(event);
      // Private event, do not rely on, used for removing native
      // handles when requested.
      this.fireEvent('event-listener-removed', [event]);
      if(this.private.events[event] && this.private.events[event].indexOf(func) !== -1) {
        this.private.events[event].splice(this.private.events[event].indexOf(func), 1);
      }
    };
  }

  // Defines the default parameters for all properties within Tint
  // or at least, at some point will be.  The saves as a few lines of
  // code which doesn't seem like a lot but when you have hundreds, 
  // or potentially thousands of properties, having one function to 
  // cut out 2 lines and define if properties are configurable/enumerable
  // is fairly useful. This exports as util.def().
  function defineProperty(target, name, getter, setter) {
    Object.defineProperty(target, name, {
      configurable:true,
      enumerable:true,
      get:getter,
      set:setter
    });
  }

  // Parses a unit of percentage, pixel, etc into a value that can be
  // reasoned with (e.g., double, integer, signed integer, etc.)
  function parseUnits(e) {
    if(typeof e === 'number') {
      return e;
    }
    if(e.indexOf('%') > -1) {
      e = e.replace('%','').trim();
      e = parseInt(e);
      e = e/100;
    } else {
      e = e.replace('px','').trim();
      e = parseInt(e);
    }
    return e;
  }

  // This is reused by both MAC and Windows controls for auto-layout, 
  // there wasn't a good home for it so we put it here. This could go
  // into a "Control_base".
  function createLayoutProperty(base, name, percentName, percentFunc, scalarName, scalarFunc, na) {
    Object.defineProperty(base, name, {
      get: function() { return this.private.user[name]; },
      set: function(value) {
        var propertyName = name;
        var p = this.private;
        var changeConstraint = null;

        if(na && na[0] && p.user[na[0]] !== null && na[1] && p.user[na[1]] !== null) {
          throw new Error('A '+name+' cannot be set when the '+na[0]+' and '+na[1]+' have been set already.');
        }

        this.private.states[propertyName] = value;
        p.user[propertyName] = value;

        if(p.constraints[propertyName] && value === null) {
          this.removeLayoutConstraint(p.constraints[propertyName]);
          p.constraints[propertyName] = null;
        } else if(p.constraints[propertyName] !== null && p.constraints[propertyName] && value !== null) {
          changeConstraint = p.constraints[propertyName];
        }
        if(value === null) {
          return;
        }
        this.addEventListener('parent-attached', function() {
          this[propertyName] = p.user[propertyName];
        }.bind(this));

        this.addEventListener('parent-dettached', function() {
          this.removeLayoutConstraint(p.constraints[propertyName]);
        }.bind(this));

        if(!p.parent) {
          return;
        }

        var layoutObject = {priority:'required', firstItem:this, firstAttribute:propertyName, relationship:'=', secondItem:p.parent};

        if ((typeof value === "string" || value instanceof String) 
          && value.indexOf('%') > -1) 
        {
          var parsedValue = parseUnits(value);
          layoutObject.multiplier = percentFunc(parsedValue);
          layoutObject.constant = 0.0;
          layoutObject.secondAttribute = percentName;
        } 
        else if (typeof value === "number" || value instanceof Number 
          || typeof value === "string" || value instanceof String) 
        {
          var parsedValue = parseUnits(value);
          layoutObject.multiplier = 1.0;
          layoutObject.constant = scalarFunc(parsedValue);
          layoutObject.secondAttribute = scalarName;
        } else {
          layoutObject.secondItem = value;
          layoutObject.multiplier = 1.0;
          layoutObject.constant = 0.0;
          if((p.parent === value || this === value.private.parent)
            || propertyName === "middle" || propertyName === "center") 
          {
            layoutObject.firstAttribute = layoutObject.secondAttribute = propertyName;
          } else if (propertyName === "left") {
            layoutObject.firstAttribute = "left";
            layoutObject.secondAttribute = "right";
          } else if (propertyName === "right") {
            layoutObject.firstAttribute = "right";
            layoutObject.secondAttribute = "left";
          } else if (propertyName === "top") {
            layoutObject.firstAttribute = "top";
            layoutObject.secondAttribute = "bottom";
          } else if (propertyName === "bottom") {
            layoutObject.firstAttribute = "bottom";
            layoutObject.secondAttribute = "top";
          }
        } 
        if(!layoutObject.secondAttribute) {
          layoutObject.secondItem = null;
        }
        if(changeConstraint !== null) {
          p.constraints[propertyName] = this.changeLayoutConstraint(changeConstraint, layoutObject);
        } else {
          p.constraints[propertyName] = this.addLayoutConstraint(layoutObject);
        }
      }
    });
  }

  function errorwrap(func) {
    var wrap = function() {
      try {
        return func.apply(null,arguments);
      } catch(e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    }
    return wrap;
  }

  function identity(v) { return v; }
  function inverse(v) { return (1-v); }
  function negate(v) { return -1*v; }
  function capitalize(s) { return s[0].toUpperCase() + s.toLowerCase().substr(1); }

  // Exports
  return {
    capitalize:capitalize,
    createLayoutProperty:createLayoutProperty,
    identity:identity,
    negate:negate,
    inverse:inverse,
    def:defineProperty,
    defEvents:defineEvents,
    parseUnits:parseUnits,
    errorwrap:errorwrap
  };
})();
