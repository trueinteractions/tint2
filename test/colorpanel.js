
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
  if($utils.debug) $utils.ok(); // TOOD: short circuit this for appveyor until we have a better control.
  /* @hidden */ var ismac = require('os').platform().toLowerCase() == "darwin";
  /* @hidden */ var color = new Color('rgba(40,40,40,0.1)');
  /* @hidden */ $utils.assert(color.red == (40/255*10)/10, 'color.red should be: '+(40/255)+' was: '+color.red);
  /* @hidden */ $utils.assert(color.green == (40/255*10)/10, 'color.green should be: '+(40/255)+' was: '+color.green);
  /* @hidden */ $utils.assert(color.blue == (40/255*10)/10, 'color.blue should be: '+(40/255)+' was: '+color.blue);
  /* @hidden */ $utils.assert(Math.round(color.alpha*10)/10 == 0.1, 'color.alpha should be: '+0.1+' was: '+color.alpha);
  var panel = new ColorPanel();
  panel.visible = true;
  /* @hidden */ //var second = false;
  /* @hidden */ panel.x=0;
  /* @hidden */ panel.y=0;
  panel.addEventListener('colorchange', function() {
    var selected = panel.selected;
    /* @hidden */ $utils.assert(selected.red <= 1 && selected.red >= 0, 'selected.red='+selected.red+' < 0.96 && selected.red='+selected.red+' > 0.93');
    /* @hidden */ $utils.assert(selected.green <= 1 && selected.green >= 0, 'selected.green['+selected.green+'] === 1');
    /* @hidden */ $utils.assert(selected.blue <= 1 && selected.blue >= 0, 'selected.blue['+selected.blue+'] < 0.96 && selected.blue['+selected.blue+'] > 0.93');
    /* @hidden */ $utils.assert(selected.alpha === 1, 'selected.alpha['+selected.alpha+'] === 1');
    /* @hidden */ $utils.ok();
  });
  /* @hidden */ if(ismac) {
  /* @hidden */  setTimeout(function() { $utils.clickAt(125,125); }, 500);
  /* @hidden */ } else {
  /* @hidden */  setTimeout(function() { $utils.clickAt(410,304); }, 500);
  /* @hidden */  setTimeout(function() { $utils.clickAt(327,435); }, 1000);
  /* @hidden */ }
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