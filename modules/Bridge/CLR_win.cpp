
#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include <stdio.h>
#include <vcclr.h>
#include <vector>
#include <msclr/marshal.h>


#include "../AutoLayoutPanel.cpp"

#using <system.dll>
#using <System.Core.dll>
#using <WPF/WindowsBase.dll>

using namespace v8;
using namespace System::Collections::Generic;
using namespace System::Reflection;
using namespace System::Reflection::Emit;
using namespace System::Runtime::InteropServices;
using namespace System::Threading::Tasks;
using namespace System::Threading;
using namespace Microsoft::Win32;

extern "C" void uv_run_nowait();

/* Stubs for CLR, these are needed otherwise we'll get a linking 
 * warning complaining that the exe will not run. */
namespace v8 {
  namespace internal {
    class Object {};
  }
  struct HeapStatsUpdate {};
}
Persistent<Function> bufferConstructor;

class CppClass {
  public:
    gcroot<System::Object ^> * obj;
    GCHandle handle;
    CppClass() : obj(new gcroot<System::Object ^>) {
      handle = GCHandle::Alloc(*obj);
    }
    ~CppClass() {
      handle.Free();
      delete obj; 
    }
};

void wrap_pointer_cb2(char *data, void *hint) {}

System::String^ stringV82CLR(Handle<v8::String> text)
{
    HandleScope scope;
    v8::String::Utf8Value utf8text(text);
    if (*utf8text)
    {
        return gcnew System::String(
            *utf8text, 0, utf8text.length(), System::Text::Encoding::UTF8);
    }
    else
    {
        return System::String::Empty;
    }
}

Handle<v8::String> stringCLR2V8(System::String^ text)
{
    HandleScope scope;
    if (text->Length > 0)
    {
        array<unsigned char>^ utf8 = System::Text::Encoding::UTF8->GetBytes(text);
        pin_ptr<unsigned char> ch = &utf8[0];
        return scope.Close(v8::String::New((char*)ch));
    }
    else
    {
        return scope.Close(v8::String::Empty());
    }
}

System::String^ exceptionV82stringCLR(Handle<v8::Value> exception)
{
    HandleScope scope;
    if (exception->IsObject())
    {
        Handle<Value> stack = exception->ToObject()->Get(v8::String::NewSymbol("stack"));
        if (stack->IsString())
        {
            return gcnew System::String(stringV82CLR(stack->ToString()));
        }
    }

    return gcnew System::String(stringV82CLR(Handle<v8::String>::Cast(exception)));
}

Handle<Value> throwV8Exception(Handle<Value> exception)
{
    HandleScope scope;
    return scope.Close(ThrowException(exception));
}

Handle<v8::Value> MarshalCLRToV8(System::Object^ netdata);

Handle<v8::Object> MarshalCLRObjectToV8(System::Object^ netdata)
{
    HandleScope scope;
    Handle<v8::Object> result = v8::Object::New();
    System::Type^ type = netdata->GetType();

    if (0 == System::String::Compare(type->FullName, "System.Reflection.RuntimeMethodInfo")) {
        // Avoid stack overflow due to self-referencing reflection elements
        return scope.Close(result);
    }

    for each (FieldInfo^ field in type->GetFields(BindingFlags::Public | BindingFlags::Instance))
    {
        result->Set(
            stringCLR2V8(field->Name), 
            MarshalCLRToV8(field->GetValue(netdata)));
    }

    for each (PropertyInfo^ property in type->GetProperties(BindingFlags::GetProperty | BindingFlags::Public | BindingFlags::Instance))
    {
        MethodInfo^ getMethod = property->GetGetMethod();
        if (getMethod != nullptr && getMethod->GetParameters()->Length <= 0)
        {
            result->Set(
                stringCLR2V8(property->Name), 
                MarshalCLRToV8(getMethod->Invoke(netdata, nullptr)));
        }
    }

    return scope.Close(result);
}

Handle<v8::Value> MarshalCLRExceptionToV8(System::Exception^ exception)
{
    HandleScope scope;
    Handle<v8::Object> result;
    Handle<v8::String> message;
    Handle<v8::String> name;

    if (exception == nullptr)
    {
        result = v8::Object::New();
        message = v8::String::New("Unrecognized exception thrown by CLR.");
        name = v8::String::New("InternalException");
    }
    else
    {
        // Remove AggregateException wrapper from around singleton InnerExceptions
        if (System::AggregateException::typeid->IsAssignableFrom(exception->GetType()))
        {
            System::AggregateException^ aggregate = (System::AggregateException^)exception;
            if (aggregate->InnerExceptions->Count == 1)
                exception = aggregate->InnerExceptions[0];
        }
        else if (System::Reflection::TargetInvocationException::typeid->IsAssignableFrom(exception->GetType())
            && exception->InnerException != nullptr)
        {
            exception = exception->InnerException;
        }

        result = MarshalCLRObjectToV8(exception);
        message = stringCLR2V8(exception->GetType()->FullName + " " + exception->Message + "\n" + exception->StackTrace);
        name = stringCLR2V8(exception->GetType()->FullName);
    }   
        
    // Construct an error that is just used for the prototype - not verify efficient
    // but 'typeof Error' should work in JavaScript
    result->SetPrototype(v8::Exception::Error( message));
    result->Set(v8::String::NewSymbol("message"), message);
    
    // Recording the actual type - 'name' seems to be the common used property
    result->Set(v8::String::NewSymbol("name"), name);

    return scope.Close(result);
}

