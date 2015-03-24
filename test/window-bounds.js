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
 * @see {Window}
 * @example
 */
function run($utils) {
  application.exitAfterWindowsClose = false;
  var w = new Window();
  w.visible = true;
  w.animateOnSizeChange = true;
  w.animateOnPositionChange = true;
  /* @hidden */ setTimeout(function(){ 
                  w.width = 400;
                  w.height = 400;
  /* @hidden */ }, 100);
  /* @hidden */ setTimeout(function(){
  /* @hidden */   $utils.assert(w.width == 400, 'w.width should be 400, was: '+w.width);
  /* @hidden */   $utils.assert(w.height == 400, 'w.height should be 400, was: '+w.height);
  /* @hidden */   //$utils.assert(w.bounds.width == 400, 'w.bounds.width should be 400, was: '+w.bounds.width);
  /* @hidden */   //$utils.assert(w.bounds.height == 378, 'w.bounds.height should be 400, was: '+w.bounds.height);
  /* @hidden */   w.width = 135;
  /* @hidden */   w.height = 135;
  /* @hidden */ }, 2000);
  /* @hidden */ setTimeout(function(){
  /* @hidden */   $utils.assert(w.width <= 142, 'w.width should have been 135, was: '+w.width);
  /* @hidden */   $utils.assert(w.height <= 142, 'w.height should have been 135, was: '+w.height);
  /* @hidden */   //$utils.assert(w.bounds.width == 100, 'w.bounds.width should have been 100, was: '+w.bounds.width);
  /* @hidden */   //$utils.assert(w.bounds.height == 78, 'w.bounds.height should have been 100, was: '+w.bounds.height);
    w.x = 100;
    w.y = 150;
  /* @hidden */ }, 4000);
  /* @hidden */ setTimeout(function(){
    /* @hidden */ $utils.assert(w.x == 100, 'w.x should be 100, was: '+w.x);
    /* @hidden */ $utils.assert(w.y == 150, 'w.y should be 150, was: '+w.y);
    /* @hidden */   w.x = 400;
    /* @hidden */   w.y = 400;
  /* @hidden */ }, 5000);
  /* @hidden */ setTimeout(function(){ 
    /* @hidden */ $utils.assert(w.x == 400, 'w.x should be 400, was: '+w.x);
    /* @hidden */ $utils.assert(w.y == 400, 'w.y should be 400, was: '+w.y);
    /* @hidden */ w.destroy();
    /* @hidden */ $utils.ok(); 
  /* @hidden */ }, 6500);
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
  name:"WindowSizeAndPosition",
};