
#include <node.h>
#include <node_javascript.h>
#include <node_string.h>
#include <stdlib.h>
#include <windows.h>

#include "v8_typed_array.h"

//TODO: Find a better way of doing this instead of "trusting"
//that this private interface signature will remain the same.
extern "C" DWORD uv_get_poll_timeout(uv_loop_t* loop);
#define uv__has_active_reqs(loop) (ngx_queue_empty(&(loop)->active_reqs) == 0)

static int embed_closed;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;

v8::Handle<v8::Object> process_l;
v8::Persistent<v8::Object> bridge;
DWORD mainThreadId = 0;


extern "C" void InitAppRequest();

namespace REF {
  extern void Init(v8::Handle<v8::Object> target);
}

class FFI {
  public:
    static void FFI::Init(v8::Handle<v8::Object> target);
};

extern "C" void CLR_Init(v8::Handle<v8::Object> target);
void uv_noop(uv_async_t* handle, int status) {}

v8::Handle<v8::Value> init_bridge(const v8::Arguments& args) {
  v8::HandleScope scope;
  v8::Local<v8::FunctionTemplate> bridge_template = v8::FunctionTemplate::New();
  bridge_template->SetClassName(v8::String::NewSymbol("bridge"));
  bridge = v8::Persistent<v8::Object>::New(bridge_template->GetFunction()->NewInstance());
  process_l->Set(v8::String::NewSymbol("bridge"), bridge);
  FFI::Init(bridge);
  REF::Init(bridge);
  CLR_Init(bridge);
  

  return v8::Object::New();
}

void uv_event(void *info) {

  uv_loop_t* loop = uv_default_loop();

  while (!embed_closed) {
    // Unlike Unix, in which we can just rely on one backend fd to determine
    // whether we should iterate libuv loop, on Window, IOCP is just one part
    // of the libuv loop, we should also check whether we have other types of
    // events.
    bool block = loop->idle_handles == NULL &&
                 loop->pending_reqs_tail == NULL &&
                 loop->endgame_handles == NULL &&
                 !loop->stop_flag &&
                 (loop->active_handles > 0 ||
                  !uv__has_active_reqs(loop));

    // When there is no other types of events, we block on the IOCP.
    if (block) {
      DWORD bytes, timeout;
      ULONG_PTR key;
      OVERLAPPED* overlapped;
      timeout = uv_get_poll_timeout(loop);
      
      // Do not indefinately block, set the timeout to a reasonably low
      // value below the threshold of IO timing out, but not so low it
      // causes power consumption issues on mobile devices. If higher than
      // 1s, reset it back, just in case.
      if(timeout < 0) timeout = 250;
      else if(timeout > 1000) timeout = 1000;
      
      GetQueuedCompletionStatus(loop->iocp, &bytes, &key, &overlapped, timeout);

      // Give the event back so libuv can deal with it.
      if (overlapped != NULL)
        PostQueuedCompletionStatus(loop->iocp, bytes, key, overlapped);
    }

    // This may seem obsurd to both broadcast a message and 
    // post it to the main thread, however if a window is 
    // is using a subframe without a proper hook (e.g.,) blocking
    // our event loop we need to broadcast it, the thread post fails
    // when this happens.  Vise versa, a message loop without a HWND
    // does not receive HWND_BROADCASTS. ONE OF THESE SHOULD ALWAYS
    // FAIL.  In practice (Vista,7,8,8.1) these did not produce
    // duplicate messages so we'll avoid the check for one of them
    // failing.
    PostMessage(HWND_BROADCAST, WM_APP+1, 0, 0);
    PostThreadMessage(mainThreadId, WM_APP+1 /* magic UV id */, 0, 0);

    uv_sem_wait(&embed_sem);
  }
}

void node_load() {
  //TODO: Register the app:// protocol.
  //http://msdn.microsoft.com/en-us/library/1f6c88af(v=vs.110).aspx
  //http://msdn.microsoft.com/en-us/library/system.net.webrequest.registerprefix(v=vs.110).aspx
  //http://msdn.microsoft.com/en-us/library/system.uri(v=vs.110).aspx
  InitAppRequest();

  // Register the initial bridge: C++/C/C# (CLR) dotnet
  NODE_SET_METHOD(process_l, "initbridge", init_bridge);

  // Start worker that will interrupt main loop when having uv events.
  // keep the UV loop in-sync with windows message loop.
  embed_closed = 0;

  // The dummy handle prevents UV from exiting and throwing incorrect
  // timeout values, its necessary since uv can't see many of the app
  // events to keep it assuming something else will come and return -1
  // from uv_backend_timeout.
  uv_async_t dummy_uv_handle_;
  uv_async_init(uv_default_loop(), &dummy_uv_handle_, uv_noop);
  uv_sem_init(&embed_sem, 0);
  uv_thread_create(&embed_thread, uv_event, NULL);

  // Load node and begin processing.
  node::Load(process_l);
}

// Externalize this, if we've completely blocked the event loop
// and need to manually pump uv messages (e.g., WPF took over the
// loop due to a blocking OS reason)
extern "C" void uv_run_nowait() {
  uv_run(uv_default_loop(), UV_RUN_NOWAIT);
}

void node_terminate() {
  node::EmitExit(process_l);
  embed_closed = 1;
  uv_sem_post(&embed_sem);
  uv_run(uv_default_loop(), UV_RUN_ONCE);
  uv_thread_join(&embed_thread);
  uv_sem_destroy(&embed_sem);
}

static char **copy_argv(int argc, char **argv) {
  size_t strlen_sum;
  char **argv_copy;
  char *argv_data;
  size_t len;
  int i;

  strlen_sum = 0;
  for(i = 0; i < argc; i++)
    strlen_sum += strlen(argv[i]) + 1;

  argv_copy = (char **) malloc(sizeof(char *) * (argc + 1) + strlen_sum);
  if (!argv_copy)
    return NULL;

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

void win_msg_loop() {
  MSG msg;
  BOOL bRet;

  while((bRet = GetMessage(&msg, NULL, 0, 0)) != 0)
  {
    if(bRet == -1) {
      fprintf(stderr, "FATAL ERROR: %i\n",bRet);
      exit(1);
    } else if(msg.message == WM_APP+1)
      uv_run_nowait();
    else { //TODO: if (!TranslateAccelerator(msg.hwnd ?? , hAccelTable ?? , &msg))
       TranslateMessage(&msg);
       DispatchMessage(&msg);
    }

    // Its entirely possible that an intended message to wake up
    // the thread was missed due to the transition from cmd->win32 mode
    // or win32->wpf window mode, etc, etc. Go ahead and release the 
    // semaphore as its safe to assume uv_run_nowait above finished, and
    // harmless if it didn't run.
    uv_sem_post(&embed_sem);
  }

  // Received WM_QUIT
  node_terminate();
  exit(0);
}

int main(int argc, char *argv[]) {
  argv = uv_setup_args(argc, argv);
  init_argc = argc;
  init_argv = copy_argv(argc, argv);
  mainThreadId = GetCurrentThreadId();

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
    node_load();
    win_msg_loop();
#ifndef NDEBUG
    context.Dispose();
#endif
  }
#ifndef NDEBUG
  // Clean up. Not strictly necessary.
  v8::V8::Dispose();
#endif
}

