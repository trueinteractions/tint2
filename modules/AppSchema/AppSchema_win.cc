#using <system.dll>
#using <System.Core.dll>
#using <WPF/WindowsBase.dll>

using namespace System;
using namespace System::Net;
using namespace System::IO;
using namespace Microsoft::Win32;
/*
 * The AppSchema is initialized in ./modules/Runtime/Main_win.cc
 * and ./modules/Bridge/CLR_Win.cpp
 * See that file for more information on how it is brought to life.
 */
public ref class AppWebResponse : public WebResponse {
public:
	virtual property Uri^ ResponseUri  {
		Uri ^ get() override { return _responseuri; }
	}

	AppWebResponse(System::Uri ^uri) {
		_responseuri = uri;
	}
	
	virtual Stream^ GetResponseStream() override {
		String^ newpath = System::IO::Directory::GetCurrentDirectory() + "\\" + _responseuri->Host + "\\" + _responseuri->AbsolutePath->Replace("/","\\");

		if(System::IO::File::Exists(newpath))
			return gcnew FileStream(newpath, System::IO::FileMode::Open);
		throw gcnew WebException("The specified application resource at: "+newpath+" cannot be found.");
	}

	private:
	Uri ^_responseuri;
};

public ref class AppWebRequest : public WebRequest {
	public:

	virtual property Uri^ RequestUri {
		Uri ^ get() override { return _requesturi; }
	}

	static System::Net::WebRequest ^Create(System::String ^uri) {
		return gcnew AppWebRequest(gcnew Uri(uri));
	}
	static System::Net::WebRequest ^Create(System::Uri ^uri) {
		return gcnew AppWebRequest(uri);
	}

	virtual WebResponse^ GetResponse() override {
		return gcnew AppWebResponse(_requesturi);
	}

	protected:
		AppWebRequest(System::Uri ^uri) {
			_requesturi = uri;
		}

	private:
	Uri ^_requesturi;
};

public ref class AppWebRequestCreate : public IWebRequestCreate {
	public:
	 AppWebRequestCreate() {};
	 virtual WebRequest ^Create(Uri ^uri) {
	 	return AppWebRequest::Create(uri);
	 }
};


extern "C" void InitAppRequest() {
	AppWebRequestCreate ^creator = gcnew AppWebRequestCreate();
	if(!WebRequest::RegisterPrefix("app:", creator)) {
		throw gcnew Exception("Cannot instantiate app handler.");
	}
}


