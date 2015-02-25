var fs = require('fs');
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
 * @see {Dialog}
 * @example
 */
function run($utils) {
  var Screens = require('Screens');
  var scn = Screens.active;
  var ismac = require('os').platform().toLowerCase() == "darwin";
  var win = new Window();
  win.visible = true;
  win.x=0;
  win.y=0;
  var confirm = 'main';
  win.bringToFront();
  var dialog = new Dialog();
  dialog.title = "Dialog Title";
  dialog.message = "Message dialog";
  dialog.icon = "assets/tintcompiler.png";
  dialog.suppression = "Do not show this again.";
  dialog.suppressionChecked = true;
  dialog.mainbutton = "Main";
  dialog.auxbutton = "Aux";
  dialog.addEventListener('click', function(e) {
    $utils.assert(e==confirm, 'got '+e+' expected '+confirm);
    if(e == 'aux' && confirm == 'aux') {
       $utils.assert(dialog.suppressionChecked === false);
       $utils.ok();
    }
    // TODO: perhaps only allow a dialog to open once?
    dialog.open(win); 
    confirm = 'aux';
    setTimeout(function() {
      if(ismac) {
        // TODO: Fix this hard coded value, hopefully this is consistant, should hit supression
        $utils.clickAt(250,124); 
      } else {
        // click no supression checkbox
        $utils.clickAtControl(dialog.native.supression);
      }
    },500);
    setTimeout(function() {
      if(ismac) {
        // TODO: Fix this hard coded value, hopefully this is consistant, should hit aux
        $utils.clickAt(300,154);
      } else {
        // click aux/cancel.
        $utils.clickAtControl(dialog.native.auxbutton); 
      }
    },1500);
  });
  dialog.open(win);
  $utils.assert(dialog.title == "Dialog Title", dialog.title);
  $utils.assert(dialog.message == "Message dialog", dialog.message);
  $utils.assert(dialog.icon == "assets/tintcompiler.png", dialog.icon);
  $utils.assert(dialog.suppressionChecked == true);
  setTimeout(function() {
    if(ismac) {
      // hopefully this is consistant, should hit main
      // find a better way of doing this :/
      $utils.clickAt(400,154); 
    } else {
      // click main
      $utils.clickAtControl(dialog.native.mainbutton);
    }
  },100);
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
  name:"Dialog"
};