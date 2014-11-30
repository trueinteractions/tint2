#include <node.h>
#include <node_javascript.h>
#include <node_string.h>
#include <stdlib.h>
#include <windows.h>
#include <io.h>
#include <fcntl.h>
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
bool uv_trip_safety = false;

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
      
      // libuv needs an accurate time prior to asking for the timeout,
      // it may be more efficient to check if there are timers prior
      // to updating but the cost is so insignificant and not worth the
      // maintenance issues of peaking inside the internals to see.
      uv_update_time(loop);
      timeout = uv_get_poll_timeout(loop);

      // Negative one means infinite timeout here. Resetting to 16 should be fine
      // for performance and energy effeciency (MS docs say it must be 
      // above 15.6 for energy efficiency, oddly enough exactly 60 fps)
      // Note that this is only needed for the transition between a setTimout
      // or setInterval call that was invoked from a CLR/FFI callback, 
      // afterwards a correct positive valued timeout happens.
      //
      // TODO: Inspect to see if theres a way to trip teh GetQueuedCompletionStatus
      // when timeout == -1 with PostQueuedCompletionStatus (without libuv
      // segfaulting, maybe faking a TCP request?)
      if(timeout < 0) timeout = 16;
      if(timeout > 250) timeout = 250;
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

    // This is in place to act as a safety valve before we begin waiting.
    // If the postmessage is collected by a rogue handler (such as winforms)
    // this forces the main loop to run the next time any event is processed, 
    // it reset back to false when the event loop executes. If we don't have this 
    // placed after postmessage or if we remove postmessage we take up 
    // extrenous CPU.  This is a fail safe, it must be right here before 
    // semwait.
    uv_trip_safety = true;
    uv_sem_wait(&embed_sem);
  }
}

void node_load() {
  // Register the app:// schema.
  InitAppRequest();

  // Register the initial bridge: C++/C/C# (CLR) dotnet
  NODE_SET_METHOD(process_l, "initbridge", init_bridge);

  // The dummy handle prevents UV from exiting and throwing incorrect
  // timeout values, its necessary since uv can't see many of the app
  // events to keep it assuming something else will come and return -1
  // from uv_backend_timeout.
  uv_async_t dummy_uv_handle_;
  uv_async_init(uv_default_loop(), &dummy_uv_handle_, uv_noop);

  // Load node and begin processing.
  node::Load(process_l);

  // This must post after the node::Load otherwise we will get infinte
  // timeouts from libuv and if there isn't file descirptor setup yet
  // the entire thing will simply never wake back up.
  embed_closed = 0;
  
  uv_sem_init(&embed_sem, 0);
  uv_thread_create(&embed_thread, uv_event, NULL);
}

// Externalize this, if we've completely blocked the event loop
// and need to manually pump uv messages (e.g., WPF took over the
// loop due to a blocking OS reason)
extern "C" void uv_run_nowait() {
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
    if(uv_trip_safety == true) {
      uv_run_nowait();
      uv_trip_safety = false;
    }
    if(bRet == -1) {
      fprintf(stderr, "FATAL ERROR: %i\n",bRet);
      exit(1);
    } else if(msg.message == WM_APP+1) {
      uv_run_nowait();
      uv_trip_safety = false;
      //TODO: if (!TranslateAccelerator(msg.hwnd ?? , hAccelTable ?? , &msg))
    } else {
       TranslateMessage(&msg);
       DispatchMessage(&msg);
    }
  }

  // Received WM_QUIT
  node_terminate();
  exit(0);
}

// This is the general entry point for everything when /subsystem:console, 
// when executed its possible we came in through WinMain and it called us
// after initializing the arguments.
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
  return main(2, p_argv);
}



