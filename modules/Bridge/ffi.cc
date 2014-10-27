#include <node_buffer.h>
#include <node_version.h>
#include "ffi.h"
#include <queue>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/event.h>
#include <sys/time.h>
#endif

pthread_t          CallbackInfo::g_mainthread;
pthread_mutex_t    CallbackInfo::g_queue_mutex;
std::queue<ThreadedCallbackInvokation *> CallbackInfo::g_queue;
uv_async_t         CallbackInfo::g_async;

/*
 * Called when the wrapped pointer is garbage collected.
 * We never have to do anything here...
 */

ThreadedCallbackInvokation::ThreadedCallbackInvokation(callback_info *cbinfo, void *retval, void **parameters) {
  m_cbinfo = cbinfo;
  m_retval = retval;
  m_parameters = parameters;

  pthread_mutex_init(&m_mutex, NULL);
  pthread_mutex_lock(&m_mutex);
  pthread_cond_init(&m_cond, NULL);
}

ThreadedCallbackInvokation::~ThreadedCallbackInvokation() {
  pthread_mutex_unlock(&m_mutex);
  pthread_cond_destroy(&m_cond);
  pthread_mutex_destroy(&m_mutex);
}

void ThreadedCallbackInvokation::SignalDoneExecuting() {
  pthread_mutex_lock(&m_mutex);
  pthread_cond_signal(&m_cond);
  pthread_mutex_unlock(&m_mutex);
}

void ThreadedCallbackInvokation::WaitForExecution() {
  pthread_cond_wait(&m_cond, &m_mutex);
}

/*
 * Called when the `ffi_closure *` pointer (actually the "code" pointer) get's
 * GC'd on the JavaScript side. In this case we have to unwrap the
 * `callback_info *` struct, dispose of the JS function Persistent reference,
 * then finally free the struct.
 */

void closure_pointer_cb(char *data, void *hint) {
  callback_info *info = reinterpret_cast<callback_info *>(hint);
  // dispose of the Persistent function reference
  info->function.Dispose();
  info->function.Clear();
  // now we can free the closure data
  ffi_closure_free(info);
}

/*
 * Invokes the JS callback function.
 */

void CallbackInfo::DispatchToV8(callback_info *info, void *retval, void **parameters, bool direct) {
  HandleScope scope;

  Handle<Value> argv[2];
  argv[0] = WrapPointer((char *)retval, info->resultSize);
  argv[1] = WrapPointer((char *)parameters, sizeof(char *) * info->argc);

  TryCatch try_catch;

  if (info->function.IsEmpty()) {
    // throw an error instead of segfaulting.
    // see: https://github.com/rbranson/node-ffi/issues/72
    ThrowException(Exception::Error(
          String::New("ffi fatal: callback has been garbage collected!")));
    return;
  } else {
    // invoke the registered callback function
    info->function->Call(Context::GetCurrent()->Global(), 2, argv);
#ifdef __APPLE__
  struct kevent event;
  EV_SET(&event, -1, EVFILT_TIMER | EV_ONESHOT, EV_ADD, NOTE_NSECONDS, 0, 0);
  kevent(uv_backend_fd(uv_default_loop()), &event, 1, NULL, 0, NULL);
#endif
  }

  if (try_catch.HasCaught()) {
    if (direct) {
      try_catch.ReThrow();
    } else {
      FatalException(try_catch);
    }
  }
}

void CallbackInfo::WatcherCallback(uv_async_t *w, int revents) {
  pthread_mutex_lock(&g_queue_mutex);
  while (!g_queue.empty()) {
    ThreadedCallbackInvokation *inv = g_queue.front();
    g_queue.pop();

    DispatchToV8(inv->m_cbinfo, inv->m_retval, inv->m_parameters, false);
    inv->SignalDoneExecuting();
  }

  pthread_mutex_unlock(&g_queue_mutex);
}

/*
 * Creates an `ffi_closure *` pointer around the given JS function. Returns the
 * executable C function pointer as a node Buffer instance.
 */

