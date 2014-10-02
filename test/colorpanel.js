
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
 * @see {ColorPanel}
 * @example
 */
function run($utils) {
  /* @hidden */ var color = new Color('rgba',40,40,40,0.1);
  /* @hidden */ $utils.assert(color.red == 40/255);
  /* @hidden */ $utils.assert(color.green == 40/255);
  /* @hidden */ $utils.assert(color.blue == 40/255);
  /* @hidden */ $utils.assert(color.alpha == 0.1);
  var panel = new ColorPanel();
  panel.visible = true;
  /* @hidden */ //var second = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ $utils.clickAt(125,125);
  panel.addEventListener('colorchange', function() {
    var selected = panel.selected;
    /* @hidden */ $utils.assert(selected.red <= 1 && selected.red >= 0, 'selected.red='+selected.red+' < 0.96 && selected.red='+selected.red+' > 0.93');
    /* @hidden */ $utils.assert(selected.green <= 1 && selected.green >= 0, 'selected.green['+selected.green+'] === 1');
    /* @hidden */ $utils.assert(selected.blue <= 1 && selected.blue >= 0, 'selected.blue['+selected.blue+'] < 0.96 && selected.blue['+selected.blue+'] > 0.93');
    /* @hidden */ $utils.assert(selected.alpha === 1, 'selected.alpha['+selected.alpha+'] === 1');
    /* @hidden */ $utils.assert(selected.colorspace === "rgb", 'colorspace should be rgb, was '+selected.colorspace);
    panel.style = "inspector";
    /* @hidden */ $utils.ok();
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