// In order to use vista+ items within node and friends
// we need to declare our intent to specifically (only)
// support vista+, otherwise libcares and other libraries
// will set this down to XP and we will not have common libs.
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0600
#endif

#include "win/req-inl.h" // this must be included before node is.
#include "node.cc" // this is a hack to get at node's internal globals.
#include <stdlib.h>
#include <io.h>
#include <fcntl.h>
#include <windows.h>
#include <nan.h>
#if HAVE_OPENSSL
# include "node_crypto.h"
#endif
#include <tint_version.h>

static bool packaged = false;
static int embed_closed = 0;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;
static int code;

v8::Handle<v8::Object> process_l;
v8::Handle<v8::Object> bridge;
node::Environment *env;

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

NAN_METHOD(InitBridge) {
  NanScope();
  v8::Local<v8::Object> bridge = NanNew<v8::Object>();
  process_l->ForceSet(NanNew<v8::String>("bridge"), bridge);
  FFI::Init(bridge);
  REF::Init(bridge);
  CLR_Init(bridge);
  NanReturnValue(NanNew<v8::Object>());
}

static bool uv_trip_winproc_safety = false;
static bool uv_trip_timer_safety = false;
void uv_event(void *info) {
  while (!embed_closed) {
    // Unlike Unix, in which we can just rely on one backend fd to determine
    // whether we should iterate libuv loop, on Window, IOCP is just one part
    // of the libuv loop, we should also check whether we have other types of
    // events.
    uv_loop_t* loop = env->event_loop();
    bool block = loop->idle_handles == NULL &&
                 loop->pending_reqs_tail == NULL &&
                 loop->endgame_handles == NULL &&
                 !loop->stop_flag &&
                 (loop->active_handles > 0 || !uv__has_active_reqs(loop));

    // When there is no other types of events, we block on the IOCP.
    // Until node 12 there is no successful way of polling for timeouts
    // on a seperate thread, we'll reset to 15ms (safe for energy use)
    // if we're blocking on the loop and an infinite wait is requested.
    if (block) {
      OVERLAPPED_ENTRY overlappeds[128];
      ULONG count;

      DWORD timeout = uv_backend_timeout(loop);
      if(timeout == INFINITE) {
        timeout = 16;
      } else if (timeout > 250) {
        timeout = 250;
      } else if (timeout == 0 && uv_trip_timer_safety) {
        timeout = 150;
        uv_trip_timer_safety = false;
      }

      BOOL success = GetQueuedCompletionStatusEx (loop->iocp, overlappeds, ARRAY_SIZE(overlappeds), &count, timeout, FALSE);
      if (success) {
        for (ULONG i = 0; i < count; i++) {
          /* Package was dequeued */
          uv_req_t* req = uv_overlapped_to_req(overlappeds[i].lpOverlapped);
          uv_insert_pending_req(loop, req);
        }
      } else if (GetLastError() != WAIT_TIMEOUT) {
        /* Serious error */
        fprintf(stderr,"GetQueuedCompletionStatusEx Error!\n");
        abort();
      }
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

    // This is in place to act as a safety valve before we begin waiting.
    // If the postmessage is collected by a rogue handler (such as winforms)
    // this forces the main loop to run the next time any event is processed, 
    // it reset back to false when the event loop executes. If we don't have this 
    // placed after postmessage or if we remove postmessage we take up 
    // extrenous CPU.  This is a fail safe, it must be right here before 
    // semwait.
    uv_trip_winproc_safety = true;
    uv_sem_wait(&embed_sem);
  }
}

void node_load() {
  process_l = env->process_object();
  // Set version Information
  process_l->Get(NanNew<v8::String>("versions"))->ToObject()->Set(NanNew<v8::String>("tint"), NanNew<v8::String>(TINT_VERSION));
  // Set whether we're in a packaged or non-packaged environment.
  process_l->Set(NanNew<v8::String>("packaged"), NanNew<v8::Boolean>(packaged));
  // Register the app:// schema.
  InitAppRequest();
  // Register the initial bridge: C++/C/C# (CLR) dotnet
  NODE_SET_METHOD(process_l, "initbridge", InitBridge);

  // The dummy handle prevents UV from exiting and throwing incorrect
  // timeout values, its necessary since uv can't see many of the app
  // events to keep it assuming something else will come and return -1
  // from uv_backend_timeout.
  uv_async_t dummy_uv_handle_;
  uv_async_init(uv_default_loop(), &dummy_uv_handle_, (uv_async_cb)uv_noop);

  // This must post after the node::Load otherwise we will get infinte
  // timeouts from libuv and if there isn't file descirptor setup yet
  // the entire thing will simply never wake back up.
  embed_closed = 0;
  
  uv_sem_init(&embed_sem, 0);
  uv_thread_create(&embed_thread, uv_event, NULL);

  // Start debug agent when argv has --debug
  if (node::use_debug_agent) {
    node::StartDebug(env, node::debug_wait_connect);
  }

  node::LoadEnvironment(env);

  // Enable debugger
  if (node::use_debug_agent) {
    node::EnableDebug(env);
  }

}

// Externalize this, if we've completely blocked the event loop
// and need to manually pump uv messages (e.g., WPF took over the
// loop due to a blocking OS reason)
extern "C" void uv_run_nowait() {
  if (uv_run(env->event_loop(), UV_RUN_NOWAIT) == false && 
      uv_loop_alive(env->event_loop()) == false) 
  {
    EmitBeforeExit(env);
    uv_trip_timer_safety = true;
  }
  uv_sem_post(&embed_sem);
}

void node_terminate() {
  embed_closed = 1;
  EmitBeforeExit(env);
  // Emit `beforeExit` if the loop became alive either after emitting
  // event, or after running some callbacks.
  if(uv_loop_alive(env->event_loop())) {
    uv_run(env->event_loop(), UV_RUN_NOWAIT);
  }
  code = EmitExit(env);
  RunAtExit(env);
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
    if (msg.message == WM_HOTKEY) {
      v8::Isolate *isolate = env->isolate();
      v8::HandleScope scope(isolate);
      v8::Handle<v8::Value> tmp = process_l->Get(NanNew<v8::String>("_win32_message"));
      if(tmp->IsFunction()) {
        v8::Local<v8::Value> args[2];
        args[0] = NanNew<v8::Number>(MapVirtualKeyW(msg.lParam >> 16, MAPVK_VK_TO_CHAR));
        args[1] = NanNew<v8::Number>(msg.lParam & 0x00ff);
        v8::Local<v8::Function> fn = tmp.As<v8::Function>();
        v8::TryCatch try_catch;
        fn->Call(isolate->GetCurrentContext()->Global(), 2, args);
        if (try_catch.HasCaught()) {
          node::FatalException(try_catch);
        }
      }
    }
    if(uv_trip_winproc_safety == true || msg.message == WM_APP+1) {
      uv_run_nowait();
      uv_trip_winproc_safety = false;
    }
    if(bRet == -1) {
      fprintf(stderr, "FATAL ERROR: %i\n",bRet);
      exit(1);
    } else {
       TranslateMessage(&msg);
       DispatchMessage(&msg);
    }
  }

  // Received WM_QUIT
  node_terminate();
}