Handle<Value> CallbackInfo::Callback(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 4) {
    return ThrowException(String::New("Not enough arguments."));
  }

  // Args: cif pointer, JS function
  // TODO: Check args
  ffi_cif *cif = (ffi_cif *)Buffer::Data(args[0]->ToObject());
  size_t resultSize = args[1]->Int32Value();
  int argc = args[2]->Int32Value();
  Local<Function> callback = Local<Function>::Cast(args[3]);

  callback_info *info;
  ffi_status status;
  void *code;

  info = reinterpret_cast<callback_info *>(ffi_closure_alloc(sizeof(callback_info), &code));

  if (!info) {
    return ThrowException(String::New("ffi_closure_alloc() Returned Error"));
  }

  info->resultSize = resultSize;
  info->argc = argc;
  info->function = Persistent<Function>::New(callback);

  // store a reference to the callback function pointer
  // (not sure if this is actually needed...)
  info->code = code;

  //CallbackInfo *self = new CallbackInfo(callback, closure, code, argc);

  status = ffi_prep_closure_loc(
    (ffi_closure *)info,
    cif,
    Invoke,
    (void *)info,
    code
  );

  if (status != FFI_OK) {
    ffi_closure_free(info);
    // TODO: return the error code
    return ThrowException(String::New("ffi_prep_closure() Returned Error"));
  }

  Buffer *buf = Buffer::New((char *)code, sizeof(void *), closure_pointer_cb, info);
  return scope.Close(buf->handle_);
}

/*
 * This is the function that gets called when the C function pointer gets
 * executed.
 */

void CallbackInfo::Invoke(ffi_cif *cif, void *retval, void **parameters, void *user_data) {
  callback_info *info = reinterpret_cast<callback_info *>(user_data);

  // are we executing from another thread?
  if (pthread_equal(pthread_self(), g_mainthread)) {
    DispatchToV8(info, retval, parameters, true);
  } else {
    // hold the event loop open while this is executing
#if NODE_VERSION_AT_LEAST(0, 7, 9)
    uv_ref((uv_handle_t *)&g_async);
#else
    uv_ref(uv_default_loop());
#endif

    // create a temporary storage area for our invokation parameters
    ThreadedCallbackInvokation *inv = new ThreadedCallbackInvokation(info, retval, parameters);

    // push it to the queue -- threadsafe
    pthread_mutex_lock(&g_queue_mutex);
    g_queue.push(inv);
    pthread_mutex_unlock(&g_queue_mutex);

    // send a message to our main thread to wake up the WatchCallback loop
    uv_async_send(&g_async);

    // wait for signal from calling thread
    inv->WaitForExecution();

#if NODE_VERSION_AT_LEAST(0, 7, 9)
    uv_unref((uv_handle_t *)&g_async);
#else
    uv_unref(uv_default_loop());
#endif
    delete inv;
  }
}

/*
 * Init stuff.
 */

void CallbackInfo::Initialize(Handle<Object> target) {
  HandleScope scope;

  NODE_SET_METHOD(target, "Callback", Callback);

  // initialize our threaded invokation stuff
  g_mainthread = pthread_self();
  uv_async_init(uv_default_loop(), &g_async, CallbackInfo::WatcherCallback);
  pthread_mutex_init(&g_queue_mutex, NULL);

  // allow the event loop to exit while this is running
#if NODE_VERSION_AT_LEAST(0, 7, 9)
  uv_unref((uv_handle_t *)&g_async);
#else
  uv_unref(uv_default_loop());
#endif
}

void wrap_pointer_cb(char *data, void *hint) { }

Handle<Value> WrapPointer(char *ptr) {
  size_t size = 0;
  return WrapPointer(ptr, size);
}

Handle<Value> WrapPointer(char *ptr, size_t length) {
  HandleScope scope;
  void *user_data = NULL;
  Buffer *buf = Buffer::New(ptr, length, wrap_pointer_cb, user_data);
  return scope.Close(buf->handle_);
}

///////////////

void FFI::InitializeStaticFunctions(Handle<Object> target) {
  Local<Object> o = Object::New();

  // dl functions used by the DynamicLibrary JS class
  o->Set(String::NewSymbol("dlopen"),  WrapPointer((char *)dlopen));
  o->Set(String::NewSymbol("dlclose"), WrapPointer((char *)dlclose));
  o->Set(String::NewSymbol("dlsym"),   WrapPointer((char *)dlsym));
  o->Set(String::NewSymbol("dlerror"), WrapPointer((char *)dlerror));

  target->Set(String::NewSymbol("StaticFunctions"), o);
}

///////////////

