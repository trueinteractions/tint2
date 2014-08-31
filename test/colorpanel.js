
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
  var panel = new ColorPanel();
  /* @hidden */ //var second = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  /* @hidden */ panel.width=500;
  /* @hidden */ panel.height=500;
  /* @hidden */ $utils.clickAt(250,250);
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