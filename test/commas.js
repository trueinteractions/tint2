function test() {
	var test1 = console.log('first'),
		test2 = console.log('second'),
		test3 = console.log(arguments)
}
for(var i=0; i < 100; i++)
test();
