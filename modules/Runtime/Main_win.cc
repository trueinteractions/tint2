#include <node.h>
#include <node_javascript.h>
#include <node_string.h>
#include <stdlib.h>
#include <windows.h>
#include "v8_typed_array.h"
#include "uv-common.h"

extern "C" DWORD uv_get_poll_timeout(uv_loop_t* loop);

static int embed_closed;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;

static int init_argc;
static char **init_argv;

v8::Handle<v8::Object> process_l;
v8::Persistent<v8::Object> bridge;

namespace REF {
  extern void Init(v8::Handle<v8::Object> target);
}

extern class FFI {
public:
static void FFI::Init(v8::Handle<v8::Object> target);
};

extern "C" void CLR_Init(v8::Handle<v8::Object> target);

DWORD mainThreadId = 0;

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

void uv_noop(uv_async_t* handle, int status) {}

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
      GetQueuedCompletionStatus(loop->iocp,
                                &bytes,
                                &key,
                                &overlapped,
                                timeout);

      // Give the event back so libuv can deal with it.
      if (overlapped != NULL)
        PostQueuedCompletionStatus(loop->iocp,
                                   bytes,
                                   key,
                                   overlapped);
    }

    {
      assert(PostThreadMessage(mainThreadId, 0x8001 /* magic UV id */, 0, 0));
    }
    uv_sem_wait(&embed_sem);
  }
}

void node_load() {
  //TODO: Register the app:// protocol.

  // Resgiter the initial bridge: C++/C/C# (CLR) dotnet
  NODE_SET_METHOD(process_l, "initbridge", init_bridge);

  // Load node and begin processing.
  node::Load(process_l);

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
}

void uv_run_nowait() {
  uv_run(uv_default_loop(), UV_RUN_NOWAIT);
  uv_sem_post(&embed_sem);
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

void win_msg_loop() {
  MSG msg;
  BOOL bRet;
  while((bRet = GetMessage(&msg, NULL, 0, 0)) != 0)
  {
    if (msg.message == WM_QUIT)
      break;
    else if(msg.message == 0x8001)
      uv_run_nowait();
    else { //TODO: if (!TranslateAccelerator(msg.hwnd ?? , hAccelTable ?? , &msg))
       TranslateMessage(&msg);
       DispatchMessage(&msg);
    }
  }
  fprintf(stderr, "terminating: bRet: %i, last msg.message: %i\n",bRet,msg.message);
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

