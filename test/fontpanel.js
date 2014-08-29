
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.FontPanel = require('FontPanel');
}

function baseline() {
}

/**
 * @see {Fonts}
 * @see {FontPanel}
 * @example
 */
function run($utils) {
  var panel = new FontPanel();
  /* @hidden */ var trackChange = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ panel.width = 500;
  /* @hidden */ panel.height = 500;
  panel.addEventListener('fontchange', function() {
    if(trackChange){
      var selected = panel.selected;
      $utils.assert(selected.face.indexOf('Arial') > -1);
      $utils.assert(selected.size === 15);
      $utils.assert(selected.family === 'Arial');
      $utils.assert(selected.italic === false);
      $utils.assert(selected.bold === false);
      $utils.assert(selected.weight === 500);
      $utils.ok();
    }
  });

  setTimeout(function() {
    $utils.clickAt(58,109);
    setTimeout(function() {
      $utils.clickAt(220,109);
      setTimeout(function() {
        $utils.keyAtControl('a');
        $utils.keyAtControl('r');
        $utils.keyAtControl('i');
        $utils.keyAtControl('a');
        $utils.keyAtControl('l');
        setTimeout(function() {
          $utils.clickAt(320,109);
          setTimeout(function() {
            $utils.clickAt(450,109);
            $utils.keyAtControl('1');
            $utils.keyAtControl('5');
            trackChange = true;
            $utils.keyAtControl('RETURN');
          },500);
        },500);
      },500);
    },500);
  },500);
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
  name:"FontPanel",
};