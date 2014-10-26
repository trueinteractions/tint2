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
  /* @hidden */ var Screens = require('Screens');
  /* @hidden */ var scn = Screens.active;
  /* @hidden */ var ismac = require('os').platform().toLowerCase() == "darwin";
  var win = new Window();
  win.visible = true;
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
    /* @hidden */ $utils.assert(e==confirm, 'got '+e+' expected '+confirm);
    /* @hidden */ if(e == 'aux' && confirm == 'aux') {
    /* @hidden */   $utils.assert(dialog.suppressionChecked === false);
    /* @hidden */   $utils.ok();
    /* @hidden */ }
    /* @hidden */ dialog.open(win); // perhaps only allow a dialog to open once?
    /* @hidden */ confirm = 'aux';
    /* @hidden */ setTimeout(function() {
    /* @hidden */   if(ismac) $utils.clickAt(250,124); // TODO: Fix this hard coded value, hopefully this is consistant, should hit supression
    /* @hidden */   else $utils.clickAt((scn.bounds.width/2)-115,(scn.bounds.height/2)-5);
    /* @hidden */ },500);
    /* @hidden */ setTimeout(function() {
    /* @hidden */   if(ismac) $utils.clickAt(300,154); // TODO: Fix this hard coded value, hopefully this is consistant, should hit aux 
    /* @hidden */   else $utils.clickAt((scn.bounds.width/2)+85,(scn.bounds.height/2)+40);
    /* @hidden */ },1500);
  });
  dialog.open(win);
  /* @hidden */ $utils.assert(dialog.title == "Dialog Title", dialog.title);
  /* @hidden */ $utils.assert(dialog.message == "Message dialog", dialog.message);
  /* @hidden */ $utils.assert(dialog.icon == "assets/tintcompiler.png", dialog.icon);
  /* @hidden */ $utils.assert(dialog.suppressionChecked == true);
  /* @hidden */ setTimeout(function() {
  /* @hidden */   if(ismac)
  /* @hidden */     $utils.clickAt(400,154); // hopefully this is consistant, should hit main
  /* @hidden */                              // find a better way of doing this :/
  /* @hidden */   else
  /* @hidden */     $utils.clickAt((scn.bounds.width/2)+175,(scn.bounds.height/2)+40);
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