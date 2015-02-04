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
		// Normalize the app:///, or app:// path.
		String^ host = _responseuri->Host;
		String^ path = _responseuri->AbsolutePath;
		while(host->StartsWith("/") || host->StartsWith("\\")) {
			host = host->Substring(1);
		}
		while(path->StartsWith("/") || path->StartsWith("\\")) {
			path = path->Substring(1);
		}
		host = host->Replace("/","\\");
		path = path->Replace("/","\\");
		String^ url = (host != "") ? System::IO::Path::Combine(host,path) : path;

		String^ basePath = System::IO::Path::GetDirectoryName(System::Diagnostics::Process::GetCurrentProcess()->MainModule->FileName);
		String^ resourcePath = System::IO::Path::Combine(basePath, "Resources");
		String^ packageJsonPath = System::IO::Path::Combine(resourcePath, "package.json");
		path = nullptr;

		if(System::IO::File::Exists(packageJsonPath)) {
			// We're in a packaged context; in this situation we cannot trust
			// the command line arguments or working directory (to prevent security issues)
			path = resourcePath;
		} else {
			// We're not bundled, but executed by a command line script, if we have
			// an argument on argv use that as the path root.
			array<String^>^ args = System::Environment::GetCommandLineArgs();

			for(int i=1; i < args->Length; i++) {
				String^ arg = args[i];

				// if the first character is not '-'
				if(!arg->StartsWith("-")) {
					path = arg;
					break;
				}
			}

			// we did not find a passed in script, use the working directory.
			if(path == nullptr) {
				path = System::IO::Directory::GetCurrentDirectory();

			// we did find a passed in script, go ahead and remove the file name and 
			// keep the path. NSURL will help by resolving relative paths to the 
			// working directory or preserving absolute ones.
			} else {
				path = System::IO::Path::GetDirectoryName(System::IO::Path::GetFullPath(path));
			}
		}

		// if url has a leading /
		if(url->StartsWith("\\")) {
			path = System::IO::Path::Combine(path, url->Substring(1));
		} else {
			path = System::IO::Path::Combine(path, url);
		}
		
		// one last backup, if we are NOT a packaged app; check the working path one last time.
		if(!System::IO::File::Exists(packageJsonPath) && !System::IO::File::Exists(path)) {
			path = System::IO::Directory::GetCurrentDirectory();
			path = System::IO::Path::Combine(path, url);
		}
		Console::WriteLine("path: "+path);
		if(System::IO::File::Exists(path)) {
			return gcnew FileStream(path, System::IO::FileMode::Open);
		} else {
			throw gcnew WebException("The specified application resource at: "+path+" cannot be found.");
		}
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


