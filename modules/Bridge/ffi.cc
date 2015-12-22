#include "ffi.h"
#include <queue>
#ifdef __APPLE__
#include <sys/types.h>
#include <sys/event.h>
#include <sys/time.h>
#endif


#ifdef WIN32
DWORD CallbackInfo::g_threadID;
#else
uv_thread_t CallbackInfo::g_mainthread;
#endif
uv_mutex_t    CallbackInfo::g_queue_mutex;
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

  uv_mutex_init(&m_mutex);
  uv_mutex_lock(&m_mutex);
  uv_cond_init(&m_cond);
}

ThreadedCallbackInvokation::~ThreadedCallbackInvokation() {
  uv_mutex_unlock(&m_mutex);
  uv_cond_destroy(&m_cond);
  uv_mutex_destroy(&m_mutex);
}

void ThreadedCallbackInvokation::SignalDoneExecuting() {
  uv_mutex_lock(&m_mutex);
  uv_cond_signal(&m_cond);
  uv_mutex_unlock(&m_mutex);
}

void ThreadedCallbackInvokation::WaitForExecution() {
  uv_cond_wait(&m_cond, &m_mutex);
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
  delete info->function;
  info->function = NULL;
  // now we can free the closure data
  ffi_closure_free(info);
}

/*
 * Invokes the JS callback function.
 */

void CallbackInfo::DispatchToV8(callback_info *info, void *retval, void **parameters, bool dispatched) {
  Nan::HandleScope scope;

  static const char* errorMessage = "ffi fatal: callback has been garbage collected!";

  if (info->function == NULL) {
    // throw an error instead of segfaulting.
    // see: https://github.com/rbranson/node-ffi/issues/72
    if(dispatched) {
      Local<Value> errorFunctionArgv[1];
      errorFunctionArgv[0] = Nan::New<String>(errorMessage).ToLocalChecked();
      info->errorFunction->Call(1, errorFunctionArgv);
    } else {
      Nan::ThrowError(errorMessage);
    }
  } else {
    // invoke the registered callback function
    Local<Value> functionArgv[2];
    functionArgv[0] = WrapPointer((char *)retval, info->resultSize);
    functionArgv[1] = WrapPointer((char *)parameters, sizeof(char *) * info->argc);
    Local<Value> e = info->function->Call(2, functionArgv);

    if(!e->IsUndefined()) {
      if(dispatched) {
        Local<Value> errorFunctionArgv[1];
        errorFunctionArgv[0] = e;
        info->errorFunction->Call(1, errorFunctionArgv);
      } else {
        Nan::ThrowError(e);
      }
    }
#ifdef __APPLE__
    struct kevent event;
    EV_SET(&event, -1, EVFILT_TIMER | EV_ONESHOT, EV_ADD, NOTE_NSECONDS, 0, 0);
    kevent(uv_backend_fd(uv_default_loop()), &event, 1, NULL, 0, NULL);
#endif
  }
}

void CallbackInfo::WatcherCallback(uv_async_t *w, int revents) {
  uv_mutex_lock(&g_queue_mutex);
  while (!g_queue.empty()) {
    ThreadedCallbackInvokation *inv = g_queue.front();
    g_queue.pop();

    DispatchToV8(inv->m_cbinfo, inv->m_retval, inv->m_parameters, true);
    inv->SignalDoneExecuting();
  }

  uv_mutex_unlock(&g_queue_mutex);
}

/*
 * Creates an `ffi_closure *` pointer around the given JS function. Returns the
 * executable C function pointer as a node Buffer instance.
 */

NAN_METHOD(CallbackInfo::Callback) {
  if (info.Length() != 5) {
    return Nan::ThrowError("Not enough arguments.");
  }

  // Args: cif pointer, JS function
  // TODO: Check args
  ffi_cif *cif = (ffi_cif *)Buffer::Data(info[0]->ToObject());
  size_t resultSize = info[1]->Int32Value();
  int argc = info[2]->Int32Value();
  Local<Function> errorReportCallback = Local<Function>::Cast(info[3]);
  Local<Function> callback = Local<Function>::Cast(info[4]);

  callback_info *cbInfo;
  ffi_status status;
  void *code;

  cbInfo = reinterpret_cast<callback_info *>(ffi_closure_alloc(sizeof(callback_info), &code));

  if (!cbInfo) {
    return THROW_ERROR_EXCEPTION("ffi_closure_alloc() Returned Error");
  }

  cbInfo->resultSize = resultSize;
  cbInfo->argc = argc;
  cbInfo->errorFunction = new Nan::Callback(errorReportCallback);
  cbInfo->function = new Nan::Callback(callback);

  // store a reference to the callback function pointer
  // (not sure if this is actually needed...)
  cbInfo->code = code;

  status = ffi_prep_closure_loc(
    (ffi_closure *)cbInfo,
    cif,
    Invoke,
    (void *)cbInfo,
    code
  );

  if (status != FFI_OK) {
    ffi_closure_free(cbInfo);
    return THROW_ERROR_EXCEPTION_WITH_STATUS_CODE("ffi_prep_closure() Returned Error", status);
  }
  info.GetReturnValue().Set(
    Nan::NewBuffer((char *)code, sizeof(void*), closure_pointer_cb, cbInfo).ToLocalChecked()
  );
}

