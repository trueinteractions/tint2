
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

/**
 * @see {Menu}
 * @see {MenuItem}
 * @see {MenuItemSeparator}
 * @example
 */
function run($utils) {
  /* @hidden */ var ismac = require('os').platform().toLowerCase() == "darwin";
  application.name = "My Program";
  var win = new Window();
  win.visible = true;

  var mainMenu = new Menu();
  var appleMenu = new MenuItem(application.name, '');
  var fileMenu = new MenuItem('File', '');
  var editMenu = new MenuItem('Edit', '');
  var windowMenu = new MenuItem('Window', '');
  var helpMenu = new MenuItem('Help', '');
  /* @hidden */ if(ismac)
  mainMenu.appendChild(appleMenu);
  mainMenu.appendChild(fileMenu);
  mainMenu.appendChild(editMenu);
  mainMenu.appendChild(windowMenu);
  mainMenu.appendChild(helpMenu);

  var appleSubmenu = new Menu(application.name);
  appleSubmenu.appendChild(new MenuItem('About '+application.name, ''))
      .addEventListener('click', function() { console.log('Do something for about!'); });
  appleSubmenu.appendChild(new MenuItemSeparator());
  appleSubmenu.appendChild(new MenuItem('Hide '+application.name, 'h'))
      .addEventListener('click', function() { application.visible = false; });
  appleSubmenu.appendChild(new MenuItem('Hide Others', ''))
      .addEventListener('click', function() { application.hideAllOtherApplications(); });
  appleSubmenu.appendChild(new MenuItem('Show All', ''))
      .addEventListener('click', function() { application.unhideAllOtherApplications(); });
  appleSubmenu.appendChild(new MenuItemSeparator());
  appleSubmenu.appendChild(new MenuItem('Quit '+application.name, 'q'))
      .addEventListener('click', function() { 
        /* @hidden */ if(ismac) $utils.ok();
        /* @hidden */ if(ismac) process.exit(0); 
      });
  appleMenu.submenu = appleSubmenu;

  var fileSubmenu = new Menu('File');
  fileSubmenu.appendChild(new MenuItem('New File', 'f'));
  fileSubmenu.appendChild(new MenuItem('Open...', 'o'));
  fileSubmenu.appendChild(new MenuItem('Save', 's'));
  fileSubmenu.appendChild(new MenuItem('Save As...', 'S', 'shift'));
  fileSubmenu.appendChild(new MenuItemSeparator());
  fileSubmenu.appendChild(new MenuItem('Close', 'c', 'cmd'))
    .addEventListener('click', function() {
      /* @hidden */ if(!ismac) $utils.ok();
      /* @hidden */ if(!ismac) process.exit(0);
    });
  fileMenu.submenu = fileSubmenu;

  var editSubmenu = new Menu('Edit');
  var undo = new MenuItem('Undo', 'u');
  undo.addEventListener('click', function() { application.undo(); });
  editSubmenu.appendChild(undo);
  editSubmenu.appendChild(new MenuItem('Redo', 'r'))
      .addEventListener('click', function() { application.redo(); });
  editSubmenu.appendChild(new MenuItemSeparator());
  editSubmenu.appendChild(new MenuItem('Copy', 'c'))
      .addEventListener('click', function() { application.copy(); });
  editSubmenu.appendChild(new MenuItem('Cut', 'x'))
      .addEventListener('click', function() { application.cut(); });
  editSubmenu.appendChild(new MenuItem('Paste', 'p'))
      .addEventListener('click', function() { application.paste(); });
  editMenu.submenu = editSubmenu;

  var windowSubmenu = new Menu('Window');
  windowSubmenu.appendChild(new MenuItem('Minimize', 'm'))
      .addEventListener('click', function() { win.state = "minimized"; });
  windowSubmenu.appendChild(new MenuItem('Zoom', ''))
      .addEventListener('click', function() { win.state = "maximized"; });
  windowSubmenu.appendChild(new MenuItemSeparator());
  windowSubmenu.appendChild(new MenuItem('Bring All to Front', ''))
      .addEventListener('click', function() { win.bringToFront(); });
  windowSubmenu.appendChild(new MenuItemSeparator());
  windowMenu.submenu = windowSubmenu;
  
  var helpSubmenu = new Menu('Help');
  helpSubmenu.appendChild(new MenuItem('Website', ''))
    .addEventListener('click', function() { console.log('Do something for website?!'); });
  helpSubmenu.appendChild(new MenuItem('Online Documentation', ''))
    .addEventListener('click', function() { console.log('Do something for docs?!'); });
  helpSubmenu.appendChild(new MenuItem('License', ''))
    .addEventListener('click', function() { console.log('Do something for license?!'); });
  helpMenu.submenu = helpSubmenu;

  win.menu = mainMenu;
  
  /* @hidden */ setTimeout(function() { 
  /* @hidden */   if(ismac) $utils.clickAt(65,15);
  /* @hidden */   else {
  /* @hidden */     var x = win.x + 15;
  /* @hidden */     var y = win.y + 40;
  /* @hidden */     $utils.clickAt(x,y);
  /* @hidden */   }
  /* @hidden */ },1000); 
  /* @hidden */ setTimeout(function() { 
  /* @hidden */   if(ismac) $utils.clickAt(65,135); 
  /* @hidden */   else {
  /* @hidden */     var x = win.x + 25;
  /* @hidden */     var y = win.y + 165;
  /* @hidden */     $utils.clickAt(x,y);
  /* @hidden */   }
  /* @hidden */ },2000); 

}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  name:"Menu",
};