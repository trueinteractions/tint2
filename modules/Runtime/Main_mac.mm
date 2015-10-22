#include "node.cc" // this is a hack to get at node's internal globals.
#include <tint_version.h>

#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>

#include "../AppSchema/AppSchema_mac.h"
#include <nan.h>

#include <sys/types.h>
#include <sys/event.h>
#include <sys/time.h>
#include <libproc.h>

static bool packaged = false;
static int embed_closed = 0;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;
static int code;
static const char *purl;
static node::NodeInstanceData *node_instance;

namespace REF {
  extern void Init (v8::Handle<v8::Object> target);
}

namespace FFI {
  extern void Init(v8::Handle<v8::Object> target);
}

v8::Handle<v8::Object> process_l;
node::Environment *env;

NAN_METHOD(InitBridge) {
  v8::Local<v8::Object> bridge = Nan::New<v8::Object>();
  process_l->ForceSet(Nan::New<v8::String>("bridge").ToLocalChecked(), bridge);
  FFI::Init(bridge);
  REF::Init(bridge);
  info.GetReturnValue().Set(Nan::New<v8::Object>());
}

static void openURL(const char *url) {
  purl = url;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.3 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    Nan::HandleScope scope;
    if( !process_l->Get(Nan::New<v8::String>("_osevents").ToLocalChecked())->IsUndefined() &&
        !process_l->Get(Nan::New<v8::String>("_osevents").ToLocalChecked())->IsNull())
    {
      v8::Local<v8::Value> args[1];
      Nan::Callback* osevents = new Nan::Callback(process_l->Get(Nan::New<v8::String>("_osevents").ToLocalChecked()).As<v8::Function>());
      args[0] = Nan::New<v8::String>(purl).ToLocalChecked();
      v8::TryCatch try_catch;
      osevents->Call(1, args);
      if (try_catch.HasCaught()) {
        v8::Handle<v8::Value> stack = try_catch.Exception()->ToObject()->Get(Nan::New<v8::String>("stack").ToLocalChecked());
        if(stack->IsString()) {
          v8::String::Utf8Value utf8exception(stack->ToString());
          NSLog(@"%@", [[NSString alloc] initWithUTF8String:(*utf8exception)]);
          NSLog(@"%@",[NSThread callStackSymbols]);
        }
      }
    }
    v8::Handle<v8::Array> events = process_l->Get(Nan::New<v8::String>("_pending_osevents").ToLocalChecked()).As<v8::Array>();
    events->Set(events->Length(), Nan::New<v8::String>(purl).ToLocalChecked());
  });
}

static bool uv_trip_timer_safety = false;
static void uv_event(void *info) {
  [[NSThread currentThread] setName:@"Tint EventLoop Watcher"];

  int r, timeout, fd;
  struct kevent errors[1];
  while (!embed_closed) {
    uv_update_time(env->event_loop());
    fd = uv_backend_fd(env->event_loop());
    timeout = uv_backend_timeout(env->event_loop());
    
    if(timeout < 0) 
      timeout = 16;
    else if (timeout > 250)
      timeout = 250;
    else if (timeout == 0 && uv_trip_timer_safety) {
      timeout = 150;
      uv_trip_timer_safety = false;
    }
    do {
      struct timespec ts;
      ts.tv_sec = timeout / 1000;
      ts.tv_nsec = (timeout % 1000) * 1000000;
      r = kevent(fd, NULL, 0, errors, 1, &ts);
    } while (r == -1 && errno == EINTR);

    // Do not block this thread, place uv callbacks on the main thread, 
    // then repost the semaphore to allow us to continue. Note, we've
    // taken care of the timeout, so never use UV_RUN_ONCE or UV_RUN_DEFAULT.
    dispatch_async(dispatch_get_main_queue(), ^{
      v8::platform::PumpMessageLoop(node::default_platform, node::node_isolate);
      if (uv_run(env->event_loop(), UV_RUN_NOWAIT) == false && 
          uv_loop_alive(env->event_loop()) == false) {
        EmitBeforeExit(env);
        uv_trip_timer_safety = true;
      }
      uv_sem_post(&embed_sem);
    });

    // Wait for the main loop to deal with events.
    uv_sem_wait(&embed_sem);
  }
}


@interface AppDelegate : NSObject <NSApplicationDelegate>
@end

