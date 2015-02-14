#include "node.cc" // this is a hack to get at node's internal globals.
#include <tint_version.h>

#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>

#include "../AppSchema/AppSchema_mac.h"
#include "../Bridge/nan.h"

#include <sys/types.h>
#include <sys/event.h>
#include <sys/time.h>

static bool packaged = false;
static int embed_closed = 0;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;
static int code;

namespace REF {
  extern void Init (v8::Handle<v8::Object> target);
}

namespace FFI {
  extern void Init(v8::Handle<v8::Object> target);
}

v8::Handle<v8::Object> process_l;
node::Environment *env;

NAN_METHOD(InitBridge) {
    NanScope();
    v8::Local<v8::Object> bridge = NanNew<v8::Object>();
    process_l->ForceSet(NanNew<v8::String>("bridge"), bridge);
    FFI::Init(bridge);
    REF::Init(bridge);
    NanReturnValue(NanNew<v8::Object>());
}


static void uv_noop(uv_async_t* handle, int status) {}

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
      bool more = uv_run(env->event_loop(), UV_RUN_NOWAIT);
      if (more == false) {
        EmitBeforeExit(env);
        // Emit `beforeExit` if the loop became alive either after emitting
        // event, or after running some callbacks.
        more = uv_loop_alive(env->event_loop());
        if (uv_run(env->event_loop(), UV_RUN_NOWAIT) != 0)
          more = true;
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

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
  [[NSThread currentThread] setName:@"Tint EventLoop"];

  process_l = env->process_object();

  // Register the app:// protocol.
  [NSURLProtocol registerClass:[AppSchema class]];

  // Register the initial bridge objective-c protocols
  NODE_SET_METHOD(process_l, "initbridge", InitBridge);

  // Set Version Information
  process_l->Get(NanNew<v8::String>("versions"))->ToObject()->Set(NanNew<v8::String>("tint"), NanNew<v8::String>(TINT_VERSION));
  process_l->Set(NanNew<v8::String>("packaged"), NanNew<v8::Boolean>(packaged));

  // Start debug agent when argv has --debug
  if (node::use_debug_agent)
    node::StartDebug(env, node::debug_wait_connect);

  node::LoadEnvironment(env);

  // Enable debugger
  if (node::use_debug_agent)
    node::EnableDebug(env);

  // Start worker that will interrupt main loop when having uv events.
  // keep the UV loop in-sync with CFRunLoop.
  embed_closed = 0;

  uv_sem_init(&embed_sem, 0);
  uv_thread_create(&embed_thread, uv_event, NULL);
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
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

int main(int argc, char * argv[]) {
  NSApplication *app = [NSApplication sharedApplication];
  AppDelegate *delegate = [[AppDelegate alloc] init];
  NSBundle *bundle = [NSBundle mainBundle];
  NSString *package = [bundle pathForResource:@"package" ofType:@"json"];
  NSString *identifier = [bundle bundleIdentifier];
  if(package && identifier) {
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

  const char* replaceInvalid = getenv("NODE_INVALID_UTF8");

  if (replaceInvalid == NULL)
    node::WRITE_UTF8_FLAGS |= v8::String::REPLACE_INVALID_UTF8;

  // Try hard not to lose SIGUSR1 signals during the bootstrap process.
  node::InstallEarlyDebugSignalHandler();

  assert(init_argc > 0);

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

  v8::V8::Initialize();
  node::node_is_initialized = true;
  {
    v8::Locker locker(node::node_isolate);
    v8::Isolate::Scope isolate_scope(node::node_isolate);
    v8::HandleScope handle_scope(node::node_isolate);
    v8::Local<v8::Context> context = v8::Context::New(node::node_isolate);
    env = node::CreateEnvironment(
      node::node_isolate,
      uv_default_loop(),
      context,
      init_argc,
      init_argv,
      exec_argc,
      exec_argv);
    v8::Context::Scope context_scope(context);

    [app setDelegate:delegate];
    [app setActivationPolicy:NSApplicationActivationPolicyAccessory];
    [app run];

    env->Dispose();
    env = NULL;
  }

  CHECK_NE(node::node_isolate, NULL);
  node::node_isolate->Dispose();
  node::node_isolate = NULL;
  v8::V8::Dispose();

  delete[] exec_argv;
  exec_argv = NULL;

  return code;
}
