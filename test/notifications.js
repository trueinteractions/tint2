
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  process.bridge.objc.import('Foundation');
  process.bridge.objc.import('AppKit');
  global.Notification = require('Notification');
}

function baseline() {
  $utils = require('../../../../tools/utilities.js');
  Notification.requestPermission(function(result) {
    if(result) {
      var notify = new Notification();
      notify.title = "Title";
      notify.subtitle = "Sub-Title";
      notify.text = "Main text for the notify";
      notify.sound = true;
      notify.mainButtonLabel = "Main";
      notify.auxillaryButtonLabel = "Aux";
      notify.dispatch();
      setTimeout(function() {
        $utils.takeSnapshotOfTopWindow('assets/notifications_mac.png');
        process.exit(0);
      },1500)
    }
  });
}

/**
 * @see {Notification}
 * @example
 */
function run() {
  /* @hidden */ $utils = require('../../../../tools/utilities.js');
  Notification.requestPermission(function(result) {
    /* @hidden */ $utils.assert(result);
    // If we get the OK we'll send up a new notificaiton.
    if(result) {
      // Create a new notification
      var notify = new Notification();
      // Set a title, the very top part of notification @img{assets/notifications_title_mac.png}
      notify.title = "Title";
      // Set a subtitle, the next set of text as part of notification @img{assets/notifications_sub-title_mac.png}
      notify.subtitle = "Sub-Title";
      // Set the long-form text of the notification @img{assets/notifications_text_mac.png}
      notify.text = "Main text for the notify";
      // Request a 'bong' when it runs.
      notify.sound = true;
      // The text for the button at @img{assets/notifications_main_button.png}
      notify.buttonLabel = "Main";
      // The text for the button at @img{assets/notifications_aux_button.png}
      notify.addEventListener('fired', function() {
        /* @hidden */ setTimeout(function() { $utils.clickAt(1600,80); },1000);
      });
      notify.addEventListener('click', function(args) {
        /* @hidden */ $utils.assert(args == "button");
        /* @hidden */ process.exit(0);
      });

      // Throw the notification out.
      notify.dispatch();

      /* @hidden */ $utils.assert(notify.title === 'Title');
      /* @hidden */ $utils.assert(notify.subtitle === 'Sub-Title');
      /* @hidden */ $utils.assert(notify.text === "Main text for the notify");
      /* @hidden */ $utils.assert(notify.sound === true);
      /* @hidden */ $utils.assert(notify.buttonLabel === "Main");
    }
  });
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
  shell:true,
  shell_options:{timeout:5000},
  name:"Notifications",
};