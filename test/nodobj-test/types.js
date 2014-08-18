var types = require('../lib/types')
  , assert = require('assert')
  , inspect = require('util').inspect

test('v@:'
  , [ 'v', [ '@', ':' ] ]
  , [ 'void', [ 'pointer', 'pointer' ] ]
)

// test types.map()
assert.equal(types.map('r^v'), 'pointer')
assert.equal(types.map('r^^{__CFData}'), 'pointer')
assert.equal(types.map('^^{__CFData}'), 'pointer')


test('Q40@0:8^{?=Q^@^Q[5Q]}16^@24Q32'
  , [ 'Q', [ '@', ':', '^{?=Q^@^Q[5Q]}', '^@', 'Q' ] ]
  , [ 'ulonglong', [ 'pointer', 'pointer', 'pointer', 'pointer', 'ulonglong'] ]
)

test('@68@0:8{CGRect={CGPoint=dd}{CGSize=dd}}16Q48Q56c64'
  , [ '@', [ '@', ':', '{CGRect={CGPoint=dd}{CGSize=dd}}', 'Q', 'Q', 'c' ] ]
)


function test (type, rtn, ffi) {
  //console.log('Input:\t%s', type)
  var parsed = types.parse(type)
  //console.log('Output:\t'+inspect(parsed, true, 10, true)+'\n')
  assert.deepEqual(parsed, rtn)
  if (!ffi) return
  var f = types.mapArray(parsed)
  //console.log('FFI Types:\t'+inspect(f, true, 10, true)+'\n')
  assert.deepEqual(f, ffi)
}
