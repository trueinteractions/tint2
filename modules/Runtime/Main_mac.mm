#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>
#include <node.h>
#include <node_javascript.h>
#include <node_string.h>
#include "v8_typed_array.h"
#include <stdlib.h>
#include "../AppSchema/AppSchema_mac.h"

namespace node {
	extern v8::Persistent<v8::String> process_symbol;
	extern v8::Persistent<v8::String> domain_symbol;
	extern void InitDTrace(v8::Handle<v8::Object> target);
	extern v8::Local<v8::Value> ExecuteString(v8::Handle<v8::String> source, v8::Handle<v8::Value> filename);
}

extern "C" {
	static void ReportException(v8::TryCatch &try_catch, bool show_line);
}

static int init_argc;
static char **init_argv;
v8::Persistent<v8::Object> bridge;
v8::Persistent<v8::Object> ref;

namespace REF {
	extern void Init (v8::Handle<v8::Object> target);
}

namespace FFI {
	extern void Init(v8::Handle<v8::Object> target);
}

/*
static void AtExit() {
	uv_tty_reset_mode();
}

void LoadTint(v8::Handle<v8::Object> process_l) {
	node::process_symbol = NODE_PSYMBOL("process");
	node::domain_symbol = NODE_PSYMBOL("domain");

	// Compile, execute the src/node.js file. (Which was included as static C
	// string in node_natives.h. 'natve_node' is the string containing that
	// source code.)

	// The node.js file returns a function 'f'
	::atexit(AtExit);

	v8::TryCatch try_catch;

	v8::Local<v8::Value> f_value = node::ExecuteString(node::MainSource(),
																			 IMMUTABLE_STRING("node.js"));
	if (try_catch.HasCaught())  {
		//ReportException(try_catch, true);
		exit(10);
	}
	assert(f_value->IsFunction());
	v8::Local<v8::Function> f = v8::Local<v8::Function>::Cast(f_value);

	// Now we call 'f' with the 'process' variable that we've built up with
	// all our bindings. Inside node.js we'll take care of assigning things to
	// their places.

	// We start the process this way in order to be more modular. Developers
	// who do not like how 'src/node.js' setups the module system but do like
	// Node's I/O bindings may want to replace 'f' with their own function.

	// Add a reference to the global object
	v8::Local<v8::Object> global = v8::Context::GetCurrent()->Global();
	v8::Local<v8::Value> args[1] = { v8::Local<v8::Value>::New(process_l) };

#if defined HAVE_DTRACE || defined HAVE_ETW || defined HAVE_SYSTEMTAP
	node::InitDTrace(global);
#endif

#if defined HAVE_PERFCTR
	node::InitPerfCounters(global);
#endif

	v8::Local<v8::FunctionTemplate> bridge_template = v8::FunctionTemplate::New();
	bridge_template->SetClassName(v8::String::NewSymbol("bridge"));
	bridge = v8::Persistent<v8::Object>::New(bridge_template->GetFunction()->NewInstance());

	v8::Local<v8::FunctionTemplate> ref_template = v8::FunctionTemplate::New();
	ref_template->SetClassName(v8::String::NewSymbol("ref"));
	ref = v8::Persistent<v8::Object>::New(ref_template->GetFunction()->NewInstance());

	process_l->Set(v8::String::NewSymbol("bridge"), bridge);
	bridge->Set(v8::String::NewSymbol("ref"), ref);

	REF::InitConstants(ref);

	f->Call(global, 1, args);

	REF::InitBindings(ref);
	FFI::InitializeBindings(bridge);
	FFI::InitializeStaticFunctions(bridge);
	CallbackInfo::Initialize(bridge);

	if (try_catch.HasCaught())  {
		node::FatalException(try_catch);
	}
}*/
/*

static Handle<Value> Binding(const Arguments& args) {
	HandleScope scope;

	Local<String> module = args[0]->ToString();
	String::Utf8Value module_v(module);
	node_module_struct* modp;

	if (binding_cache.IsEmpty()) {
		binding_cache = Persistent<Object>::New(Object::New());
	}

	Local<Object> exports;

	if (binding_cache->Has(module)) {
		exports = binding_cache->Get(module)->ToObject();
		return scope.Close(exports);
	}

	// Append a string to process.moduleLoadList
	char buf[1024];
	snprintf(buf, 1024, "Binding %s", *module_v);
	uint32_t l = module_load_list->Length();
	module_load_list->Set(l, String::New(buf));

	if ((modp = get_builtin_module(*module_v)) != NULL) {
		exports = Object::New();
		// Internal bindings don't have a "module" object,
		// only exports.
		modp->register_func(exports, Undefined());
		binding_cache->Set(module, exports);

	} else if (!strcmp(*module_v, "constants")) {
		exports = Object::New();
		DefineConstants(exports);
		binding_cache->Set(module, exports);

	} else if (!strcmp(*module_v, "natives")) {
		exports = Object::New();
		DefineJavaScript(exports);
		binding_cache->Set(module, exports);

	} else {

		return ThrowException(Exception::Error(String::New("No such module")));
	}

	return scope.Close(exports);
}

*/

v8::Handle<v8::Object> process_l;

v8::Handle<v8::Value> InitBridge(const v8::Arguments& args) {
	v8::HandleScope scope;

	v8::Local<v8::FunctionTemplate> bridge_template = v8::FunctionTemplate::New();
	bridge_template->SetClassName(v8::String::NewSymbol("bridge"));
	bridge = v8::Persistent<v8::Object>::New(bridge_template->GetFunction()->NewInstance());
	process_l->Set(v8::String::NewSymbol("bridge"), bridge);

	FFI::Init(bridge);
	REF::Init(bridge);

	return v8::Object::New();
}


@interface AppDelegate : NSObject <NSApplicationDelegate>
@property() bool locked;
@property() v8::Handle<v8::Object> process_l;
@property() NSTimer* timer;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
	self.locked = true;

	// Register the app:// protocol.
	[NSURLProtocol registerClass:[AppSchema class]];

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
	NODE_SET_METHOD(process_l, "initbridge", InitBridge);
	node::Load(process_l);

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
		process_l = node::SetupProcessObject(init_argc, init_argv);
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