@implementation AppDelegate
- (void)handleURLEvent:(NSAppleEventDescriptor*)event withReplyEvent:(NSAppleEventDescriptor*)replyEvent
{
  NSString* url = [[event paramDescriptorForKeyword:keyDirectObject] stringValue];
  [url retain];
  openURL([url UTF8String]);
}

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification {
  // Inform apple's event manager of our delegate callback for
  // OS-level events.
  [[NSAppleEventManager sharedAppleEventManager]
    setEventHandler:self
        andSelector:@selector(handleURLEvent:withReplyEvent:)
      forEventClass:kInternetEventClass
         andEventID:kAEGetURL];
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
  // define the NSThread so we can see it in our debugger
  [[NSThread currentThread] setName:@"Tint EventLoop"];

  // Register the initial bridge objective-c protocols
  Nan::SetMethod(process_l, "initbridge", InitBridge);

  // Register the app:// protocol.
  [NSURLProtocol registerClass:[AppSchema class]];

  // Start debug agent when argv has --debug
  if (node_instance->use_debug_agent())
    node::StartDebug(env, node::debug_wait_connect);

  node::LoadEnvironment(env);
  
  env->set_trace_sync_io(node::trace_sync_io);

  // Enable debugger
  if (node_instance->use_debug_agent())
      EnableDebug(env);


  // Start worker that will interrupt main loop when having uv events.
  // keep the UV loop in-sync with CFRunLoop.
  embed_closed = 0;
  uv_sem_init(&embed_sem, 0);
  uv_thread_create(&embed_thread, uv_event, nullptr);
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)app hasVisibleWindows:(BOOL) flag {
  return YES;
}

- (void)application:(NSApplication *)sender openFiles:(NSArray *)filenames {
  for(unsigned int i=0; i < [filenames count]; i++) {
    NSString *nsurl = (NSString *)[filenames objectAtIndex:i];
    // prevent open events from hearing about our passed in at script time argument.
    if(init_argc > 1 && strncmp(init_argv[1], [nsurl UTF8String], strlen(init_argv[1])) == 0)
      break;
    [nsurl retain];
    openURL([nsurl UTF8String]);
  }
}

