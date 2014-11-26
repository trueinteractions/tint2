#include <iostream> 
#include <fstream>
#include <cassert>
#include <map>
#include <uv.h>
namespace Tint {
struct fileinfo {
	char name[512];
	uint32_t size;
	uint32_t offset;
};

class Package {
public:
	Package() : _packaged(false), filename(""), maps(NULL) {
		char execfile[1024];
		char *targetexe;
		size_t namelen = sizeof(execfile);
		assert(uv_exepath(execfile, &namelen) == 0);
		this->_executable = std::string(execfile);
		assert(namelen < 1024);
		assert(namelen > 0);
#ifdef __APPLE__
		while(execfile[namelen] != '/' && namelen > 0) {
			execfile[namelen] = '\0';
			namelen--;
		}
		char f[] = "../Resources/Package";
		targetexe = strncat(execfile, f, namelen + sizeof(f));
#else
		targetexe = &execfile;
#endif
		this->filename = std::string(targetexe);
		std::ifstream ifs (targetexe, std::ifstream::in);
		if(ifs) {
			char curchar;
	    	ifs.seekg (0, ifs.end);
	    	int length = ifs.tellg();
	    	ifs.seekg (length - 8, ifs.beg);
	    	uint32_t pos = 0;
	    	ifs.read((char*)&pos,4);
	    	uint32_t key = 0;
	    	ifs.read((char*)&key,4);
	    	this->_packaged = (key == 0xdeadbeef);
	    	if(this->_packaged) {
				this->maps = new std::map<std::string, fileinfo*>();
				ifs.seekg(pos,ifs.beg);
				ifs.read(&curchar,1);

				assert(curchar == '[');
				
				while(ifs.read(&curchar,1) && curchar == '{') {
					char buf[512];
					fileinfo *file = new fileinfo;

					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == 'n');
					ifs.read(&curchar,1);
					assert(curchar == 'a');
					ifs.read(&curchar,1);
					assert(curchar == 'm');
					ifs.read(&curchar,1);
					assert(curchar == 'e');
					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == ':');
					ifs.read(&curchar,1);
					assert(curchar == '\"');

					pos = 0;
					while(ifs.read(&curchar,1) && curchar != '\"')
						buf[pos++] = curchar;
					buf[pos++] = '\0';
					strncpy(file->name,buf,512);

					ifs.read(&curchar,1);
					assert(curchar == ',');
					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == 's');
					ifs.read(&curchar,1);
					assert(curchar == 'i');
					ifs.read(&curchar,1);
					assert(curchar == 'z');
					ifs.read(&curchar,1);
					assert(curchar == 'e');
					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == ':');

					pos = 0;
					while(ifs.read(&curchar,1) && curchar != ',')
						buf[pos++] = curchar;
					buf[pos++] = '\0';
					file->size = atoi(buf);

					assert(curchar == ',');
					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == 'o');
					ifs.read(&curchar,1);
					assert(curchar == 'f');
					ifs.read(&curchar,1);
					assert(curchar == 'f');
					ifs.read(&curchar,1);
					assert(curchar == 's');
					ifs.read(&curchar,1);
					assert(curchar == 'e');
					ifs.read(&curchar,1);
					assert(curchar == 't');
					ifs.read(&curchar,1);
					assert(curchar == '\"');
					ifs.read(&curchar,1);
					assert(curchar == ':');
					
					pos = 0;
					while(ifs.read(&curchar,1) && curchar != '}')
						buf[pos++] = curchar;
					buf[pos++] = '\0';
					file->offset = atoi(buf);

					(*(this->maps))[std::string(file->name)] = file;
					assert(curchar == '}');
					ifs.read(&curchar,1);
					if(curchar != ',')
						break;
				}
	    	}
	    	ifs.close();
		}
	}
	size_t resourceSize(char *name) {
		if(this->packaged()) {
			fileinfo* f = (*this->maps)[std::string(name)];
			assert(f->size > 0);
			assert(f->offset > 0);
			return f->size;
		} else {
			std::ifstream ifs (std::string(name), std::ifstream::in);
			if(ifs) {
			    ifs.seekg (0, ifs.end);
			    int length = ifs.tellg();
			    assert(length > 0);
			    return (size_t)length;
			} else 
				return 0;
		}
	}
	const char *executable() { 
		return this->_executable.c_str();
	}
	char *resource(char *name) {
		if(this->packaged()) {
			fileinfo* f = (*this->maps)[std::string(name)];
			assert(f->size > 0);
			assert(f->offset > 0);

			char *data = new char[f->size];
			std::ifstream ifs (this->filename, std::ifstream::binary);
			if(ifs) {
				ifs.seekg(0, ifs.beg);
				ifs.seekg(f->offset, ifs.beg);
				ifs.read(data,f->size);
				assert(ifs);
				ifs.close();
				return data;
			} else {
				return NULL;
			}
		} else {
			std::ifstream ifs (std::string(name), std::ifstream::binary);
			if(ifs) {
			    ifs.seekg (0, ifs.end);
			    int length = ifs.tellg();
			    assert(length > 0);
		    	ifs.seekg (0, ifs.beg);
		    	char *data = (char *)malloc(length);
		    	ifs.read(data, length);
		    	ifs.close();
		    	return data;
		    } else 
		    	return NULL;
		}
	}
	bool packaged() { return this->_packaged; };
private:
	bool _packaged;
	std::string filename;
	std::string _executable;
	std::map<std::string, fileinfo *> *maps;
};
}

extern "C" Tint::Package* create_package() { return new Tint::Package(); }
extern "C" char * get_resource(Tint::Package *p, char *name) { return p->resource(name); }
extern "C" const char * get_executable(Tint::Package *p) { return p->executable(); }
extern "C" size_t get_size(Tint::Package *p, char *name) { return p->resourceSize(name); }
extern "C" bool get_packaged(Tint::Package *p) { return p->packaged(); }