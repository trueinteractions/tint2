#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>
#include <node.h>
#include "v8_typed_array.h"
#include "CoreFoundation/CoreFoundation.h"
#include <unistd.h>
#include <sys/event.h>

static int init_argc;
static char **init_argv;


@interface AppDelegate : NSObject <NSApplicationDelegate>
@property() bool locked;
@property() v8::Handle<v8::Object> process_l;
@property() NSTimer* timer;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
	self.locked = true;

	//
	// IMPORTANT: DO NOT SET THIS RESOLUTION TIME LOWER THAN 0.0156 (preferably 0.016 ~ 60fps),
	//
	// See NSTimer class for more information. The tolerance can be adjusted but is safe at checking
	// the event loop every 0.016 + 0.100 seconds.  Node requires a high-resolution timer for server event loops, however it
	// indirectly reduces battery life of laptops considerably while running.  We are forcing the UV/CF event
	// loop into the recommended Apple "maximum" timer and can back off when in energy savings mode to
	// act like other normal NSApplication's. Setting this lower than 0.0156 or setting the tolerance lower
	// than 0.1 will cause significant (est. 3~5%) performance drop and lesser battery life.
	// If you need a higher timer res, use NSOpenGL views and a seperate shared memory process to render
	// to the rect specified by the app, then immediately shutdown. Note: any native webviews use their own
	// timers, any webkit related javascript/webgl is not subject to this rule.
	self.timer = [NSTimer scheduledTimerWithTimeInterval:0.0156
																										target:self
																									selector:@selector(helperTimer)
																									userInfo:nil
																									 repeats:true];
	//[self.timer setTolerance:0.0016];
	// Create all the objects, load modules, do everything.
	// so your next reading stop should be node::Load()!
	node::Load(self.process_l);
	self.locked = false;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	self.locked = true;
	[self.timer invalidate];
	node::EmitExit(_process_l);
}

- (void) helperTimer {
	if(self.locked) return;
	self.locked = true;
	uv_run(uv_default_loop(), UV_RUN_NOWAIT);

	self.locked = false;
}
@end

static char **copy_argv(int argc, char **argv) {
	size_t strlen_sum;
	char **argv_copy;
	char *argv_data;
	size_t len;
	int i;

	strlen_sum = 0;
	for(i = 0; i < argc; i++) {
		strlen_sum += strlen(argv[i]) + 1;
	}

	argv_copy = (char **) malloc(sizeof(char *) * (argc + 1) + strlen_sum);
	if (!argv_copy) {
		return NULL;
	}

	argv_data = (char *) argv_copy + sizeof(char *) * (argc + 1);

	for(i = 0; i < argc; i++) {
		argv_copy[i] = argv_data;
		len = strlen(argv[i]) + 1;
		memcpy(argv_data, argv[i], len);
		argv_data += len;
	}

	argv_copy[argc] = NULL;

	return argv_copy;
}

int main(int argc, char * argv[]) {
	NSApplication *app = [NSApplication sharedApplication];
	AppDelegate *delegate = [[AppDelegate alloc] init];
	argv = uv_setup_args(argc, argv);

	init_argc = argc;
	init_argv = copy_argv(argc, argv);

	// This needs to run *before* V8::Initialize()
	node::Init(init_argc, init_argv);

	v8::V8::Initialize();
	{
		v8::Locker locker;
		v8::HandleScope handle_scope;

		// Create the one and only Context.
		v8::Persistent<v8::Context> context = v8::Context::New();
		v8::Context::Scope context_scope(context);

		// Use original argv, as we're just copying values out of it.
		delegate.process_l = node::SetupProcessObject(init_argc, init_argv);
		v8_typed_array::AttachBindings(context->Global());

		[app setDelegate:delegate];
		[app setActivationPolicy:NSApplicationActivationPolicyAccessory];
		[app run];
#ifndef NDEBUG
		context.Dispose();
#endif
	}

#ifndef NDEBUG
	// Clean up. Not strictly necessary.
	v8::V8::Dispose();
#endif  // NDEBUG
}