Handle<v8::Value> MarshalCLRToV8(System::Object^ netdata) {
  HandleScope scope;
  Handle<v8::Value> jsdata;

  if (netdata == nullptr)
      return scope.Close(Null());

  System::Type^ type = netdata->GetType();
  if (type == System::String::typeid)
    jsdata = stringCLR2V8((System::String^)netdata);
  else if (type == System::Char::typeid)
    jsdata = stringCLR2V8(((System::Char^)netdata)->ToString());
  else if (type == bool::typeid)
    jsdata = v8::Boolean::New((bool)netdata);
  else if (type == System::Guid::typeid)
    jsdata = stringCLR2V8(netdata->ToString());
  else if (type == System::DateTime::typeid)
  {
    System::DateTime ^dt = (System::DateTime^)netdata;
    if (dt->Kind == System::DateTimeKind::Local)
        dt = dt->ToUniversalTime();
    else if (dt->Kind == System::DateTimeKind::Unspecified)
        dt = gcnew System::DateTime(dt->Ticks, System::DateTimeKind::Utc);
    long long MinDateTimeTicks = 621355968000000000; // new DateTime(1970, 1, 1, 0, 0, 0).Ticks;
    long long value = ((dt->Ticks - MinDateTimeTicks) / 10000);
    jsdata = v8::Date::New((double)value);
  }
  else if (type == System::DateTimeOffset::typeid)
    jsdata = stringCLR2V8(netdata->ToString());
  else if (type == int::typeid)
    jsdata = v8::Integer::New((int)netdata);
  else if (type == System::Int64::typeid)
    jsdata = v8::Number::New(((System::IConvertible^)netdata)->ToDouble(nullptr));
  else if (type == double::typeid)
    jsdata = v8::Number::New((double)netdata);
  else if (type == float::typeid)
    jsdata = v8::Number::New((float)netdata);
  else if (type == cli::array<byte>::typeid)
  {
    cli::array<byte>^ buffer = (cli::array<byte>^)netdata;
    node::Buffer* slowBuffer = node::Buffer::New(buffer->Length);
    if (buffer->Length > 0)
    {
        pin_ptr<unsigned char> pinnedBuffer = &buffer[0];
        memcpy(node::Buffer::Data(slowBuffer), pinnedBuffer, buffer->Length);
    }
    Handle<v8::Value> args[] = { 
        slowBuffer->handle_, 
        v8::Integer::New(buffer->Length), 
        v8::Integer::New(0) 
    };
    jsdata = bufferConstructor->NewInstance(3, args);    
  }
  else
  {
    //try {
      System::Type^ type = netdata->GetType();
      CppClass *n = new CppClass();
      *(n->obj) = netdata;
      void *user_data = NULL;
      size_t sz = sizeof(CppClass *);
      node::Buffer *buf = node::Buffer::New((char *)n, sz, wrap_pointer_cb2, user_data);
      jsdata = buf->handle_;
      if(type == System::IntPtr::typeid) {
        void *ptr = ((System::IntPtr ^)netdata)->ToPointer();
        node::Buffer *bufptr = node::Buffer::New((char *)ptr, sz, wrap_pointer_cb2, user_data);
        (v8::Handle<v8::Object>::Cast(jsdata))->Set(v8::String::NewSymbol("rawpointer"), bufptr->handle_);
      }
    //} catch (System::Exception^ e) {
    //  return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    //}
  }
  return scope.Close(jsdata);
}

