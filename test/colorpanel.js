
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  global.Window = require('Window');
  global.ColorPanel = require('ColorPanel');
  global.Color = require('Color');
}

function baseline() {
}

/**
 * @see {ColorPanel}
 * @example
 */
function run($utils) {
  var panel = new ColorPanel();
  /* @hidden */ //var second = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ panel.width=500;
  /* @hidden */ panel.height=500;
  /* @hidden */ $utils.clickAt(250,250);
  panel.addEventListener('colorchange', function() {
    var selected = panel.selected;
    /* @hidden */ //if(second) {
      /* @hidden */ $utils.assert(selected.red < 0.95 && selected.red > 0.94);
      /* @hidden */ $utils.assert(selected.green > 0.9 && selected.green < 0.91);
      /* @hidden */ $utils.assert(selected.blue === 1);
      /* @hidden */ $utils.assert(selected.alpha === 1);
      /* @hidden */ $utils.assert(selected.colorspace === "rgb");
      /* @hidden */ second = true;
      //TODO: Figure out why the color is not coming through with set color.
      /* FAILING: setcolor = new Color('rgb', 0.5, 0.5, 0.5, 0.5);
      panel.selected = setcolor; */
      /* @hidden */ $utils.ok();
    /* @hidden */ //} else {
    /* @hidden */   //$utils.assert(selected.red === 1);
    /* @hidden */   //$utils.assert(selected.green === 0);
    /* @hidden */   //$utils.assert(selected.blue == 0);
    /* @hidden */   //$utils.assert(selected.colorspace == "rgb");
    /* @hidden */   //$utils.ok();


    /* @hidden */ //}
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
  shell:false,
  name:"ColorPanel",
};