- (BOOL)application:(NSApplication *)theApplication openFile:(NSString *)filename {
  [filename retain];
  openURL([filename UTF8String]);
  return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
  embed_closed = 1;
  EmitBeforeExit(env);
  // Emit `beforeExit` if the loop became alive either after emitting
  // event, or after running some callbacks.
  if(uv_loop_alive(env->event_loop())) {
    v8::platform::PumpMessageLoop(node::default_platform, node::node_isolate);
    uv_run(env->event_loop(), UV_RUN_NOWAIT);
  }
  EmitExit(env);
  RunAtExit(env);
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

int is_the_parent_trusted() {
  char path_parent[1024];
  char path_us[1024];
  int parent_len = proc_pidpath(getppid(), path_parent, sizeof(path_parent));
  int us_len = proc_pidpath(getpid(), path_us, sizeof(path_us));
  if (parent_len < 1024 && 
      parent_len > 0 && 
      parent_len == us_len && 
      strncmp(path_parent, path_us, parent_len) == 0) 
  {
    return 1;
  } else {
    return 0;
  }
}

int main(int argc, char * argv[]) {
  NSApplication *app = [NSApplication sharedApplication];
  AppDelegate *delegate = [[AppDelegate alloc] init];
  NSBundle *bundle = [NSBundle mainBundle];
  NSString *package = [bundle pathForResource:@"package" ofType:@"json"];
  NSString *identifier = [bundle bundleIdentifier];

  if(argc > 1 && (strncmp(argv[1], "-X,-v", 5) == 0 || strncmp(argv[1], "-X,--version", 12) == 0)) {
    fprintf(stderr, "%i.%i.%i\n", TINT_MAJOR_VERSION, TINT_MINOR_VERSION, TINT_PATCH_VERSION);
    exit(1);
  }

  // So long as we're not being called by ourselves and were in a 
  // packaged mode, do not allow us to span up with arbitrary arguments
  // passed in via the command line.
  if(package && identifier && is_the_parent_trusted() == 0) {
    NSString *executable = [bundle executablePath];
    NSDictionary *p = [NSJSONSerialization 
                JSONObjectWithData:[NSData dataWithContentsOfFile:package] 
                options:NSJSONReadingMutableContainers 
                error:nil];

    NSString *main = nil;
    for(NSString *key in p) {
      if([key isEqualToString:@"main"]) {
        main =[p valueForKey:key];
        break;
      }
    }

    if(main == nil) {
      fprintf(stderr, "Cannot find main entry within package.json file.\n");
      exit(1);
    }

    main = [[[bundle resourcePath] stringByAppendingString:@"/"] stringByAppendingString:main];

    NSArray *pathComponents = [[NSURL fileURLWithPath:main] pathComponents];
    NSString *path = @"";
    for(NSUInteger i=0; i < ([pathComponents count] - 1); i++) {
      NSString *component = (NSString *)[pathComponents objectAtIndex:i];
      if(component && ![component isEqualToString:@""] && ![component isEqualToString:@"/"]) {
        path = [[path  stringByAppendingString:@"/"] stringByAppendingString:component];
      }
    }

    [[NSFileManager defaultManager] changeCurrentDirectoryPath:path];

    const char *exec = [executable cStringUsingEncoding:NSASCIIStringEncoding];
    const char *pack = [main cStringUsingEncoding:NSASCIIStringEncoding];
    unsigned int exec_len = strlen(exec) + 1;
    unsigned int pack_len = strlen(pack) + 1;
    unsigned int buf_len = sizeof(char *) * 2;
    char **p_argv = (char **)malloc(exec_len + pack_len + buf_len);
    char *base = (char *)p_argv;
    p_argv[0] = (char *)(base + buf_len);
    p_argv[1] = (char *)(base + buf_len + exec_len); // dont add argv.
    strncpy(p_argv[0], exec, exec_len);
    strncpy(p_argv[1], pack, pack_len);
    init_argc = argc = 2;
    init_argv = copy_argv(argc, p_argv);
    packaged = true;
  } else {
    init_argc = argc;
    init_argv = copy_argv(argc, argv);
  }

  node::PlatformInit();

  CHECK_GT(init_argc, 0);

  // Hack around with the argv pointer. Used for process.title = "blah".
  argv = uv_setup_args(init_argc, init_argv);

  // This needs to run *before* V8::Initialize().  The const_cast is not
  // optional, in case you're wondering.
  int exec_argc;
  const char** exec_argv;
  node::Init(&init_argc, const_cast<const char**>(init_argv), &exec_argc, &exec_argv);

  // V8 on Windows doesn't have a good source of entropy. Seed it from
  // OpenSSL's pool.
  v8::V8::SetEntropySource(node::crypto::EntropySource);
  
  const int thread_pool_size = 4;
  node::default_platform = v8::platform::CreateDefaultPlatform(thread_pool_size);
  v8::V8::InitializePlatform(node::default_platform);
  v8::V8::Initialize();

  int exit_code = 1;
  {
    node::NodeInstanceData instance_data(node::NodeInstanceType::MAIN,
                                   uv_default_loop(),
                                   init_argc,
                                   const_cast<const char**>(init_argv),
                                   exec_argc,
                                   exec_argv,
                                   node::use_debug_agent);
    node::Isolate::CreateParams params;
    node::ArrayBufferAllocator* array_buffer_allocator = new node::ArrayBufferAllocator();
    params.array_buffer_allocator = array_buffer_allocator;
    v8::Isolate* isolate = v8::Isolate::New(params);
    if (node::track_heap_objects) {
      isolate->GetHeapProfiler()->StartTrackingHeapObjects(true);
    }

    // Fetch a reference to the main isolate, so we have a reference to it
    // even when we need it to access it from another (debugger) thread.
    if (instance_data.is_main())
      node::node_isolate = isolate;

    {
      v8::Locker locker(isolate);
      v8::Isolate::Scope isolate_scope(isolate);
      v8::HandleScope handle_scope(isolate);
      v8::Local<v8::Context> context = v8::Context::New(isolate);
      env = node::CreateEnvironment(isolate, context, &instance_data);
      array_buffer_allocator->set_env(env);
      v8::Context::Scope context_scope(context);

      process_l = env->process_object();
      process_l->Get(Nan::New<v8::String>("versions").ToLocalChecked())->ToObject()->Set(Nan::New<v8::String>("tint").ToLocalChecked(), Nan::New<v8::String>(TINT_VERSION).ToLocalChecked());
      process_l->Set(Nan::New<v8::String>("packaged").ToLocalChecked(), Nan::New<v8::Boolean>(packaged));
      process_l->Set(Nan::New<v8::String>("_pending_osevents").ToLocalChecked(), Nan::New<v8::Array>());
      process_l->Set(Nan::New<v8::String>("_osevents").ToLocalChecked(), Nan::Null());

      if (instance_data.is_main())
        env->set_using_abort_on_uncaught_exc(node::abort_on_uncaught_exception);

      {
        node::SealHandleScope seal(isolate);
        node_instance = &instance_data;
        [app setDelegate:delegate];
        [app run];
      }

      env->set_trace_sync_io(false);

      int exit_code = node::EmitExit(env);
      if (instance_data.is_main())
        instance_data.set_exit_code(exit_code);
      node::RunAtExit(env);

#if defined(LEAK_SANITIZER)
      __lsan_do_leak_check();
#endif

      array_buffer_allocator->set_env(nullptr);
      env->Dispose();
      env = nullptr;
    }

    CHECK_NE(isolate, nullptr);
    isolate->Dispose();
    isolate = nullptr;
    delete array_buffer_allocator;
    if (instance_data.is_main())
      node::node_isolate = nullptr;
    exit_code = instance_data.exit_code();
  }
  v8::V8::Dispose();
  
  delete node::default_platform;
  node::default_platform = nullptr;

  delete[] exec_argv;
  exec_argv = NULL;

  return code;
}
