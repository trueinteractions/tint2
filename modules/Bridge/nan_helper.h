
template<typename T>
NAN_INLINE void NanAssignPersistent(
    v8::Persistent<T>& handle
  , v8::Handle<T> obj) {
    handle.Reset(v8::Isolate::GetCurrent(), obj);
}
template<typename T>
NAN_INLINE void NanAssignPersistent(
    v8::Persistent<T>& handle
  , const v8::Persistent<T>& obj) {
    handle.Reset(v8::Isolate::GetCurrent(), obj);
}

template<typename T, typename P>
  class _NanWeakCallbackData;

template<typename T, typename P>
struct _NanWeakCallbackInfo {
  typedef void (*Callback)(const _NanWeakCallbackData<T, P>& data);
  NAN_INLINE _NanWeakCallbackInfo(v8::Handle<T> handle, P* param, Callback cb)
    : parameter(param), callback(cb) {
     NanAssignPersistent(persistent, handle);
  }

  NAN_INLINE ~_NanWeakCallbackInfo() {
    persistent.Reset();
  }

  P* const parameter;
  Callback const callback;
  v8::Persistent<T> persistent;
};

template<typename T, typename P>
class _NanWeakCallbackData {
 public:
  NAN_INLINE _NanWeakCallbackData(_NanWeakCallbackInfo<T, P> *info)
    : info_(info) { }

  NAN_INLINE v8::Local<T> GetValue() const {
    return NanNew(info_->persistent);
  }

  NAN_INLINE P* GetParameter() const { return info_->parameter; }

  NAN_INLINE bool IsNearDeath() const {
    return info_->persistent.IsNearDeath();
  }

  NAN_INLINE void Revive() const;

  NAN_INLINE _NanWeakCallbackInfo<T, P>* GetCallbackInfo() const {
    return info_;
  }

  NAN_DEPRECATED NAN_INLINE void Dispose() const {
  }

 private:
  _NanWeakCallbackInfo<T, P>* info_;
};

template<typename T, typename P>
static void _NanWeakCallbackDispatcher(
  const v8::WeakCallbackData<T, _NanWeakCallbackInfo<T, P> > &data) {
    _NanWeakCallbackInfo<T, P> *info = data.GetParameter();
    _NanWeakCallbackData<T, P> wcbd(info);
    info->callback(wcbd);
    if (wcbd.IsNearDeath()) {
      delete wcbd.GetCallbackInfo();
    }
}

template<typename T, typename P>
NAN_INLINE void _NanWeakCallbackData<T, P>::Revive() const {
    info_->persistent.SetWeak(info_, &_NanWeakCallbackDispatcher<T, P>);
}

template<typename T, typename P>
NAN_INLINE _NanWeakCallbackInfo<T, P>* NanMakeWeakPersistent(
    v8::Handle<T> handle
  , P* parameter
  , typename _NanWeakCallbackInfo<T, P>::Callback callback) {
    _NanWeakCallbackInfo<T, P> *cbinfo =
     new _NanWeakCallbackInfo<T, P>(handle, parameter, callback);
    cbinfo->persistent.SetWeak(cbinfo, &_NanWeakCallbackDispatcher<T, P>);
    return cbinfo;
}
