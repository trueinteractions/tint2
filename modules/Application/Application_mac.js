(function() {
  function Application() {
    var events = {}, mainMenu = null, name = "", badgeText = "";
    var $app = $.NSApplication('sharedApplication');

    function fireEvent(event, args) {
      if(events[event])
        (events[event]).forEach(function(item,index,arr) { item.apply(args); });
    }

    this.preferences = {animateWhenPossible:false};

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }
    this.launch = function() { fireEvent('launch'); }.bind(this);
    this.uninstall = function() { console.warn('unimplemented'); }

    Object.defineProperty(this, 'name', {
      get:function() { return name; },
      set:function(e) {  name = e; }
    });

    Object.defineProperty(this, 'badge', {
      get:function() { return badgeText; },
      set:function(e) { 
        badgeText = e;
        $app('dockTile')('setBadgeLabel',$(badgeText));
      }
    });

    Object.defineProperty(this, 'internal', { get:function() { return $app; } });

    this.attention = function(critical) {
      $app('requestUserAttention', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) );
      return {cancel:function() { $app('cancelUserAttentionRequest', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) ); }.bind(this)};
    }

    this.paste = function() { $app('sendAction', 'paste:', 'to', null, 'from', $app); }
    this.copy = function() { $app('sendAction', 'copy:', 'to', null, 'from', $app); }
    this.cut = function() { $app('sendAction', 'cut:', 'to', null, 'from', $app); }
    this.undo = function() { $app('sendAction', 'undo:', 'to', null, 'from', app); }
    this.redo = function() { $app('sendAction', 'redo:', 'to', null, 'from', $app); }
    this.delete = function() { $app('sendAction', 'delete:',' to', null, 'from', $app); }
    this.selectAll = function() { $app('sendAction', 'selectAll:', 'to', null, 'from', $app); }
    $app('setActivationPolicy', $.NSApplicationActivationPolicyRegular);
    $app('activateIgnoringOtherApps', true);
  }

  /*Application.osxBuildDefaultMainMenu = function() {
    $MenuClass = require('./modules/Menu/Menu_mac.js');
    $MenuItemClass = require('./modules/Menu/MenuItem_mac.js');
    $MenuItemSeperatorClass = require('./modules/Menu/MenuItemSeperator_mac.js');

    var appleMenu = new $MenuClass("");
    appleMenu.appendChild(new $MenuItemClass('About '+name, null);
    appleMenu.appendChild(new $MenuItemSeperatorClass());
    appleMenu.appendChild(new $MenuItemClass('Hide '+name, 'h'));
    appleMenu.appendChild(new $MenuItemClass('Hide Others', null);
    appleMenu.appendChild(new $MenuItemClass('Show All', null));
    appleMenu.appendChild(new $MenuItemSeperatorClass());
    appleMenu.appendChild(new $MenuItemClass('Quit '+name, null));
  }*/

  global.application = new Application();
})();
