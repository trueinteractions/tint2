var fs = require('fs');
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.Dialog = require('Dialog');
}

function baseline() {
}

/**
 * @see {Dialog}
 * @example
 */
function run($utils) {
  var win = new Window();
  /* @hidden */ win.x=0;
  /* @hidden */ win.y=0;
  /* @hidden */ var confirm = 'main';
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
    /* @hidden */ $utils.assert(e==confirm);
    /* @hidden */ if(e == 'aux' && confirm == 'aux') {
    /* @hidden */   $utils.assert(dialog.suppressionChecked === false);
    /* @hidden */   $utils.ok();
    /* @hidden */ }
    /* @hidden */ dialog.open(win); // perhaps only allow a dialog to open once?
    /* @hidden */ confirm = 'aux';
    /* @hidden */ setTimeout(function() {
    /* @hidden */   $utils.clickAt(250,124); // hopefully this is consistant, should hit supression
    /* @hidden */ },500);
    /* @hidden */ setTimeout(function() {
    /* @hidden */   $utils.clickAt(300,154); // hopefully this is consistant, should hit aux 
    /* @hidden */ },1000);
  });
  dialog.open(win);
  /* @hidden */ $utils.assert(dialog.title == "Dialog Title")
  /* @hidden */ $utils.assert(dialog.message == "Message dialog")
  /* @hidden */ $utils.assert(dialog.icon == "assets/tintcompiler.png");
  /* @hidden */ $utils.assert(dialog.suppressionChecked == true);
  /* @hidden */ setTimeout(function() {
  /* @hidden */   $utils.clickAt(400,154); // hopefully this is consistant, should hit main
  /* @hidden */                            // find a better way of doing this :/
  /* @hidden */   //$utils.takeSnapshotOfCurrentWindow('assets/dialog_mac.png');
  /* @hidden */ },1000);
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