// V8 does not have an explicit way for memwatach to force garbage collection
// within the version used for node 0.6, and 0.8.  Therefore we wont test
// on those versions.
if(process.version.indexOf('0.6') == -1 && process.version.indexOf('0.8') == -1)
{
  var $ = require('../');
  var assert = require('assert');
  var memwatch = require('memwatch');

  $.import('Foundation', 0);
  $.import('Cocoa', 0);

  /*memwatch.on('leak', function(e) {
    console.log('suspected leak: ', e);
  });
  memwatch.on('stats', function(e) {
    console.log('memory stats: ', e);
  });*/

  // NOTE: The number of tries (as you increase it) generally
  // indicates a level of confidence in results.
  var tries = 1;
  var failures = 0;
  var failuresSize = 0;

  for (var j = 0; j < tries; j++) {
    var pool = $.NSAutoreleasePool('alloc')('init');
    var text = $.NSTextField('alloc')('initWithFrame', $.NSMakeRect(0, 0, 200, 20));
    text('retain');
    var hd = new memwatch.HeapDiff();

    for (var i = 10; i < 9000; i++) {
      var q = $.NSMakeRect(0, 0, 100, i);

      var z = text('frame');
      z.size.height = i;
      text('setFrame', z);
      var p = text('frame');
      assert(z.size.width == p.size.width, 'width was invalid: ', z.size.width, p.size.width);
      assert(z.size.height == p.size.height, 'height was invalid: ', z.size.height, p.size.height);
      assert(z.origin.x == p.origin.x, 'x was invalid: ', z.origin.x, p.origin.x);
      assert(z.origin.y == p.origin.y, 'y was invalid: ', z.origin.y, p.origin.y);
    }
    gc();
    var diff = hd.end();
    text('release');
    pool('release');
    text = null;
    pool = null;

    // Note we have a variance published at 30KB bytes, so we'll agree to allow
    // this amount of memory leaking before we judge it as a failure.
    if (diff.change.size_bytes > 30*1024) {
      failures++;
      failuresSize += diff.change.size_bytes;
    }
  }
  gc();
  assert(failures == 0, failures + ' out of ' + tries + ' tests failed. The amount of leaked memory was: ' + failuresSize + ' bytes');
}