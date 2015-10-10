#include "node.cc" // this is a hack to get at node's internal globals.
#include <tint_version.h>
#include <gtk/gtk.h>
#include <nan.h>
#include "../libraries/gir/src/namespace_loader.h"

#include <sys/types.h>
#include <sys/epoll.h>
#include <sys/time.h>

static bool packaged = false;
static int embed_closed = 0;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;
static int code;
static GtkApplication *app;

namespace REF {
  extern void Init (v8::Handle<v8::Object> target);
}

namespace FFI {
  extern void Init(v8::Handle<v8::Object> target);
}

v8::Handle<v8::Object> process_l;
v8::Handle<v8::Object> gobj;
node::Environment *env;

NAN_METHOD(InitBridge) {
  v8::Local<v8::Object> bridge = Nan::New<v8::Object>();
  gobj = Nan::New<v8::Object>();
  process_l->ForceSet(Nan::New<v8::String>("bridge").ToLocalChecked(), bridge);
  bridge->ForceSet(Nan::New<v8::String>("gir").ToLocalChecked(), gobj);
  FFI::Init(bridge);
  REF::Init(bridge);
  Nan::Set(gobj, Nan::New("load").ToLocalChecked(),
      Nan::GetFunction(Nan::New<v8::FunctionTemplate>(gir::NamespaceLoader::Load)).ToLocalChecked());
  Nan::Set(gobj, Nan::New("search_path").ToLocalChecked(),
      Nan::GetFunction(Nan::New<v8::FunctionTemplate>(gir::NamespaceLoader::SearchPath)).ToLocalChecked());
  info.GetReturnValue().Set(Nan::New<v8::Object>());
}

static bool uv_trip_timer_safety = false;
static gboolean uv_pump(gpointer user_data) {
  if (uv_run(env->event_loop(), UV_RUN_NOWAIT) == false && 
      uv_loop_alive(env->event_loop()) == false) {
    EmitBeforeExit(env);
    uv_trip_timer_safety = true;
  }
  uv_sem_post(&embed_sem);
  return false;
}

static void uv_event(void * info) {
  int epoll_ = epoll_create(1);
  int backend_fd = uv_backend_fd(env->event_loop());
  int r;
  struct epoll_event ev;
  ev.events = EPOLLIN;
  ev.data.fd = backend_fd;
  epoll_ctl(epoll_, EPOLL_CTL_ADD, backend_fd, &ev);

  while (!embed_closed) {
    do {
      struct epoll_event ev;
      int timeout = uv_backend_timeout(env->event_loop());
      if(timeout < 0) {
        timeout = 16;
      } else if (timeout > 250) {
        timeout = 250;
      } else if (timeout == 0 && uv_trip_timer_safety) {
        timeout = 150;
        uv_trip_timer_safety = false;
      }
      r = epoll_wait(epoll_, &ev, 1, timeout);
    } while (r == -1 && errno == EINTR);

    g_idle_add(uv_pump, NULL);

    // Wait for the main loop to deal with events.
    uv_sem_wait(&embed_sem);
  }
}


static void startup (GtkApplication* app, gpointer user_data)
{
  process_l = env->process_object();

  // Register the app:// protocol.
  // TODO: register the gtk app protocol.

  // Register the initial bridge objective-c protocols
  Nan::SetMethod(process_l, "initbridge", InitBridge);

  // Set Version Information
  process_l->Get(Nan::New<v8::String>("versions").ToLocalChecked())->ToObject()->Set(Nan::New<v8::String>("tint").ToLocalChecked(), Nan::New<v8::String>(TINT_VERSION).ToLocalChecked());
  process_l->Set(Nan::New<v8::String>("packaged").ToLocalChecked(), Nan::New<v8::Boolean>(packaged));

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

static gint gtk_command_line_cb (GApplication *app, GApplicationCommandLine *cmd, gpointer user_data) {
  return (gint)0;
}

static void deactivate() {
  embed_closed = 1;
  EmitBeforeExit(env);
  // Emit `beforeExit` if the loop became alive either after emitting
  // event, or after running some callbacks.
  if(uv_loop_alive(env->event_loop())) {
    uv_run(env->event_loop(), UV_RUN_NOWAIT);
  }
  EmitExit(env);
  RunAtExit(env);
}

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
  app = gtk_application_new ("org.trueinteractions.tint", G_APPLICATION_HANDLES_COMMAND_LINE);
  g_application_hold(G_APPLICATION (app));
  g_signal_connect (app, "startup", G_CALLBACK (startup), NULL);
  g_signal_connect (app, "shutdown", G_CALLBACK (deactivate), NULL);
  g_signal_connect (app, "command-line", G_CALLBACK(gtk_command_line_cb), NULL);
  /*NSBundle *bundle = [NSBundle mainBundle];
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
  } else {*/
      init_argc = argc;
      init_argv = copy_argv(argc, argv);
  //}

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

    g_application_run (G_APPLICATION (app), argc, argv);
    g_object_unref (app);

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
