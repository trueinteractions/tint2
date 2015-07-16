
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
 * @example
 */
function run($utils) {
  // unfortunately theres no easy way of testing this.  We'll need to do this manually.
  $utils.skip('manual');
  console.log('waiting for an open...  Try open myapp2://foo.  This must run as a fully packaged app.');
  application.registerScheme("myapp2");
  application.on('open', function(url) {
    assert(url === 'myapp2://foo');
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
  name:"URLScheme",
};