// This is the general entry point for everything when /subsystem:console, 
// when executed its possible we came in through WinMain and it called us
// after initializing the arguments.
int main(int argc, char *argv[]) {
  init_argc = argc;
  init_argv = copy_argv(argc, argv);

  mainThreadId = GetCurrentThreadId();

  const char* replaceInvalid = getenv("NODE_INVALID_UTF8");

  if (replaceInvalid == NULL) {
    node::WRITE_UTF8_FLAGS |= v8::String::REPLACE_INVALID_UTF8;
  }

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

    node_load();
    win_msg_loop();

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


// This entry point assumes that we're a GUI application and not being executed from
// the command prompt.  In this case we'll assign the argc, argv values to the built
// in package and let the main() entry point load as if its being executed normally.
int __stdcall WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
  // TODO: Clean this up, it works but is really ugly and may have unnecessary computations
  //       and memory hits.
  char cwBuffer[2048] = { 0 };
  char cwBase[2048] = { 0 };
  LPSTR package = cwBuffer;
  LPSTR basePath = cwBase;
  DWORD dwMaxChars = _countof(cwBuffer);
  DWORD dwLength = ::GetModuleFileName(NULL, package, dwMaxChars);
  unsigned i = dwLength;

  while(package[i] != '\\')
    i--;

  package[i++] = '\\';
  package[i++] = 'R';
  package[i++] = 'e';
  package[i++] = 's';
  package[i++] = 'o';
  package[i++] = 'u';
  package[i++] = 'r';
  package[i++] = 'c';
  package[i++] = 'e';
  package[i++] = 's';
  package[i++] = '\\';
  package[i++] = 'p';
  package[i++] = 'a';
  package[i++] = 'c';
  package[i++] = 'k';
  package[i++] = 'a';
  package[i++] = 'g';
  package[i++] = 'e';
  package[i++] = '.';
  package[i++] = 'j';
  package[i++] = 's';
  package[i++] = 'o';
  package[i++] = 'n';
  package[i] = NULL;

  DWORD h = GetFileAttributesA(package);

  // If we cannot find the package.json file relative to the
  // executable error out.
  if(h == INVALID_FILE_ATTRIBUTES) {
    // Don't bother printing an error, we don't have a
    // console to error to anyway.
    exit(1);
  }

  strcpy(basePath, package);
  i = strlen(package);
  while(basePath[i] != '\\')
    i--;
  basePath[i] = '\\';
  basePath[i+1] = NULL;

  char buffer[2048] = {0};
  char mainPackage[1024] = {0};
  int j=0;
  DWORD lpNumberOfBytesRead = 2048;

  FILE* handle = fopen(package, "r");
  lpNumberOfBytesRead = fread(buffer, sizeof(char), lpNumberOfBytesRead, handle);
  fclose(handle);

  // Search for main entry in package.json, note that we do not have a compotent 
  // JSON deserializer in Windows, and unfortunately cannot use V8's as its internal.
  while(i < lpNumberOfBytesRead && buffer[i] != NULL &&
    strncmp("\"main\"", &buffer[i], 6) != 0 &&
    strncmp("'main'", &buffer[i], 6) != 0) 
      i++;

  // If we cannot find the main entry in package.json, error out.
  if(i == lpNumberOfBytesRead-1) {
    // Don't bother printing an error, we don't have a
    // console to error to anyway.
    exit(2);
  }

  i = i + 6;

  while(i < lpNumberOfBytesRead && 
    (buffer[i] != '\'' && buffer[i] != '\"'))
      i++;

  i++;

  while(i < lpNumberOfBytesRead && j < 1024 && 
    (buffer[i] != '\'' && buffer[i] != '\"' )) 
  {
    if(buffer[i] == '/') mainPackage[j] = '\\';
    else mainPackage[j] = buffer[i];
    j++;
    i++;
  }
  mainPackage[j] = NULL;

  dwLength = ::GetModuleFileName(NULL, package, dwMaxChars);
  strcat(basePath, mainPackage);

  unsigned int exec_len = strlen(package) + 1;
  unsigned int main_len = strlen(basePath) + 1;
  unsigned int buf_len = sizeof(char *) * 2;
  char **p_argv = (char **)malloc(exec_len + main_len + buf_len);
  char *base = (char *)p_argv;
  p_argv[0] = (char *)(base + buf_len);
  p_argv[1] = (char *)(base + buf_len + exec_len);
  strncpy(p_argv[0], package, exec_len);
  strncpy(p_argv[1], basePath, main_len);

  packaged = true;

  return main(2, p_argv);
}