#define SET_ENUM_VALUE(_value) \
  target->Set(String::NewSymbol(#_value), \
              Integer::New((ssize_t)_value), \
              static_cast<PropertyAttribute>(ReadOnly|DontDelete))

void FFI::InitializeBindings(Handle<Object> target) {

  // main function exports
  NODE_SET_METHOD(target, "ffi_prep_cif", FFIPrepCif);
  NODE_SET_METHOD(target, "ffi_prep_cif_var", FFIPrepCifVar);
  NODE_SET_METHOD(target, "ffi_call", FFICall);
  NODE_SET_METHOD(target, "ffi_call_async", FFICallAsync);

  // `ffi_status` enum values
  SET_ENUM_VALUE(FFI_OK);
  SET_ENUM_VALUE(FFI_BAD_TYPEDEF);
  SET_ENUM_VALUE(FFI_BAD_ABI);

  // `ffi_abi` enum values
  SET_ENUM_VALUE(FFI_DEFAULT_ABI);
  SET_ENUM_VALUE(FFI_FIRST_ABI);
  SET_ENUM_VALUE(FFI_LAST_ABI);
  /* ---- ARM processors ---------- */
#ifdef __arm__
  SET_ENUM_VALUE(FFI_SYSV);
  SET_ENUM_VALUE(FFI_VFP);
  /* ---- Intel x86 Win32 ---------- */
#elif defined(X86_WIN32)
  SET_ENUM_VALUE(FFI_SYSV);
  SET_ENUM_VALUE(FFI_STDCALL);
  SET_ENUM_VALUE(FFI_THISCALL);
  SET_ENUM_VALUE(FFI_FASTCALL);
  SET_ENUM_VALUE(FFI_MS_CDECL);
#elif defined(X86_WIN64)
  SET_ENUM_VALUE(FFI_WIN64);
#else
  /* ---- Intel x86 and AMD x86-64 - */
  SET_ENUM_VALUE(FFI_SYSV);
  /* Unix variants all use the same ABI for x86-64  */
  SET_ENUM_VALUE(FFI_UNIX64);
#endif

  /* flags for dlopen() */
#ifdef RTLD_LAZY
  SET_ENUM_VALUE(RTLD_LAZY);
#endif
#ifdef RTLD_NOW
  SET_ENUM_VALUE(RTLD_NOW);
#endif
#ifdef RTLD_LOCAL
  SET_ENUM_VALUE(RTLD_LOCAL);
#endif
#ifdef RTLD_GLOBAL
  SET_ENUM_VALUE(RTLD_GLOBAL);
#endif
#ifdef RTLD_NOLOAD
  SET_ENUM_VALUE(RTLD_NOLOAD);
#endif
#ifdef RTLD_NODELETE
  SET_ENUM_VALUE(RTLD_NODELETE);
#endif
#ifdef RTLD_FIRST
  SET_ENUM_VALUE(RTLD_FIRST);
#endif

  /* flags for dlsym() */
#ifdef RTLD_NEXT
  target->Set(String::NewSymbol("RTLD_NEXT"), WrapPointer((char *)RTLD_NEXT), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_DEFAULT
  target->Set(String::NewSymbol("RTLD_DEFAULT"), WrapPointer((char *)RTLD_DEFAULT), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_SELF
  target->Set(String::NewSymbol("RTLD_SELF"), WrapPointer((char *)RTLD_SELF), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_MAIN_ONLY
  target->Set(String::NewSymbol("RTLD_MAIN_ONLY"), WrapPointer((char *)RTLD_MAIN_ONLY), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif

  target->Set(String::NewSymbol("FFI_ARG_SIZE"), Integer::New(sizeof(ffi_arg)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->Set(String::NewSymbol("FFI_SARG_SIZE"), Integer::New(sizeof(ffi_sarg)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->Set(String::NewSymbol("FFI_TYPE_SIZE"), Integer::New(sizeof(ffi_type)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->Set(String::NewSymbol("FFI_CIF_SIZE"), Integer::New(sizeof(ffi_cif)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  bool hasObjc = false;
#if __OBJC__ || __OBJC2__
  hasObjc = true;
#endif
  target->Set(String::NewSymbol("HAS_OBJC"), Boolean::New(hasObjc), static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  Local<Object> ftmap = Object::New();
  ftmap->Set(String::NewSymbol("void"),     WrapPointer((char *)&ffi_type_void));
  ftmap->Set(String::NewSymbol("uint8"),    WrapPointer((char *)&ffi_type_uint8));
  ftmap->Set(String::NewSymbol("int8"),     WrapPointer((char *)&ffi_type_sint8));
  ftmap->Set(String::NewSymbol("uint16"),   WrapPointer((char *)&ffi_type_uint16));
  ftmap->Set(String::NewSymbol("int16"),    WrapPointer((char *)&ffi_type_sint16));
  ftmap->Set(String::NewSymbol("uint32"),   WrapPointer((char *)&ffi_type_uint32));
  ftmap->Set(String::NewSymbol("int32"),    WrapPointer((char *)&ffi_type_sint32));
  ftmap->Set(String::NewSymbol("uint64"),   WrapPointer((char *)&ffi_type_uint64));
  ftmap->Set(String::NewSymbol("int64"),    WrapPointer((char *)&ffi_type_sint64));
  ftmap->Set(String::NewSymbol("uchar"),    WrapPointer((char *)&ffi_type_uchar));
  ftmap->Set(String::NewSymbol("char"),     WrapPointer((char *)&ffi_type_schar));
  ftmap->Set(String::NewSymbol("ushort"),   WrapPointer((char *)&ffi_type_ushort));
  ftmap->Set(String::NewSymbol("short"),    WrapPointer((char *)&ffi_type_sshort));
  ftmap->Set(String::NewSymbol("uint"),     WrapPointer((char *)&ffi_type_uint));
  ftmap->Set(String::NewSymbol("int"),      WrapPointer((char *)&ffi_type_sint));
  ftmap->Set(String::NewSymbol("float"),    WrapPointer((char *)&ffi_type_float));
  ftmap->Set(String::NewSymbol("double"),   WrapPointer((char *)&ffi_type_double));
  ftmap->Set(String::NewSymbol("pointer"),  WrapPointer((char *)&ffi_type_pointer));
  // NOTE: "long" and "ulong" get handled in JS-land
  // Let libffi handle "long long"
  ftmap->Set(String::NewSymbol("ulonglong"), WrapPointer((char *)&ffi_type_ulong));
  ftmap->Set(String::NewSymbol("longlong"),  WrapPointer((char *)&ffi_type_slong));

  target->Set(String::NewSymbol("FFI_TYPES"), ftmap);
}

/*
 * Function that creates and returns an `ffi_cif` pointer from the given return
 * value type and argument types.
 *
 * args[0] - the CIF buffer
 * args[1] - the number of args
 * args[2] - the "return type" pointer
 * args[3] - the "arguments types array" pointer
 * args[4] - the ABI to use
 *
 * returns the ffi_status result from ffi_prep_cif()
 */

Handle<Value> FFI::FFIPrepCif(const Arguments& args) {
  HandleScope scope;

  unsigned int nargs;
  char *rtype, *atypes, *cif;
  ffi_status status;
  ffi_abi abi;

  if (args.Length() != 5) {
    return THROW_ERROR_EXCEPTION("ffi_prep_cif() requires 5 arguments!");
  }

  Handle<Value> cif_buf = args[0];
  if (!Buffer::HasInstance(cif_buf)) {
    return THROW_ERROR_EXCEPTION("prepCif(): Buffer required as first arg");
  }

  cif = Buffer::Data(cif_buf.As<Object>());
  nargs = args[1]->Uint32Value();
  rtype = Buffer::Data(args[2]->ToObject());
  atypes = Buffer::Data(args[3]->ToObject());
  abi = (ffi_abi)args[4]->Uint32Value();

  status = ffi_prep_cif(
      (ffi_cif *)cif,
      abi,
      nargs,
      (ffi_type *)rtype,
      (ffi_type **)atypes);

  return scope.Close(Integer::NewFromUnsigned(status));
}

/*
 * Function that creates and returns an `ffi_cif` pointer from the given return
 * value type and argument types.
 *
 * args[0] - the CIF buffer
 * args[1] - the number of fixed args
 * args[2] - the number of total args
 * args[3] - the "return type" pointer
 * args[4] - the "arguments types array" pointer
 * args[5] - the ABI to use
 *
 * returns the ffi_status result from ffi_prep_cif_var()
 */

Handle<Value> FFI::FFIPrepCifVar(const Arguments& args) {
  HandleScope scope;

  unsigned int fargs, targs;
  char *rtype, *atypes, *cif;
  ffi_status status;
  ffi_abi abi;

  if (args.Length() != 6) {
    return THROW_ERROR_EXCEPTION("ffi_prep_cif() requires 5 arguments!");
  }

  Handle<Value> cif_buf = args[0];
  if (!Buffer::HasInstance(cif_buf)) {
    return THROW_ERROR_EXCEPTION("prepCifVar(): Buffer required as first arg");
  }

  cif = Buffer::Data(cif_buf.As<Object>());
  fargs = args[1]->Uint32Value();
  targs = args[2]->Uint32Value();
  rtype = Buffer::Data(args[3]->ToObject());
  atypes = Buffer::Data(args[4]->ToObject());
  abi = (ffi_abi)args[5]->Uint32Value();

  status = ffi_prep_cif_var(
      (ffi_cif *)cif,
      abi,
      fargs,
      targs,
      (ffi_type *)rtype,
      (ffi_type **)atypes);

  return scope.Close(Integer::NewFromUnsigned(status));
}

/*
 * JS wrapper around `ffi_call()`.
 *
 * args[0] - Buffer - the `ffi_cif *`
 * args[1] - Buffer - the C function pointer to invoke
 * args[2] - Buffer - the `void *` buffer big enough to hold the return value
 * args[3] - Buffer - the `void **` array of pointers containing the arguments
 */

Handle<Value> FFI::FFICall(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 4) {
    return THROW_ERROR_EXCEPTION("ffi_call() requires 4 arguments!");
  }

  char *cif    = Buffer::Data(args[0]->ToObject());
  char *fn     = Buffer::Data(args[1]->ToObject());
  char *res    = Buffer::Data(args[2]->ToObject());
  char *fnargs = Buffer::Data(args[3]->ToObject());

#if __OBJC__ || __OBJC2__
    @try {
#endif
      ffi_call(
          (ffi_cif *)cif,
          FFI_FN(fn),
          (void *)res,
          (void **)fnargs
        );
#if __OBJC__ || __OBJC2__
    } @catch (id ex) {
      return ThrowException(WrapPointer((char *)ex));
    }
#endif

  return Undefined();
}

/*
 * Asynchronous JS wrapper around `ffi_call()`.
 *
 * args[0] - Buffer - the `ffi_cif *`
 * args[1] - Buffer - the C function pointer to invoke
 * args[2] - Buffer - the `void *` buffer big enough to hold the return value
 * args[3] - Buffer - the `void **` array of pointers containing the arguments
 * args[4] - Function - the callback function to invoke when complete
 */

Handle<Value> FFI::FFICallAsync(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 5) {
    return THROW_ERROR_EXCEPTION("ffi_call_async() requires 5 arguments!");
  }

  AsyncCallParams *p = new AsyncCallParams();
  p->result = FFI_OK;

  // store a persistent references to all the Buffers and the callback function
  p->cif  = Buffer::Data(args[0]->ToObject());
  p->fn   = Buffer::Data(args[1]->ToObject());
  p->res  = Buffer::Data(args[2]->ToObject());
  p->argv = Buffer::Data(args[3]->ToObject());

  Local<Function> callback = Local<Function>::Cast(args[4]);
  p->callback = Persistent<Function>::New(callback);

  uv_work_t *req = new uv_work_t;
  req->data = p;

  uv_queue_work(uv_default_loop(), req,
      FFI::AsyncFFICall,
      (uv_after_work_cb)FFI::FinishAsyncFFICall);

  return Undefined();
}

/*
 * Called on the thread pool.
 */

void FFI::AsyncFFICall(uv_work_t *req) {
  AsyncCallParams *p = (AsyncCallParams *)req->data;

#if __OBJC__ || __OBJC2__
  @try {
#endif
    ffi_call(
      (ffi_cif *)p->cif,
      FFI_FN(p->fn),
      (void *)p->res,
      (void **)p->argv
    );
#if __OBJC__ || __OBJC2__
  } @catch (id ex) {
    p->result = FFI_ASYNC_ERROR;
    p->err = (char *)ex;
  }
#endif
}

/*
 * Called after the AsyncFFICall function completes on the thread pool.
 * This gets run on the main loop thread.
 */

void FFI::FinishAsyncFFICall(uv_work_t *req) {
  HandleScope scope;

  AsyncCallParams *p = (AsyncCallParams *)req->data;

  Handle<Value> argv[] = { Null() };
  if (p->result != FFI_OK) {
    // an Objective-C error was thrown
    argv[0] = WrapPointer(p->err);
  }

  TryCatch try_catch;

  // invoke the registered callback function
  p->callback->Call(Context::GetCurrent()->Global(), 1, argv);

  // dispose of our persistent handle to the callback function
  p->callback.Dispose();
  p->callback.Clear();
  
  // free up our memory (allocated in FFICallAsync)
  delete p;
  delete req;

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}

void FFI::Init(Handle<Object> target) {
  HandleScope scope;

  FFI::InitializeBindings(target);
  FFI::InitializeStaticFunctions(target);
  CallbackInfo::Initialize(target);
}

NODE_MODULE(ffi_bindings, FFI::Init);