System::Object^ MarshalV8ToCLR(Handle<v8::Value> jsdata)
{
    HandleScope scope;
    if (jsdata->IsArray())
    {
      Handle<v8::Array> jsarray = Handle<v8::Array>::Cast(jsdata);
      cli::array<System::Object^>^ netarray = gcnew cli::array<System::Object^>(jsarray->Length());
      for (unsigned int i = 0; i < jsarray->Length(); i++)
          netarray[i] = MarshalV8ToCLR(jsarray->Get(i));
      return netarray;
    }
    else if (jsdata->IsDate())
    {
      Handle<v8::Date> jsdate = Handle<v8::Date>::Cast(jsdata);
      long long  ticks = (long long)jsdate->NumberValue();
      long long MinDateTimeTicks = 621355968000000000;// (new DateTime(1970, 1, 1, 0, 0, 0)).Ticks;
      System::DateTime ^netobject = gcnew System::DateTime(ticks * 10000 + MinDateTimeTicks, System::DateTimeKind::Utc);
      return netobject;
    }
    else if (jsdata->IsString())
      return stringV82CLR(Handle<v8::String>::Cast(jsdata));
    else if (jsdata->IsBoolean())
      return jsdata->BooleanValue();
    else if (jsdata->IsInt32())
      return jsdata->Int32Value();
    else if (jsdata->IsUint32()) 
      return jsdata->Uint32Value();
    else if (jsdata->IsNumber()) 
      return jsdata->NumberValue();
    else if (jsdata->IsUndefined() || jsdata->IsNull())
      return nullptr;
    else if (node::Buffer::HasInstance(jsdata)) 
    {
      CppClass *data = (CppClass *)node::Buffer::Data(jsdata.As<v8::Object>());
      System::Object ^obj = (*(data->obj));
      return obj;
    }
    else if (jsdata->IsObject()) 
    {
      System::Collections::Generic::IDictionary<System::String^,System::Object^>^ netobject = gcnew System::Dynamic::ExpandoObject();
      Handle<v8::Object> jsobject = Handle<v8::Object>::Cast(jsdata);
      Handle<v8::Array> propertyNames = jsobject->GetPropertyNames();
      for (unsigned int i = 0; i < propertyNames->Length(); i++)
      {
          Handle<v8::String> name = Handle<v8::String>::Cast(propertyNames->Get(i));
          v8::String::Utf8Value utf8name(name);
          System::String^ netname = gcnew System::String(*utf8name);
          System::Object^ netvalue = MarshalV8ToCLR(jsobject->Get(name));
          netobject->Add(netname, netvalue);
      }
      return netobject;
    }
    else
      throw gcnew System::Exception("Unable to convert V8 value to CLR value.");
}

struct wrapv8obj {
  v8::Persistent<v8::Function> function;
};

public ref class CLREventHandler {
  public:
  
  CLREventHandler(v8::Persistent<v8::Function> cb) {
    callback = new wrapv8obj();
    callback->function = cb;

  }
  ~CLREventHandler() {}
  void PassThru(... cli::array<System::Object^>^ args) {
    v8::HandleScope scope;
    std::vector<v8::Handle<v8::Value>> argv;
    v8::TryCatch try_catch;

    for(int i=0; i < args->Length; i++) argv.push_back(MarshalCLRToV8(args[i]));

    if (this->callback->function.IsEmpty()) {
      ThrowException(v8::Exception::Error(
            v8::String::New("CLR fatal: Callback has been garbage collected.")));
      exit(1);
    } else {
      // invoke the registered callback function
      this->callback->function->Call(v8::Context::GetCurrent()->Global(), args->Length, argv.data());
    }
    if (try_catch.HasCaught())
      try_catch.ReThrow();
  }
  void EventHandler(System::Object^ sender, System::EventArgs^ e) {
    v8::HandleScope scope;
    v8::Handle<v8::Value> argv[2];

    argv[0] = MarshalCLRToV8(sender);
    argv[1] = MarshalCLRToV8(e);

    v8::TryCatch try_catch;

    if (this->callback->function.IsEmpty()) {
      ThrowException(v8::Exception::Error(
            v8::String::New("CLR fatal: Callback has been garbage collected.")));
      exit(1);
    } else {
      // invoke the registered callback function
      this->callback->function->Call(v8::Context::GetCurrent()->Global(), 2, argv);
    }
    if (try_catch.HasCaught()) {
      try_catch.ReThrow();
    }
  }
private:

  wrapv8obj *callback;
};

class CLR {
  CLR() { }

public:

  /** Creation of Classes **/
  static Handle<v8::Value> CreateClass(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::String^ name = stringV82CLR(args[0]->ToString());
      System::Type^ base = (System::Type ^)MarshalV8ToCLR(args[1]);
      cli::array<System::Object^>^ interfaces = (cli::array<System::Object ^>^)MarshalV8ToCLR(args[2]);
      cli::array<System::Object^>^ abstracts = (cli::array<System::Object ^>^)MarshalV8ToCLR(args[3]);

      System::AppDomain^ domain = System::AppDomain::CurrentDomain;
      AssemblyName^ aName = gcnew AssemblyName(name);
      AssemblyBuilder^ ab = domain->DefineDynamicAssembly(aName, AssemblyBuilderAccess::RunAndSave);
      ModuleBuilder^ mb = ab->DefineDynamicModule(aName->Name, aName->Name + ".dll");
      TypeBuilder^ tb = mb->DefineType(name, TypeAttributes::Public | TypeAttributes::Class, base);
      return scope.Close(MarshalCLRToV8(tb));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> AddConstructor(const v8::Arguments& args) {
    HandleScope scope;
    try {
      TypeBuilder^ tb = (TypeBuilder ^)MarshalV8ToCLR(args[0]);
      System::String^ accessibility = stringV82CLR(args[1]->ToString());
      bool defaultConst = ((System::Boolean ^)MarshalV8ToCLR(args[2]))->CompareTo(true);
      cli::array<System::Type ^>^ types = (cli::array<System::Type ^>^)MarshalV8ToCLR(args[3]);
      v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[4]);

      CLREventHandler ^handle = gcnew CLREventHandler(Persistent<Function>::New(callback));

      MethodAttributes attr = MethodAttributes::Public;
      if(accessibility == "private") attr = MethodAttributes::Private;
      //else if(accessibility == "private") attr = MethodAttributes::Protected;

      ConstructorBuilder^ ctor0;

      if(types->Length == 0)
        ctor0 = tb->DefineConstructor(attr, CallingConventions::Standard, System::Type::EmptyTypes);
      else
        ctor0 = tb->DefineConstructor(attr, CallingConventions::Standard, (cli::array<System::Type^>^)types);

      ILGenerator ^il = ctor0->GetILGenerator();
      
      // Push args
      for(unsigned short i=0; i < types->Length; i++)
        il->Emit(OpCodes::Ldarg_S, i);

      // Call method CLREventHandler->PassThru
      il->EmitCall(OpCodes::Call,
        handle->GetType()->GetMethod("PassThru"),
        types);

      // Return back.
      il->Emit(OpCodes::Ret);

      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> AddMethodToClass(const v8::Arguments& args) {
    HandleScope scope;
    try {
      TypeBuilder^ tb = (TypeBuilder ^)MarshalV8ToCLR(args[0]);
      System::String^ name = stringV82CLR(args[1]->ToString());
      System::String^ accessibility = stringV82CLR(args[2]->ToString());
      bool staticDef = ((System::Boolean ^)MarshalV8ToCLR(args[3]))->CompareTo(true);
      bool overrideDef = ((System::Boolean ^)MarshalV8ToCLR(args[4]))->CompareTo(true);
      System::Type^ rettype = (System::Type ^)MarshalV8ToCLR(args[5]);
      cli::array<System::Type ^>^ types = (cli::array<System::Type ^>^)MarshalV8ToCLR(args[6]);
      v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[7]);

      CLREventHandler ^handle = gcnew CLREventHandler(Persistent<Function>::New(callback));

      MethodAttributes attr = MethodAttributes::Public;
      if(accessibility == "private") attr = MethodAttributes::Private;

      if(staticDef) attr = attr | MethodAttributes::Static;

      MethodBuilder^ m0;

      if(types->Length == 0) m0 = tb->DefineMethod(name, attr, rettype, System::Type::EmptyTypes);
      else m0 = tb->DefineMethod(name, attr, rettype, (cli::array<System::Type^>^)types);

      ILGenerator ^il = m0->GetILGenerator();
      
      // Push args
      for(unsigned short i=0; i < types->Length; i++)
        il->Emit(OpCodes::Ldarg_S,i);

      // Call method CLREventHandler->PassThru
      il->EmitCall(OpCodes::Call,
        handle->GetType()->GetMethod("PassThru"),
        types);

      // Return back.
      il->Emit(OpCodes::Ret);

      // If we'd like to override the method in the process.
      if(overrideDef) tb->DefineMethodOverride(m0,tb->BaseType->GetMethod(name));

      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> AddPropertyToClass(const v8::Arguments& args) {
    HandleScope scope;
    try {
      TypeBuilder^ tb = (TypeBuilder ^)MarshalV8ToCLR(args[0]);
      System::String^ name = stringV82CLR(args[1]->ToString());
      System::String^ accessibility = stringV82CLR(args[2]->ToString());
      bool staticDef = ((System::Boolean ^)MarshalV8ToCLR(args[3]))->CompareTo(true);
      bool readOnly = ((System::Boolean ^)MarshalV8ToCLR(args[4]))->CompareTo(true);
      System::Type^ propType = (System::Type^)MarshalV8ToCLR(args[5]);
      System::Object ^value = MarshalV8ToCLR(args[6]);

      FieldBuilder^ fieldBuilder = tb->DefineField("_" + name, propType, FieldAttributes::Private);

      MethodAttributes attr = MethodAttributes::Public;
      if(accessibility == "private") attr = MethodAttributes::Private;
      //else if(accessibility == "protected") attr = MethodAttributes::Protected;

      if(staticDef) attr = attr | MethodAttributes::Static;
      attr = attr | MethodAttributes::SpecialName | MethodAttributes::HideBySig;

      PropertyBuilder^ propertyBuilder = tb->DefineProperty(name, PropertyAttributes::HasDefault, propType, nullptr);
      MethodBuilder^ getPropMthdBldr = tb->DefineMethod("get_" + name, attr, propType, System::Type::EmptyTypes);
      ILGenerator^ getIl = getPropMthdBldr->GetILGenerator();

      getIl->Emit(OpCodes::Ldarg_0);
      getIl->Emit(OpCodes::Ldfld, fieldBuilder);
      getIl->Emit(OpCodes::Ret);
       
      cli::array<System::Type ^>^ props = gcnew cli::array<System::Type ^>(1);
      props[0] = propType;
      MethodBuilder^ setPropMthdBldr = tb->DefineMethod("set_" + name,
        MethodAttributes::Public | MethodAttributes::SpecialName | MethodAttributes::HideBySig,
        nullptr, props);

      ILGenerator^ setIl = setPropMthdBldr->GetILGenerator();
      Label modifyProperty = setIl->DefineLabel();
      Label exitSet = setIl->DefineLabel();

      setIl->MarkLabel(modifyProperty);
      setIl->Emit(OpCodes::Ldarg_0);
      setIl->Emit(OpCodes::Ldarg_1);
      setIl->Emit(OpCodes::Stfld, fieldBuilder);
      setIl->Emit(OpCodes::Nop);
      setIl->MarkLabel(exitSet);
      setIl->Emit(OpCodes::Ret);

      propertyBuilder->SetGetMethod(getPropMthdBldr);
      propertyBuilder->SetSetMethod(setPropMthdBldr);

      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> AddFieldToClass(const v8::Arguments& args) {
    HandleScope scope;
    try {
      TypeBuilder^ tb = (TypeBuilder ^)MarshalV8ToCLR(args[0]);
      System::String^ name = stringV82CLR(args[1]->ToString());
      System::String^ accessibility = stringV82CLR(args[2]->ToString());
      bool staticDef = ((System::Boolean ^)MarshalV8ToCLR(args[3]))->CompareTo(true);
      bool readOnly = ((System::Boolean ^)MarshalV8ToCLR(args[4]))->CompareTo(true);
      System::Type^ propType = (System::Type^)MarshalV8ToCLR(args[5]);
      System::Object ^value = MarshalV8ToCLR(args[6]);

      FieldAttributes attr = FieldAttributes::Public;
      if(accessibility == "private") attr = FieldAttributes::Private;
      //else if(accessibility == "protected") attr = FieldAttributes::Protected;
      
      if(staticDef) attr = attr | FieldAttributes::Static;
      FieldBuilder^ fieldBuilder = tb->DefineField(name, propType, attr);
      
      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> RegisterClass(const v8::Arguments& args) {
    HandleScope scope;
    try {
      TypeBuilder^ tb = (TypeBuilder ^)MarshalV8ToCLR(args[0]);
      System::Type^ t = tb->CreateType();
      return scope.Close(MarshalCLRToV8(t));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }


  /** Load an Execution of DOTNET CLR **/

  static Handle<v8::Value> LoadAssembly(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::String^ userpath = stringV82CLR(args[0]->ToString());

      System::String^ framworkRegPath = "Software\\Microsoft\\.NetFramework";
      Microsoft::Win32::RegistryKey^ netFramework = Microsoft::Win32::Registry::LocalMachine;
      netFramework = netFramework->OpenSubKey(framworkRegPath, false);
      System::String^ installRoot = netFramework->GetValue("InstallRoot")->ToString();
      System::String^ version = System::String::Format("v{0}.{1}.{2}\\",
        System::Environment::Version->Major, 
        System::Environment::Version->Minor,
        System::Environment::Version->Build); 
      System::String^ netPath = System::IO::Path::Combine(installRoot, version);

      System::Reflection::Assembly^ assembly;
      if(System::IO::File::Exists(netPath + userpath))
        assembly = System::Reflection::Assembly::LoadFrom(netPath + userpath);
      else if (System::IO::File::Exists(userpath))
        assembly = System::Reflection::Assembly::LoadFrom(userpath);
      else
        assembly = System::Reflection::Assembly::Load(userpath);

      return scope.Close(MarshalCLRToV8(assembly->GetTypes()));

    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetCLRType(const v8::Arguments& args) {
    HandleScope scope;
    System::Object^ target = MarshalV8ToCLR(args[0]);
    return scope.Close(MarshalCLRToV8(target->GetType()));
  }

  static Handle<v8::Value> GetStaticMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::Static | 
        BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e))); 
    }
  }

  static Handle<v8::Value> GetMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::Instance | 
        BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e))); 
    }
  }

  static Handle<v8::Value> ExecNew(const v8::Arguments& args) {
    HandleScope scope;
    System::Object^ target = MarshalV8ToCLR(args[0]);

    int argSize = args.Length() - 1;
    array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

    for(int i=0; i < argSize; i++)
      cshargs->SetValue(MarshalV8ToCLR(args[i + 1]),i);

    System::Type^ type = (System::Type^)(target);
    System::Object^ rtn = System::Activator::CreateInstance(type, cshargs);
    return scope.Close(MarshalCLRToV8(rtn));
  }

  static Handle<v8::Value> ExecSetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[3]);
      System::String^ field = stringV82CLR(args[2]->ToString());

      System::Type^ baseType = target->GetType();
      if(baseType != System::Type::typeid && target == System::Type::typeid)
        baseType = (System::Type ^)target;

      baseType->GetField(field,
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ field = stringV82CLR(args[1]->ToString());

      System::Type^ baseType = target->GetType();
      if(baseType != System::Type::typeid && target == System::Type::typeid)
        baseType = (System::Type ^)target;

      System::Reflection::FieldInfo ^fieldinfo = baseType->GetField(field, 
         BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);

      System::Object^ rtn = fieldinfo->GetValue(target);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ field = stringV82CLR(args[1]->ToString());
      System::Type^ baseType = target->GetType();
      if(baseType != System::Type::typeid && target == System::Type::typeid)
        baseType = (System::Type ^)target;

      System::Reflection::FieldInfo ^fieldinfo = baseType->GetField(field, 
         BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);

      System::Object^ rtn = fieldinfo->GetValue(target);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecAddEvent(const v8::Arguments& args) {
    HandleScope scope;
    System::Object^ target = MarshalV8ToCLR(args[0]);
    System::String^ event = stringV82CLR(args[1]->ToString());
    v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[2]);
    CLREventHandler ^handle = gcnew CLREventHandler(Persistent<Function>::New(callback));
    
    System::Reflection::EventInfo^ eInfo = target->GetType()->GetEvent(event);
    System::Reflection::MethodInfo^ eh = handle->GetType()->GetMethod("EventHandler");

    System::Delegate^ d = System::Delegate::CreateDelegate(eInfo->EventHandlerType, handle, eh);
    eInfo->AddEventHandler(target, d);

    return scope.Close(Undefined());
  }

 static Handle<v8::Value> ExecGetStaticMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
    System::String^ method = stringV82CLR(args[1]->ToString());
    int argSize = args.Length() - 2;
    array<System::Type^>^ cshargs = gcnew array<System::Type^>(argSize);

    for(int i=0; i < argSize; i++)
      cshargs->SetValue(MarshalV8ToCLR(args[i + 2])->GetType(),i);

    MethodInfo^ rtn = target->GetMethod(method, 
      BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy,
      nullptr, cshargs, nullptr);

    return scope.Close(MarshalCLRToV8(rtn));
  }

  static Handle<v8::Value> ExecGetMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ method = stringV82CLR(args[1]->ToString());

      int argSize = args.Length() - 2;
      array<System::Type^>^ cshargs = gcnew array<System::Type^>(argSize);

      for(int i=0; i < argSize; i++) {
        System::Object^ obj = MarshalV8ToCLR(args[i + 2]);
        if(obj != nullptr)
          cshargs->SetValue(obj->GetType(),i);
        else {
          // null was passed in, since we cannot use this to properly get the method overload
          // be reflected types we'll try jut a name match.
          MethodInfo^ rtnl = target->GetMethod(method,BindingFlags::Instance | BindingFlags::Public | BindingFlags::DeclaredOnly);
          if(rtnl == nullptr)
            return scope.Close(throwV8Exception(MarshalCLRToV8("Method could not be found: "+method)));
          else
            return scope.Close(MarshalCLRToV8(rtnl));
        }
      }

      MethodInfo^ rtn = target->GetMethod(method, 
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy,
        nullptr,
        cshargs,
        nullptr);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticPropertyObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      PropertyInfo^ rtn = target->GetProperty(property,  
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetPropertyObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      try {
        PropertyInfo^ rtn = target->GetType()->GetProperty(property, 
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);
        return scope.Close(MarshalCLRToV8(rtn));
      } catch (AmbiguousMatchException^ e) {
        PropertyInfo^ rtn = target->GetType()->GetProperty(property,
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy | BindingFlags::DeclaredOnly);
        return scope.Close(MarshalCLRToV8(rtn));
      }
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  // deprecated.
  static Handle<v8::Value> ExecMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      MethodInfo^ method = (MethodInfo^)MarshalV8ToCLR(args[0]);
      System::Object^ target = MarshalV8ToCLR(args[1]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Object^ rtn = method->Invoke(target, cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecPropertyGet(const v8::Arguments &args) {
    HandleScope scope;
    try {
      PropertyInfo^ prop = (PropertyInfo^)MarshalV8ToCLR(args[0]);
      return scope.Close(MarshalCLRToV8(prop->GetValue(MarshalV8ToCLR(args[1]))));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecPropertySet(const v8::Arguments &args) {
    HandleScope scope;
    try {
      PropertyInfo^ prop = (PropertyInfo^)MarshalV8ToCLR(args[0]);
      prop->SetValue(MarshalV8ToCLR(args[1]), MarshalV8ToCLR(args[2]));
      return scope.Close(Undefined());
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecSetProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[2]);
      System::String^ field = stringV82CLR(args[1]->ToString());
      target->GetType()->GetProperty(field)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticProperty(const v8::Arguments& args) {
    HandleScope scope;
    System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
    System::String^ property = stringV82CLR(args[1]->ToString());
    System::Object^ rtn = target->GetProperty(property,
      BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy)->GetValue(nullptr);
    return scope.Close(MarshalCLRToV8(rtn));
  }

  static Handle<v8::Value> ExecGetProperty(const v8::Arguments& args) {
    HandleScope scope;
    System::Object^ target = MarshalV8ToCLR(args[0]);
    System::String^ property = stringV82CLR(args[1]->ToString());
    try {
      System::Object^ rtn = target->GetType()->GetProperty(property,
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::FlattenHierarchy)->GetValue(target);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (AmbiguousMatchException^ e) {
      System::Object^ rtn = target->GetType()->GetProperty(property,
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy | BindingFlags::DeclaredOnly)->GetValue(target);
      return scope.Close(MarshalCLRToV8(rtn));
    }
  }

  static Handle<v8::Value> ExecStaticMethod(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Type^ type = (System::Type ^)target;
      System::String^ method = stringV82CLR(args[1]->ToString());
      System::Object^ rtn = type->InvokeMember(method,
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::InvokeMethod,
        nullptr,
        target,
        cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecMethod(const v8::Arguments& args) {
      HandleScope scope;
      try {
        System::Object^ target = MarshalV8ToCLR(args[0]);
        int argSize = args.Length() - 2;
        array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

        for(int i=0; i < argSize; i++)
          cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

        System::Type^ type = target->GetType();
        System::String^ method = stringV82CLR(args[1]->ToString());
        System::Object^ rtn = type->InvokeMember(method,
          BindingFlags::Public | BindingFlags::Instance | BindingFlags::NonPublic | BindingFlags::InvokeMethod,
          nullptr,
          target,
          cshargs);

        return scope.Close(MarshalCLRToV8(rtn));
      } 
      catch (System::Exception^ e) {
        return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
      }
  }

  static void CLR::HandleMessageLoop(System::Windows::Interop::MSG% msg, bool% handled) {
    if(msg.message == WM_APP+1)
      uv_run_nowait();
  }

  static Handle<v8::Value> GetAutoLayoutClass(const v8::Arguments& args) {
    HandleScope scope;
    AutoLayout::AutoLayoutPanel^ panel = gcnew AutoLayout::AutoLayoutPanel();
    return scope.Close(MarshalCLRToV8(panel));
  }
};

  namespace IEWebBrowserFix {
    static bool SetBrowserFeatureControlKey(wstring feature, const wchar_t *appName, DWORD value) {
      HKEY key;
      bool success = true;
      wstring featuresPath(L"Software\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\");
      wstring path(featuresPath + feature);
      if (RegCreateKeyExW(HKEY_CURRENT_USER, path.c_str(), 0, NULL, REG_OPTION_VOLATILE, KEY_WRITE, NULL, &key, NULL) != ERROR_SUCCESS)
        success = false;
      else {
        if (RegSetValueExW(key, appName, 0, REG_DWORD, (const BYTE*) &value, sizeof(value)) != ERROR_SUCCESS) success = false;
        if (RegCloseKey(key) != ERROR_SUCCESS) success = false;
      } 
      return success;
    }

    static void SetBrowserFeatureControl() {
      System::Diagnostics::Process ^process = System::Diagnostics::Process::GetCurrentProcess();
      System::String^ pName = process->Modules[0]->FileName;
      array<wchar_t>^ delim = gcnew array<wchar_t>(1);
      delim[0]='\\';
      array<System::String^>^ path = pName->Split(delim);
      pin_ptr<const wchar_t> fileNameP = PtrToStringChars(path[path->Length-1]);
      const wchar_t *fileName = fileNameP;

      SetBrowserFeatureControlKey(L"FEATURE_96DPI_PIXEL", fileName, 1); // enable high-dpi support.
      SetBrowserFeatureControlKey(L"FEATURE_BROWSER_EMULATION", fileName, 00000); // turn off compatibility mode.
      SetBrowserFeatureControlKey(L"FEATURE_AJAX_CONNECTIONEVENTS", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_ENABLE_CLIPCHILDREN_OPTIMIZATION", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_GPU_RENDERING", fileName, 1); // use GPU rendering
      SetBrowserFeatureControlKey(L"FEATURE_IVIEWOBJECTDRAW_DMLT9_WITH_GDI  ", fileName, 0); // force directX
      SetBrowserFeatureControlKey(L"FEATURE_NINPUT_LEGACYMODE", fileName, 0);
      SetBrowserFeatureControlKey(L"FEATURE_DISABLE_NAVIGATION_SOUNDS", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_SCRIPTURL_MITIGATION", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_SPELLCHECKING", fileName, 0);
      SetBrowserFeatureControlKey(L"FEATURE_STATUS_BAR_THROTTLING", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_VALIDATE_NAVIGATE_URL", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_WEBOC_DOCUMENT_ZOOM", fileName, 1); // allow zoom.
      SetBrowserFeatureControlKey(L"FEATURE_WEBOC_POPUPMANAGEMENT", fileName, 0); // disallow auto-popups
      SetBrowserFeatureControlKey(L"FEATURE_ADDON_MANAGEMENT", fileName, 0); // disallow auto-addons/plugins
      SetBrowserFeatureControlKey(L"FEATURE_WEBSOCKET", fileName, 1);
      SetBrowserFeatureControlKey(L"FEATURE_WINDOW_RESTRICTIONS", fileName, 0); // disallow popups
    }
    
  }

extern "C" void CLR_Init(Handle<v8::Object> target) {
  
  // Fix registry and "FEATURE" controls, these help align IE with a normal behavior
  // expected (on a per app registry setting basis).  This does not set global registry
  // values for anything outside of our application.
  IEWebBrowserFix::SetBrowserFeatureControl();

  bufferConstructor = Persistent<Function>::New(Handle<Function>::Cast(
      Context::GetCurrent()->Global()->Get(v8::String::New("Buffer"))));

  // OLD, non-optimized execution methods.
  NODE_SET_METHOD(target, "execNew", CLR::ExecNew);
  NODE_SET_METHOD(target, "execAddEvent", CLR::ExecAddEvent);
  NODE_SET_METHOD(target, "execMethod", CLR::ExecMethod);
  NODE_SET_METHOD(target, "execStaticMethod", CLR::ExecStaticMethod);
  NODE_SET_METHOD(target, "execSetField", CLR::ExecSetField);
  NODE_SET_METHOD(target, "execGetField", CLR::ExecGetField);
  NODE_SET_METHOD(target, "execGetStaticField", CLR::ExecGetStaticField);
  NODE_SET_METHOD(target, "execSetProperty", CLR::ExecSetProperty);
  NODE_SET_METHOD(target, "execGetProperty", CLR::ExecGetProperty);
  NODE_SET_METHOD(target, "execGetStaticProperty", CLR::ExecGetStaticProperty);

  // get programmatic information
  NODE_SET_METHOD(target, "loadAssembly", CLR::LoadAssembly);
  NODE_SET_METHOD(target, "getMemberTypes", CLR::GetMemberTypes);
  NODE_SET_METHOD(target, "getStaticMemberTypes", CLR::GetStaticMemberTypes);
  NODE_SET_METHOD(target, "getCLRType", CLR::GetCLRType);

  // create classes
  NODE_SET_METHOD(target, "classCreate", CLR::CreateClass);
  NODE_SET_METHOD(target, "classAddConstructor", CLR::AddConstructor);
  NODE_SET_METHOD(target, "classAddMethod", CLR::AddMethodToClass);
  NODE_SET_METHOD(target, "classAddProperty", CLR::AddPropertyToClass);
  NODE_SET_METHOD(target, "classAddField", CLR::AddFieldToClass);
  NODE_SET_METHOD(target, "classRegister", CLR::RegisterClass);

  // 2nd gen optimized execution
  NODE_SET_METHOD(target, "getStaticPropertyObject", CLR::ExecGetStaticPropertyObject);
  NODE_SET_METHOD(target, "getPropertyObject", CLR::ExecGetPropertyObject);
  NODE_SET_METHOD(target, "getMethodObject", CLR::ExecGetMethodObject);
  NODE_SET_METHOD(target, "getStaticMethodObject", CLR::ExecGetStaticMethodObject);
  NODE_SET_METHOD(target, "getProperty", CLR::ExecPropertyGet);
  NODE_SET_METHOD(target, "setProperty", CLR::ExecPropertySet);
  NODE_SET_METHOD(target, "callMethod", CLR::ExecMethodObject);
  NODE_SET_METHOD(target, "getAutoLayoutClass", CLR::GetAutoLayoutClass);
  
  // Register the thread handle to communicate back to handle application
  // specific events when in WPF mode.
  System::Windows::Interop::ComponentDispatcher::ThreadFilterMessage += 
      gcnew System::Windows::Interop::ThreadMessageEventHandler(CLR::HandleMessageLoop);
}