/*
 * This is the function that gets called when the C function pointer gets
 * executed.
 */

void CallbackInfo::Invoke(ffi_cif *cif, void *retval, void **parameters, void *user_data) {
  callback_info *info = reinterpret_cast<callback_info *>(user_data);

  // are we executing from another thread?
#ifdef WIN32
  if (g_threadID == GetCurrentThreadId()) {
#else
  uv_thread_t self_thread = (uv_thread_t) uv_thread_self();
  if (uv_thread_equal(&self_thread, &g_mainthread)) {
#endif
    DispatchToV8(info, retval, parameters, true);
  } else {
    // hold the event loop open while this is executing
    uv_ref((uv_handle_t *)&g_async);

    // create a temporary storage area for our invokation parameters
    ThreadedCallbackInvokation *inv = new ThreadedCallbackInvokation(info, retval, parameters);

    // push it to the queue -- threadsafe
    uv_mutex_lock(&g_queue_mutex);
    g_queue.push(inv);
    uv_mutex_unlock(&g_queue_mutex);

    // send a message to our main thread to wake up the WatchCallback loop
    uv_async_send(&g_async);

    // wait for signal from calling thread
    inv->WaitForExecution();

    uv_unref((uv_handle_t *)&g_async);
    delete inv;
  }
}

/*
 * Init stuff.
 */

void CallbackInfo::Initialize(Handle<Object> target) {
  Nan::HandleScope scope;

  Nan::Set(target, Nan::New<String>("Callback").ToLocalChecked(),
    Nan::New<FunctionTemplate>(Callback)->GetFunction());

  // initialize our threaded invokation stuff
#ifdef WIN32
  g_threadID = GetCurrentThreadId();
#else
  g_mainthread = (uv_thread_t) uv_thread_self();
#endif
  uv_async_init(uv_default_loop(), &g_async, (uv_async_cb) CallbackInfo::WatcherCallback);
  uv_mutex_init(&g_queue_mutex);

  // allow the event loop to exit while this is running
  uv_unref((uv_handle_t *)&g_async);
}



///////////////

NAN_MODULE_INIT(FFI::InitializeStaticFunctions) {
  Local<Object> o =  Nan::New<Object>();

  // dl functions used by the DynamicLibrary JS class
  o->Set(Nan::New<String>("dlopen").ToLocalChecked(),  WrapPointer((char *)dlopen));
  o->Set(Nan::New<String>("dlclose").ToLocalChecked(), WrapPointer((char *)dlclose));
  o->Set(Nan::New<String>("dlsym").ToLocalChecked(),   WrapPointer((char *)dlsym));
  o->Set(Nan::New<String>("dlerror").ToLocalChecked(), WrapPointer((char *)dlerror));
  target->Set(Nan::New<String>("StaticFunctions").ToLocalChecked(), o);
}

///////////////

#define SET_ENUM_VALUE(_value) \
  Nan::ForceSet(target, Nan::New<String>(#_value).ToLocalChecked(), \
              Nan::New<Integer>((uint32_t)_value), \
              static_cast<PropertyAttribute>(ReadOnly|DontDelete))

NAN_MODULE_INIT(FFI::InitializeBindings) {

  // main function exports
  Nan::Set(target, Nan::New<String>("ffi_prep_cif").ToLocalChecked(),
    Nan::New<FunctionTemplate>(FFIPrepCif)->GetFunction());
  Nan::Set(target, Nan::New<String>("ffi_prep_cif_var").ToLocalChecked(),
    Nan::New<FunctionTemplate>(FFIPrepCifVar)->GetFunction());
  Nan::Set(target, Nan::New<String>("ffi_call").ToLocalChecked(),
    Nan::New<FunctionTemplate>(FFICall)->GetFunction());
  Nan::Set(target, Nan::New<String>("ffi_call_async").ToLocalChecked(),
    Nan::New<FunctionTemplate>(FFICallAsync)->GetFunction());


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
  target->ForceSet(Nan::New<String>("RTLD_NEXT").ToLocalChecked(), WrapPointer((char *)RTLD_NEXT), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_DEFAULT
  target->ForceSet(Nan::New<String>("RTLD_DEFAULT").ToLocalChecked(), WrapPointer((char *)RTLD_DEFAULT), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_SELF
  target->ForceSet(Nan::New<String>("RTLD_SELF").ToLocalChecked(), WrapPointer((char *)RTLD_SELF), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif
#ifdef RTLD_MAIN_ONLY
  target->ForceSet(Nan::New<String>("RTLD_MAIN_ONLY").ToLocalChecked(), WrapPointer((char *)RTLD_MAIN_ONLY), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
#endif

  target->ForceSet(Nan::New<String>("FFI_ARG_SIZE").ToLocalChecked(), Nan::New<Number>(sizeof(ffi_arg)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->ForceSet(Nan::New<String>("FFI_SARG_SIZE").ToLocalChecked(), Nan::New<Number>(sizeof(ffi_sarg)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->ForceSet(Nan::New<String>("FFI_TYPE_SIZE").ToLocalChecked(), Nan::New<Number>(sizeof(ffi_type)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  target->ForceSet(Nan::New<String>("FFI_CIF_SIZE").ToLocalChecked(), Nan::New<Number>(sizeof(ffi_cif)), static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  bool hasObjc = false;
#if __OBJC__ || __OBJC2__
  hasObjc = true;
#endif
  target->ForceSet(Nan::New<String>("HAS_OBJC").ToLocalChecked(), Nan::New<Boolean>(hasObjc), static_cast<PropertyAttribute>(ReadOnly|DontDelete));

  Local<Object> ftmap = Nan::New<Object>();
  ftmap->Set(Nan::New<String>("void").ToLocalChecked(),     WrapPointer((char *)&ffi_type_void));
  ftmap->Set(Nan::New<String>("uint8").ToLocalChecked(),    WrapPointer((char *)&ffi_type_uint8));
  ftmap->Set(Nan::New<String>("int8").ToLocalChecked(),     WrapPointer((char *)&ffi_type_sint8));
  ftmap->Set(Nan::New<String>("uint16").ToLocalChecked(),   WrapPointer((char *)&ffi_type_uint16));
  ftmap->Set(Nan::New<String>("int16").ToLocalChecked(),    WrapPointer((char *)&ffi_type_sint16));
  ftmap->Set(Nan::New<String>("uint32").ToLocalChecked(),   WrapPointer((char *)&ffi_type_uint32));
  ftmap->Set(Nan::New<String>("int32").ToLocalChecked(),    WrapPointer((char *)&ffi_type_sint32));
  ftmap->Set(Nan::New<String>("uint64").ToLocalChecked(),   WrapPointer((char *)&ffi_type_uint64));
  ftmap->Set(Nan::New<String>("int64").ToLocalChecked(),    WrapPointer((char *)&ffi_type_sint64));
  ftmap->Set(Nan::New<String>("uchar").ToLocalChecked(),    WrapPointer((char *)&ffi_type_uchar));
  ftmap->Set(Nan::New<String>("char").ToLocalChecked(),     WrapPointer((char *)&ffi_type_schar));
  ftmap->Set(Nan::New<String>("ushort").ToLocalChecked(),   WrapPointer((char *)&ffi_type_ushort));
  ftmap->Set(Nan::New<String>("short").ToLocalChecked(),    WrapPointer((char *)&ffi_type_sshort));
  ftmap->Set(Nan::New<String>("uint").ToLocalChecked(),     WrapPointer((char *)&ffi_type_uint));
  ftmap->Set(Nan::New<String>("int").ToLocalChecked(),      WrapPointer((char *)&ffi_type_sint));
  ftmap->Set(Nan::New<String>("float").ToLocalChecked(),    WrapPointer((char *)&ffi_type_float));
  ftmap->Set(Nan::New<String>("double").ToLocalChecked(),   WrapPointer((char *)&ffi_type_double));
  ftmap->Set(Nan::New<String>("pointer").ToLocalChecked(),  WrapPointer((char *)&ffi_type_pointer));
  // NOTE: "long" and "ulong" get handled in JS-land
  // Let libffi handle "long long"
  ftmap->Set(Nan::New<String>("ulonglong").ToLocalChecked(), WrapPointer((char *)&ffi_type_ulong));
  ftmap->Set(Nan::New<String>("longlong").ToLocalChecked(),  WrapPointer((char *)&ffi_type_slong));

  target->Set(Nan::New<String>("FFI_TYPES").ToLocalChecked(), ftmap);
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

NAN_METHOD(FFI::FFIPrepCif) {
  unsigned int nargs;
  char *rtype, *atypes, *cif;
  ffi_status status;
  ffi_abi abi;

  if (info.Length() != 5) {
    return THROW_ERROR_EXCEPTION("ffi_prep_cif() requires 5 arguments!");
  }

  Handle<Value> cif_buf = info[0];
  if (!Buffer::HasInstance(cif_buf)) {
    return THROW_ERROR_EXCEPTION("prepCif(): Buffer required as first arg");
  }

  cif = Buffer::Data(cif_buf.As<Object>());
  nargs = info[1]->Uint32Value();
  rtype = Buffer::Data(info[2]->ToObject());
  atypes = Buffer::Data(info[3]->ToObject());
  abi = (ffi_abi)info[4]->Uint32Value();

  status = ffi_prep_cif(
      (ffi_cif *)cif,
      abi,
      nargs,
      (ffi_type *)rtype,
      (ffi_type **)atypes);

  info.GetReturnValue().Set(Nan::New<Integer>(status));
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

NAN_METHOD(FFI::FFIPrepCifVar) {
  unsigned int fargs, targs;
  char *rtype, *atypes, *cif;
  ffi_status status;
  ffi_abi abi;

  if (info.Length() != 6) {
    return THROW_ERROR_EXCEPTION("ffi_prep_cif() requires 5 arguments!");
  }

  Handle<Value> cif_buf = info[0];
  if (!Buffer::HasInstance(cif_buf)) {
    return THROW_ERROR_EXCEPTION("prepCifVar(): Buffer required as first arg");
  }

  cif = Buffer::Data(cif_buf.As<Object>());
  fargs = info[1]->Uint32Value();
  targs = info[2]->Uint32Value();
  rtype = Buffer::Data(info[3]->ToObject());
  atypes = Buffer::Data(info[4]->ToObject());
  abi = (ffi_abi)info[5]->Uint32Value();

  status = ffi_prep_cif_var(
      (ffi_cif *)cif,
      abi,
      fargs,
      targs,
      (ffi_type *)rtype,
      (ffi_type **)atypes);

  info.GetReturnValue().Set(Nan::New<Integer>(status));
}

/*
 * JS wrapper around `ffi_call()`.
 *
 * args[0] - Buffer - the `ffi_cif *`
 * args[1] - Buffer - the C function pointer to invoke
 * args[2] - Buffer - the `void *` buffer big enough to hold the return value
 * args[3] - Buffer - the `void **` array of pointers containing the arguments
 */

NAN_METHOD(FFI::FFICall) {
  if (info.Length() != 4) {
    return THROW_ERROR_EXCEPTION("ffi_call() requires 4 arguments!");
  }

  char *cif    = Buffer::Data(info[0]->ToObject());
  char *fn     = Buffer::Data(info[1]->ToObject());
  char *res    = Buffer::Data(info[2]->ToObject());
  char *fnargs = Buffer::Data(info[3]->ToObject());

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
      return THROW_ERROR_EXCEPTION(WrapPointer((char *)ex));
    }
#endif
  info.GetReturnValue().SetUndefined();
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

NAN_METHOD(FFI::FFICallAsync) {
  if (info.Length() != 5) {
    return THROW_ERROR_EXCEPTION("ffi_call_async() requires 5 arguments!");
  }

  AsyncCallParams *p = new AsyncCallParams();
  p->result = FFI_OK;

  // store a persistent references to all the Buffers and the callback function
  p->cif  = Buffer::Data(info[0]->ToObject());
  p->fn   = Buffer::Data(info[1]->ToObject());
  p->res  = Buffer::Data(info[2]->ToObject());
  p->argv = Buffer::Data(info[3]->ToObject());

  Local<Function> callback = Local<Function>::Cast(info[4]);
  p->callback = new Nan::Callback(callback);

  uv_work_t *req = new uv_work_t;
  req->data = p;

  uv_queue_work(uv_default_loop(), req,
      FFI::AsyncFFICall,
      (uv_after_work_cb)FFI::FinishAsyncFFICall);
  info.GetReturnValue().SetUndefined();
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
  Nan::HandleScope scope;
  AsyncCallParams *p = (AsyncCallParams *)req->data;

  Local<Value> argv[] = { Nan::Null() };
  if (p->result != FFI_OK) {
    // an Objective-C error was thrown
    argv[0] = WrapPointer(p->err);
  }

  Nan::TryCatch try_catch;

  // invoke the registered callback function
  p->callback->Call(1, argv);

  // dispose of our persistent handle to the callback function
  delete p->callback;
  
  // free up our memory (allocated in FFICallAsync)
  delete p;
  delete req;

  if (try_catch.HasCaught()) {
    Nan::FatalException(try_catch);
  }
}

void FFI::Init(Handle<Object> target) {
  Nan::HandleScope scope;
  FFI::InitializeBindings(target);
  FFI::InitializeStaticFunctions(target);
  CallbackInfo::Initialize(target);
}

NODE_MODULE(ffi_bindings, FFI::Init);
