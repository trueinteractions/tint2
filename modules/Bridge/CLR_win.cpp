
#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include <stdio.h>
#include <vcclr.h>

#using <system.dll>
#using <System.Core.dll>

using namespace v8;
using namespace System::Collections::Generic;
using namespace System::Reflection;
using namespace System::Runtime::InteropServices;
using namespace System::Threading::Tasks;
using namespace System::Threading;
using namespace Microsoft::Win32;

/* Stubs for CLR, these are needed otherwise we'll get a linking 
 * warning complaining that the exe will not run. */
namespace v8 {
  namespace internal {
    class Object {};
  }
  struct HeapStatsUpdate {};
}

Persistent<Function> bufferConstructor;

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

System::String^ stringV82CLR(Handle<v8::String> text)
{
    HandleScope scope;
    String::Utf8Value utf8text(text);
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

class CLR {
  CLR() { }

public:
  static System::Object^ MarshalV8ToCLR(Handle<v8::Value> jsdata)
  {
      HandleScope scope;
      /*if (jsdata->IsFunction()) 
      {
          NodejsFunc^ functionContext = gcnew NodejsFunc(Handle<v8::Function>::Cast(jsdata));
          System::Func<System::Object^,Task<System::Object^>^>^ netfunc = 
              gcnew System::Func<System::Object^,Task<System::Object^>^>(
                  functionContext, &NodejsFunc::FunctionWrapper);

          return netfunc;
      }*/
      /*else if (node::Buffer::HasInstance(jsdata))
      {
          Handle<v8::Object> jsbuffer = jsdata->ToObject();
          cli::array<byte>^ netbuffer = gcnew cli::array<byte>((int)node::Buffer::Length(jsbuffer));
          if (netbuffer->Length > 0) 
          {
              pin_ptr<byte> pinnedNetbuffer = &netbuffer[0];
              memcpy(pinnedNetbuffer, node::Buffer::Data(jsbuffer), netbuffer->Length);
          }

          return netbuffer;
      }else  */
      if (jsdata->IsArray())
      {
          Handle<v8::Array> jsarray = Handle<v8::Array>::Cast(jsdata);
          cli::array<System::Object^>^ netarray = gcnew cli::array<System::Object^>(jsarray->Length());
          for (unsigned int i = 0; i < jsarray->Length(); i++)
          {
              netarray[i] = MarshalV8ToCLR(jsarray->Get(i));
          }

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
      {
          return stringV82CLR(Handle<v8::String>::Cast(jsdata));
      }
      else if (jsdata->IsBoolean())
      {
          return jsdata->BooleanValue();
      }
      else if (jsdata->IsInt32())
      {
          return jsdata->Int32Value();
      }
      else if (jsdata->IsUint32()) 
      {
          return jsdata->Uint32Value();
      }
      else if (jsdata->IsNumber()) 
      {
          return jsdata->NumberValue();
      } 
      else if (jsdata->IsUndefined() || jsdata->IsNull())
      {
          return nullptr;
      } 
      else if (node::Buffer::HasInstance(jsdata)) {
        try {
          CppClass *data = (CppClass *)node::Buffer::Data(jsdata.As<v8::Object>());
          System::Object ^obj = (*(data->obj));
          return obj;
        } catch (System::Exception^ e) {
          //throwV8Exception(MarshalCLRExceptionToV8(e));
          System::Console::WriteLine(e->ToString());
          exit(1);
        }
      }else if (jsdata->IsObject()) 
      {
          IDictionary<System::String^,System::Object^>^ netobject = gcnew System::Dynamic::ExpandoObject();
          Handle<v8::Object> jsobject = Handle<v8::Object>::Cast(jsdata);
          Handle<v8::Array> propertyNames = jsobject->GetPropertyNames();
          for (unsigned int i = 0; i < propertyNames->Length(); i++)
          {
              Handle<v8::String> name = Handle<v8::String>::Cast(propertyNames->Get(i));
              String::Utf8Value utf8name(name);
              System::String^ netname = gcnew System::String(*utf8name);
              System::Object^ netvalue = MarshalV8ToCLR(jsobject->Get(name));
              netobject->Add(netname, netvalue);
          }

          return netobject;
      }
      else
      {
          throw gcnew System::Exception("Unable to convert V8 value to CLR value.");
      }
  }

  static Handle<v8::Value> MarshalCLRToV8(System::Object^ netdata) {
    HandleScope scope;
    Handle<v8::Value> jsdata;

    if (netdata == nullptr)
    {
        return scope.Close(Null());
    }

    System::Type^ type = netdata->GetType();
    if (type == System::String::typeid)
    {
        jsdata = stringCLR2V8((System::String^)netdata);
    }
    else if (type == System::Char::typeid)
    {
        jsdata = stringCLR2V8(((System::Char^)netdata)->ToString());
    }
    else if (type == bool::typeid)
    {
        jsdata = v8::Boolean::New((bool)netdata);
    }
    else if (type == System::Guid::typeid)
    {
        jsdata = stringCLR2V8(netdata->ToString());
    }
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
    {
        jsdata = stringCLR2V8(netdata->ToString());
    }
    else if (type == System::Uri::typeid)
    {
        jsdata = stringCLR2V8(netdata->ToString());
    }
    else if (type == int::typeid)
    {
        jsdata = v8::Integer::New((int)netdata);
    }
    else if (type == System::Int64::typeid)
    {
        jsdata = v8::Number::New(((System::IConvertible^)netdata)->ToDouble(nullptr));
    }
    else if (type == double::typeid)
    {
        jsdata = v8::Number::New((double)netdata);
    }
    else if (type == float::typeid)
    {
        jsdata = v8::Number::New((float)netdata);
    }
    else if (type->IsPrimitive || type == System::Decimal::typeid)
    {
        System::IConvertible^ convertible = dynamic_cast<System::IConvertible^>(netdata);
        if (convertible != nullptr)
        {
            jsdata = stringCLR2V8(convertible->ToString());
        }
        else
        {
            jsdata = stringCLR2V8(netdata->ToString());
        }
    }
    /*else if (type->IsEnum)
    {
        jsdata = stringCLR2V8(netdata->ToString());
    }*/
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
  #ifdef DONOTBUILD
    else if (dynamic_cast<System::Collections::Generic::IDictionary<System::String^,System::Object^>^>(netdata) != nullptr)
    {
        Handle<v8::Object> result = v8::Object::New();
        for each (System::Collections::Generic::KeyValuePair<System::String^,System::Object^>^ pair 
            in (System::Collections::Generic::IDictionary<System::String^,System::Object^>^)netdata)
        {
            result->Set(stringCLR2V8(pair->Key), MarshalCLRToV8(pair->Value));
        }

        jsdata = result;
    }    
    else if (dynamic_cast<System::Collections::IDictionary^>(netdata) != nullptr)
    {
        Handle<v8::Object> result = v8::Object::New();
        for each (System::Collections::DictionaryEntry^ entry in (System::Collections::IDictionary^)netdata)
        {
            if (dynamic_cast<System::String^>(entry->Key) != nullptr)
            result->Set(stringCLR2V8((System::String^)entry->Key), MarshalCLRToV8(entry->Value));
        }

        jsdata = result;
    }
    else if (dynamic_cast<System::Collections::IEnumerable^>(netdata) != nullptr)
    {
        Handle<v8::Array> result = v8::Array::New();
        unsigned int i = 0;
        for each (System::Object^ entry in (System::Collections::IEnumerable^)netdata)
        {
            result->Set(i++, MarshalCLRToV8(entry));
        }

        jsdata = result;
    }
    else if (type == System::Func<System::Object^,Task<System::Object^>^>::typeid)
    {
        jsdata = Initialize((System::Func<System::Object^,Task<System::Object^>^>^)netdata);
    }
    else if (System::Exception::typeid->IsAssignableFrom(type))
    {
        jsdata = MarshalCLRExceptionToV8((System::Exception^)netdata);
    }
    else
    {
        jsdata = MarshalCLRObjectToV8(netdata);
    }
  #else
    else
    {
      try {
        System::Type^ type = netdata->GetType();
        CppClass *n = new CppClass();
        *(n->obj) = netdata;
        void *user_data = NULL;
        size_t sz = sizeof(CppClass *);
        node::Buffer *buf = node::Buffer::New((char *)n, sz, wrap_pointer_cb2, user_data);
        jsdata = buf->handle_;
      } catch (System::Exception^ e) {
        System::Console::WriteLine(e->ToString());
        return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
      }
    }
  #endif
    return scope.Close(jsdata);
  }
  static Handle<v8::Object> MarshalCLRObjectToV8(System::Object^ netdata)
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
  static Handle<v8::Value> MarshalCLRExceptionToV8(System::Exception^ exception)
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
          message = stringCLR2V8(exception->Message);
          name = stringCLR2V8(exception->GetType()->FullName);
      }   
          
      // Construct an error that is just used for the prototype - not verify efficient
      // but 'typeof Error' should work in JavaScript
      result->SetPrototype(v8::Exception::Error(message));
      result->Set(String::NewSymbol("message"), message);
      
      // Recording the actual type - 'name' seems to be the common used property
      result->Set(String::NewSymbol("name"), name);

      return scope.Close(result);
  }

  static Handle<v8::Value> LoadAssembly(const v8::Arguments& args) {
    HandleScope scope;
    try {
      Handle<v8::String> m = args[0]->ToString();
      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      System::String^ framworkRegPath = "Software\\Microsoft\\.NetFramework";
      Microsoft::Win32::RegistryKey^ netFramework = Microsoft::Win32::Registry::LocalMachine;
      netFramework = netFramework->OpenSubKey(framworkRegPath, false);
      System::String^ installRoot = netFramework->GetValue("InstallRoot")->ToString();
      System::String^ version = System::String::Format("v{0}.{1}.{2}\\",
        System::Environment::Version->Major, 
        System::Environment::Version->Minor,
        System::Environment::Version->Build); 
      System::String^ netPath = System::IO::Path::Combine(installRoot, version);

      System::Reflection::Assembly^ assembly = System::Reflection::Assembly::LoadFrom(netPath + gcnew System::String(buf));
      return scope.Close(MarshalCLRToV8(assembly->GetTypes()));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetCLRType(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      return scope.Close(MarshalCLRToV8(target->GetType()));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetStaticMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::Static | BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::Instance | BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecNew(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);

      int argSize = args.Length() - 1;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i+1]),i);

      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = System::Activator::CreateInstance(type, cshargs);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecSetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      Handle<v8::String> m = args[2]->ToString();
      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[3]);
      System::String^ field = gcnew System::String(buf);
      target->GetType()->GetField(field)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      Handle<v8::String> m = args[1]->ToString();
      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ field = gcnew System::String(buf);
      System::Object^ rtn = target->GetType()->GetField(field)->GetValue(target);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecSetProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      Handle<v8::String> m = args[1]->ToString();
      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[2]);
      System::String^ field = gcnew System::String(buf);
      target->GetType()->GetProperty(field)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      Handle<v8::String> m = args[1]->ToString();
      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ field = gcnew System::String(buf);
      System::Object^ rtn = target->GetType()->GetProperty(field)->GetValue(target);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecStaticMethod(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      Handle<v8::String> m = args[1]->ToString();

      int buf_size = m->Utf8Length() + 1;
      char *buf = new char[buf_size];
      m->WriteUtf8(buf, buf_size);

      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Type^ type = target->GetType();
      System::String^ method = gcnew System::String(buf);
      System::Object^ rtn = type->InvokeMember(method,
        BindingFlags::Static | BindingFlags::Public | BindingFlags::InvokeMethod | BindingFlags::Instance,
        nullptr,
        target,
        cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecMethod(const v8::Arguments& args) {
      HandleScope scope;
      try {
        System::Object^ target = MarshalV8ToCLR(args[0]);
        Handle<v8::String> m = args[1]->ToString();

        int buf_size = m->Utf8Length() + 1;
        char *buf = new char[buf_size];
        m->WriteUtf8(buf, buf_size);

        int argSize = args.Length() - 2;
        array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

        for(int i=0; i < argSize; i++)
          cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

        System::Type^ type = target->GetType();
        System::String^ method = gcnew System::String(buf);
        System::Object^ rtn = type->InvokeMember(method,
          BindingFlags::Public | BindingFlags::Instance | 
            BindingFlags::InvokeMethod,
          nullptr,
          target,
          cshargs);

        return scope.Close(MarshalCLRToV8(rtn));
      } 
      catch (System::Exception^ e)
      {
        System::Console::WriteLine(e->ToString());
        return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
      }
  }
};


static Handle<Value> execMethod(const v8::Arguments& args) { return CLR::ExecMethod(args); }
static Handle<Value> execStaticMethod(const v8::Arguments& args) { return CLR::ExecStaticMethod(args); }
static Handle<Value> setField(const v8::Arguments& args) { return CLR::ExecSetField(args); }
static Handle<Value> getField(const v8::Arguments& args) { return CLR::ExecGetField(args); }
static Handle<Value> setProperty(const v8::Arguments& args) { return CLR::ExecSetProperty(args); }
static Handle<Value> getProperty(const v8::Arguments& args) { return CLR::ExecGetProperty(args); }
static Handle<Value> execNew(const v8::Arguments& args) { return CLR::ExecNew(args); }
static Handle<Value> loadAssembly(const v8::Arguments& args) { return CLR::LoadAssembly(args); }
static Handle<Value> getMemberTypes(const v8::Arguments& args) { return CLR::GetMemberTypes(args); }
static Handle<Value> getStaticMemberTypes(const v8::Arguments& args) { return CLR::GetStaticMemberTypes(args); }
static Handle<Value> getType(const v8::Arguments& args) { return CLR::GetCLRType(args); }


extern "C" void CLR_Init(Handle<Object> target) {
    bufferConstructor = Persistent<Function>::New(Handle<Function>::Cast(
        Context::GetCurrent()->Global()->Get(String::New("Buffer")))); 
    NODE_SET_METHOD(target, "execNew", execNew);
    NODE_SET_METHOD(target, "execMethod", execMethod);
    NODE_SET_METHOD(target, "execStaticMethod", execStaticMethod);
    NODE_SET_METHOD(target, "execSetField", setField);
    NODE_SET_METHOD(target, "execGetField", getField);
    NODE_SET_METHOD(target, "execSetProperty", setProperty);
    NODE_SET_METHOD(target, "execGetProperty", getProperty);
    NODE_SET_METHOD(target, "loadAssembly", loadAssembly);
    NODE_SET_METHOD(target, "getMemberTypes", getMemberTypes);
    NODE_SET_METHOD(target, "getStaticMemberTypes", getStaticMemberTypes);
    NODE_SET_METHOD(target, "getType", getType);
}

// NODE_MODULE(edge, init);
/*

Handle<v8::Value> CLRProxy(const v8::Arguments& args) {
  HandleScope scope;
  Handle<v8::External> correlator = Handle<v8::External>::Cast(args[2]);
  CLRWrap* wrap = (CLRWrap*)(correlator->Value());
  CLR^ CLR = wrap->CLR;
  return scope.Close(CLR->Call(args[0], args[1]));
}

void CLRProxyNearDeath(v8::Persistent<v8::Value> object, void* parameters) {
  CLRWrap* wrap = (CLRWrap*)parameters;
  object.Dispose();
  object.Clear();
  wrap->CLR = nullptr;
  delete wrap;
}
*/
/*

*/
/*
Handle<v8::Function> Initialize(System::Func<System::Object^,Task<System::Object^>^>^ func) {
    static Persistent<v8::Function> proxyFactory;
    static Persistent<v8::Function> proxyFunction;        

    HandleScope scope;

    CLR^ app = gcnew CLR();
    app->func = func;
    CLRWrap* wrap = new CLRWrap;
    wrap->CLR = app;    

    // See https://github.com/tjanczuk/edge/issues/128 for context
    
    if (proxyFactory.IsEmpty())
    {
        proxyFunction = Persistent<v8::Function>::New(
            FunctionTemplate::New(CLRProxy)->GetFunction());
        Handle<v8::String> code = v8::String::New(
            "(function (f, ctx) { return function (d, cb) { return f(d, cb, ctx); }; })");
        proxyFactory = Persistent<v8::Function>::New(
            Handle<v8::Function>::Cast(v8::Script::Compile(code)->Run()));
    }

    Handle<v8::Value> factoryArgv[] = { proxyFunction, v8::External::New((void*)wrap) };
    v8::Persistent<v8::Function> funcProxy = v8::Persistent<v8::Function>::New(
        Handle<v8::Function>::Cast(
            proxyFactory->Call(v8::Context::GetCurrent()->Global(), 2, factoryArgv)));
    funcProxy.MakeWeak((void*)wrap, CLRProxyNearDeath);

    return scope.Close(funcProxy);
}

Handle<v8::Value> Initialize(const v8::Arguments& args) {
    HandleScope scope;
    Handle<v8::Object> options = args[0]->ToObject();
    Assembly^ assembly;
    System::String^ typeName;
    System::String^ methodName;

    try 
    {
        Handle<v8::Function> result;

        Handle<v8::Value> jsassemblyFile = options->Get(String::NewSymbol("assemblyFile"));
        if (jsassemblyFile->IsString()) {
            // reference .NET code through pre-compiled CLR assembly 
            String::Utf8Value assemblyFile(jsassemblyFile);
            String::Utf8Value nativeTypeName(options->Get(String::NewSymbol("typeName")));
            String::Utf8Value nativeMethodName(options->Get(String::NewSymbol("methodName")));  
            typeName = gcnew System::String(*nativeTypeName);
            methodName = gcnew System::String(*nativeMethodName);      
            assembly = Assembly::UnsafeLoadFrom(gcnew System::String(*assemblyFile));
            CLRReflectionWrap^ wrap = CLRReflectionWrap::Create(assembly, typeName, methodName);
            result = Initialize(
                gcnew System::Func<System::Object^,Task<System::Object^>^>(
                    wrap, &CLRReflectionWrap::Call));
        }
        else {
            // reference .NET code throgh embedded source code that needs to be compiled
            String::Value compilerFile(options->Get(String::NewSymbol("compiler")));
            cli::array<unsigned char>^ buffer = gcnew cli::array<unsigned char>(compilerFile.length() * 2);
            for (int k = 0; k < compilerFile.length(); k++)
            {
                buffer[k * 2] = (*compilerFile)[k] & 255;
                buffer[k * 2 + 1] = (*compilerFile)[k] >> 8;
            }
            assembly = Assembly::UnsafeLoadFrom(System::Text::Encoding::Unicode->GetString(buffer));
            System::Type^ compilerType = assembly->GetType("EdgeCompiler", true, true);
            System::Object^ compilerInstance = System::Activator::CreateInstance(compilerType, false);
            MethodInfo^ compileFunc = compilerType->GetMethod("CompileFunc", BindingFlags::Instance | BindingFlags::Public);
            if (compileFunc == nullptr) 
            {
                throw gcnew System::InvalidOperationException(
                    "Unable to access the CompileFunc method of the EdgeCompiler class in the edge.js compiler assembly.");
            }

            System::Object^ parameters = MarshalV8ToCLR(options);
            System::Func<System::Object^,Task<System::Object^>^>^ func = 
                (System::Func<System::Object^,Task<System::Object^>^>^)compileFunc->Invoke(
                    compilerInstance, gcnew array<System::Object^> { parameters });
            result = Initialize(func);
        }

        return scope.Close(result);
    }
    catch (System::Exception^ e)
    {
      System::Console::WriteLine(e->ToString());
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
}

void edgeAppCompletedOnCLRThread(Task<System::Object^>^ task, System::Object^ state) {
    CLRInvokeContext^ context = (CLRInvokeContext^)state;
    context->CompleteOnCLRThread(task);
}
*/
/*
Handle<v8::Value> Call(Handle<v8::Value> payload, Handle<v8::Value> callback)
{
    HandleScope scope;
    
    try 
    {
        CLRInvokeContext^ context = gcnew CLRInvokeContext(callback);
        context->Payload = MarshalV8ToCLR(payload);
        Task<System::Object^>^ task = this->func(context->Payload);
        if (task->IsCompleted)
        {
            // Completed synchronously. Return a value or invoke callback based on call pattern.
            context->Task = task;
            return scope.Close(context->CompleteOnV8Thread());
        }
        else if (context->Sync)
        {
            // Will complete asynchronously but was called as a synchronous function.
            throw gcnew System::InvalidOperationException("The JavaScript function was called synchronously "
                + "but the underlying CLR function returned without completing the Task. Call the "
                + "JavaScript function asynchronously.");
        }
        else 
        {
            // Create a GC root around the CLRInvokeContext to ensure it is not garbage collected
            // while the CLR function executes asynchronously. 
            context->InitializeAsyncOperation();

            // Will complete asynchronously. Schedule continuation to finish processing.
            task->ContinueWith(gcnew System::Action<Task<System::Object^>^,System::Object^>(
                edgeAppCompletedOnCLRThread), context);
        }
    }
    catch (System::Exception^ e)
    {
        return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }

    return scope.Close(Undefined());    
}


Handle<Value> initializeCLR(const v8::Arguments& args)
{
    return Initialize(args);
}
*/

/*

#include "uv-common.h"
#include <vcclr.h>
#using <WindowsBase.dll>
#using <System.dll>
#using <System.Windows.Forms.dll>

//  System::Threading::Thread ^secondThread = System::Threading::Thread::CurrentThread;
//  secondThread->Name = "Tint EventLoop Watcher";

extern "C" void node_terminate();
extern "C" void node_pump();

void OnUVPumpMessage(System::Object ^ ignored) {
  try {
    node_pump();
  } catch (System::Exception^ e) {
    System::Console::WriteLine(e->ToString());
  }
}

public ref class AppDelegate {
public:
  AppDelegate() :initialized(false), context(nullptr) {}

  System::Threading::ExecutionContext^ context;
  bool initialized;
  void OnTerminate(System::Object^, System::EventArgs^) {
    node_terminate();
  }
  void RunUVNoWaitOnMainThread() {
    try {
      System::Console::WriteLine("initialized is: "+this->initialized);
      if(this->initialized) {
        System::Threading::ExecutionContext::Run(this->context, 
          gcnew System::Threading::ContextCallback(&OnUVPumpMessage), nullptr);
      } else {
        System::Console::WriteLine("Skipped uv pump, context isn't alive.");
      }
    } catch (System::Exception^ e) {
      System::Console::WriteLine(e->ToString());
    }
  }
  static AppDelegate^ Main = nullptr;
};

extern "C" bool UVNeedPump() {
  if(AppDelegate::Main != nullptr) {
    AppDelegate::Main->RunUVNoWaitOnMainThread();
    return true;
  } else {
    return false;
  }
}

extern "C" void InitializeCLR() {
  AppDelegate::Main = gcnew AppDelegate();
  System::Windows::Forms::Application::ApplicationExit += gcnew System::EventHandler(AppDelegate::Main, 
    &AppDelegate::OnTerminate);

  System::Threading::Thread::CurrentThread->Name = "Tint EventLoop";
  AppDelegate::Main->context = System::Threading::ExecutionContext::Capture();
  AppDelegate::Main->initialized = true;
  System::Windows::Forms::Application::Run();
}
*/
/*

PersistentDisposeContext::PersistentDisposeContext(Persistent<Value>* handle) 
    : ptr((void*)handle)
{
    DBG("PersistentDisposeContext::PersistentDisposeContext");
}

void PersistentDisposeContext::CallDisposeOnV8Thread() {
    DBG("PersistentDisposeContext::CallDisposeOnV8Thread");

    Persistent<Value>* handle = (Persistent<Value>*)ptr.ToPointer();
    (*handle).Dispose();
    (*handle).Clear();
    delete handle;
}
Handle<Value> v8FuncCallback(const v8::Arguments& args)
{
    DBG("v8FuncCallback");
    HandleScope scope;
    Handle<v8::External> correlator = Handle<v8::External>::Cast(args[2]);
    NodejsFuncInvokeContextWrap* wrap = (NodejsFuncInvokeContextWrap*)(correlator->Value());
    NodejsFuncInvokeContext^ context = wrap->context;    
    wrap->context = nullptr;
    if (!args[0]->IsUndefined() && !args[0]->IsNull())
    {
        context->CompleteWithError(gcnew System::Exception(exceptionV82stringCLR(args[0])));
    }
    else 
    {
        context->CompleteWithResult(args[1]);
    }
    return scope.Close(Undefined());
}

NodejsFuncInvokeContext::NodejsFuncInvokeContext(
        NodejsFunc^ functionContext, System::Object^ payload)
{
    DBG("NodejsFuncInvokeContext::NodejsFuncInvokeContext");
    this->functionContext = functionContext;
    this->payload = payload;
    this->TaskCompletionSource = gcnew System::Threading::Tasks::TaskCompletionSource<System::Object^>();
    this->wrap = NULL;
}

NodejsFuncInvokeContext::~NodejsFuncInvokeContext()
{
    this->!NodejsFuncInvokeContext();
}

NodejsFuncInvokeContext::!NodejsFuncInvokeContext()
{
    DBG("NodejsFuncInvokeContext::!NodejsFuncInvokeContext");
    if (this->wrap)
    {
        delete this->wrap;
        this->wrap = NULL;
    }
}

void NodejsFuncInvokeContext::CallFuncOnV8Thread()
{
    DBG("NodejsFuncInvokeContext::CallFuncOnV8Thread");

    static Persistent<v8::Function> callbackFactory;
    static Persistent<v8::Function> callbackFunction;

    HandleScope scope;
    try 
    {
        Handle<v8::Value> jspayload = MarshalCLRToV8(this->payload);

        // See https://github.com/tjanczuk/edge/issues/125 for context
        
        if (callbackFactory.IsEmpty())
        {
            callbackFunction = Persistent<v8::Function>::New(
                FunctionTemplate::New(v8FuncCallback)->GetFunction());
            Handle<v8::String> code = v8::String::New(
                "(function (cb, ctx) { return function (e, d) { return cb(e, d, ctx); }; })");
            callbackFactory = Persistent<v8::Function>::New(
                Handle<v8::Function>::Cast(v8::Script::Compile(code)->Run()));
        }

        this->wrap = new NodejsFuncInvokeContextWrap;
        this->wrap->context = this;
        Handle<v8::Value> factoryArgv[] = { callbackFunction, v8::External::New((void*)this->wrap) };
        Handle<v8::Function> callback = Handle<v8::Function>::Cast(
            callbackFactory->Call(v8::Context::GetCurrent()->Global(), 2, factoryArgv));        

        Handle<v8::Value> argv[] = { jspayload, callback };
        TryCatch tryCatch;
        (*(this->functionContext->Func))->Call(v8::Context::GetCurrent()->Global(), 2, argv);
        if (tryCatch.HasCaught()) 
        {
            this->wrap->context = nullptr;
            this->CompleteWithError(gcnew System::Exception(exceptionV82stringCLR(tryCatch.Exception())));
        }
    }
    catch (System::Exception^ ex)
    {
        this->CompleteWithError(ex);
    }
}

void NodejsFuncInvokeContext::Complete()
{
    DBG("NodejsFuncInvokeContext::Complete");
    if (this->exception != nullptr)
    {
        this->TaskCompletionSource->SetException(this->exception);
    }
    else 
    {
        this->TaskCompletionSource->SetResult(this->result);
    }
}

void NodejsFuncInvokeContext::CompleteWithError(System::Exception^ exception)
{
    DBG("NodejsFuncInvokeContext::CompleteWithError");
    this->exception = exception;
    Task::Run(gcnew System::Action(this, &NodejsFuncInvokeContext::Complete));
}

void NodejsFuncInvokeContext::CompleteWithResult(Handle<v8::Value> result)
{
    DBG("NodejsFuncInvokeContext::CompleteWithResult");
    try 
    {
        this->result = MarshalV8ToCLR(result);
        Task::Run(gcnew System::Action(this, &NodejsFuncInvokeContext::Complete));
    }
    catch (System::Exception^ e)
    {
        this->CompleteWithError(e);
    }
}


NodejsFunc::NodejsFunc(Handle<Function> function)
{
    DBG("NodejsFunc::NodejsFunc");
    this->Func = new Persistent<Function>;
    *(this->Func) = Persistent<Function>::New(function);
}

NodejsFunc::~NodejsFunc()
{
    this->!NodejsFunc();
}

NodejsFunc::!NodejsFunc()
{
    DBG("NodejsFunc::!NodejsFunc");
    PersistentDisposeContext^ context = gcnew PersistentDisposeContext((Persistent<Value>*)this->Func);
    ClrActionContext* data = new ClrActionContext;
    data->action = gcnew System::Action(context, &PersistentDisposeContext::CallDisposeOnV8Thread);
    uv_edge_async_t* uv_edge_async = V8SynchronizationContext::RegisterAction(ClrActionContext::ActionCallback, data);
    V8SynchronizationContext::ExecuteAction(uv_edge_async);
}

Task<System::Object^>^ NodejsFunc::FunctionWrapper(System::Object^ payload)
{
    DBG("NodejsFunc::FunctionWrapper");
    NodejsFuncInvokeContext^ context = gcnew NodejsFuncInvokeContext(this, payload);
    ClrActionContext* data = new ClrActionContext;
    data->action = gcnew System::Action(context, &NodejsFuncInvokeContext::CallFuncOnV8Thread);
    uv_edge_async_t* uv_edge_async = V8SynchronizationContext::RegisterAction(ClrActionContext::ActionCallback, data);
    V8SynchronizationContext::ExecuteAction(uv_edge_async);

    return context->TaskCompletionSource->Task;
}

void ClrActionContext::ActionCallback(void* data)
{
    ClrActionContext* context = (ClrActionContext*)data;
    System::Action^ action = context->action;
    delete context;
    action();
}


CLRInvokeContext::CLRInvokeContext(Handle<v8::Value> callbackOrSync)
{
    DBG("CLRInvokeContext::CLRInvokeContext");
    if (callbackOrSync->IsFunction())
    {
        this->callback = new Persistent<Function>;
        *(this->callback) = Persistent<Function>::New(Handle<Function>::Cast(callbackOrSync));
        this->Sync = false;
    }
    else 
    {
        this->Sync = callbackOrSync->BooleanValue();
    }

    this->uv_edge_async = NULL;
}

void CLRInvokeContext::DisposeCallback()
{
    if (this->callback)
    {
        DBG("CLRInvokeContext::DisposeCallback");
        (*(this->callback)).Dispose();
        (*(this->callback)).Clear();
        delete this->callback;
        this->callback = NULL;        
    }
}

void CLRInvokeContext::CompleteOnCLRThread(System::Threading::Tasks::Task<System::Object^>^ task)
{
    DBG("CLRInvokeContext::CompleteOnCLRThread");
    this->Task = task;
    V8SynchronizationContext::ExecuteAction(this->uv_edge_async);
}

void CLRInvokeContext::InitializeAsyncOperation()
{
    // Create a uv_edge_async instance representing V8 async operation that will complete 
    // when the CLR function completes. The ClrActionContext is used to ensure the CLRInvokeContext
    // remains GC-rooted while the CLR function executes.

    ClrActionContext* data = new ClrActionContext;
    data->action = gcnew System::Action(this, &CLRInvokeContext::CompleteOnV8ThreadAsynchronous);
    this->uv_edge_async = V8SynchronizationContext::RegisterAction(ClrActionContext::ActionCallback, data);
}

void CLRInvokeContext::CompleteOnV8ThreadAsynchronous()
{
    HandleScope scope;
    this->CompleteOnV8Thread();
}

Handle<v8::Value> CLRInvokeContext::CompleteOnV8Thread()
{
    DBG("CLRInvokeContext::CompleteOnV8Thread");

    HandleScope handleScope;

    // The uv_edge_async was already cleaned up in V8SynchronizationContext::ExecuteAction
    this->uv_edge_async = NULL;

    if (!this->Sync && !this->callback)
    {
        // this was an async call without callback specified
        DBG("CLRInvokeContext::CompleteOnV8Thread - async without callback");
        return handleScope.Close(Undefined());
    }

    Handle<Value> argv[] = { Undefined(), Undefined() };
    int argc = 1;

    switch (this->Task->Status) {
        default:
            argv[0] = v8::String::New("The operation reported completion in an unexpected state.");
        break;
        case TaskStatus::Faulted:
            if (this->Task->Exception != nullptr) {
                argv[0] = MarshalCLRExceptionToV8(this->Task->Exception);
            }
            else {
                argv[0] = v8::String::New("The operation has failed with an undetermined error.");
            }
        break;
        case TaskStatus::Canceled:
            argv[0] = v8::String::New("The operation was cancelled.");
        break;
        case TaskStatus::RanToCompletion:
            argc = 2;
            try {
                argv[1] = MarshalCLRToV8(this->Task->Result);
            }
            catch (System::Exception^ e) {
                argc = 1;
                argv[0] = MarshalCLRExceptionToV8(e);
            }
        break;
    };

    if (!this->Sync)
    {
        // complete the asynchronous call to C# by invoking a callback in JavaScript
        TryCatch try_catch;
        (*(this->callback))->Call(v8::Context::GetCurrent()->Global(), argc, argv);
        this->DisposeCallback();
        if (try_catch.HasCaught()) 
        {
            node::FatalException(try_catch);
        }        

        DBG("CLRInvokeContext::CompleteOnV8Thread - async with callback");
        return handleScope.Close(Undefined());
    }
    else if (1 == argc) 
    {
        DBG("CLRInvokeContext::CompleteOnV8Thread - handleScope.Close(ThrowException(argv[0]))");
        // complete the synchronous call to C# by re-throwing the resulting exception
        return handleScope.Close(ThrowException(argv[0]));
    }
    else
    {
        DBG("CLRInvokeContext::CompleteOnV8Thread - handleScope.Close(argv[1])");
        // complete the synchronous call to C# by returning the result
        return handleScope.Close(argv[1]);
    }
}

*/