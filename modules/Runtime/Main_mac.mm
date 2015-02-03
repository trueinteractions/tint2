#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>
#include <node.h>
#include <node_javascript.h>
#include <node_string.h>
#include "v8_typed_array.h"
#include <stdlib.h>
#include "../AppSchema/AppSchema_mac.h"
#include <sys/types.h>
#include <sys/event.h>
#include <sys/time.h>
#include <tint_version.h>

namespace node {
    extern v8::Persistent<v8::String> process_symbol;
    extern v8::Persistent<v8::String> domain_symbol;
    extern void InitDTrace(v8::Handle<v8::Object> target);
    extern v8::Local<v8::Value> ExecuteString(v8::Handle<v8::String> source, 
      v8::Handle<v8::Value> filename);
}

static bool packaged = false;
static int embed_closed = 0;
static uv_sem_t embed_sem;
static uv_thread_t embed_thread;
static int init_argc;
static char **init_argv;
v8::Persistent<v8::Object> bridge;
v8::Persistent<v8::Object> ref;

namespace REF {
    extern void Init (v8::Handle<v8::Object> target);
}

namespace FFI {
    extern void Init(v8::Handle<v8::Object> target);
}

v8::Handle<v8::Object> process_l;

v8::Handle<v8::Value> InitBridge(const v8::Arguments& args) {
    v8::HandleScope scope;
    v8::Local<v8::FunctionTemplate> bridge_template = v8::FunctionTemplate::New();
    bridge_template->SetClassName(v8::String::NewSymbol("bridge"));
    bridge = v8::Persistent<v8::Object>::New(bridge_template->GetFunction()->NewInstance());
    process_l->Set(v8::String::NewSymbol("bridge"), bridge);
    FFI::Init(bridge);
    REF::Init(bridge);
    return v8::Object::New();
}


static void uv_noop(uv_async_t* handle, int status) {}

static void uv_event(void *info) {
    [[NSThread currentThread] setName:@"Tint EventLoop Watcher"];

    // The dummy handle prevents UV from exiting and throwing incorrect
    // timeout values, its necessary since uv can't see many of the app
    // events to keep it assuming something else will come and return -1
    // from uv_backend_timeout.
    uv_async_t dummy_uv_handle_;
    uv_async_init(uv_default_loop(), &dummy_uv_handle_, uv_noop);

    int r;
    struct kevent errors[1];
    uv_loop_t* loop = uv_default_loop();
    int timeout;
    
    while (!embed_closed) {
        int fd = uv_backend_fd(loop);
        timeout = uv_backend_timeout(loop);
        if(timeout < 0) timeout = 16;
        if(timeout > 250) timeout = 250;

        do {
            struct timespec ts;
            ts.tv_sec = timeout / 1000;
            ts.tv_nsec = (timeout % 1000) * 1000000;
            r = kevent(fd, NULL, 0, errors, 1, timeout < 0 ? NULL : &ts);
        } while (r == -1 && errno == EINTR);

        // Do not block this thread, place uv callbacks on the main thread, 
        // then repost the semaphore to allow us to continue. Note, we've
        // taken care of the timeout, so never use UV_RUN_ONCE or UV_RUN_DEFAULT.
        dispatch_async(dispatch_get_main_queue(), ^{
            uv_run(uv_default_loop(), UV_RUN_NOWAIT);
            uv_sem_post(&embed_sem);
        });

        // Wait for the main loop to deal with events.
        uv_sem_wait(&embed_sem);
    }
}


@interface AppDelegate : NSObject <NSApplicationDelegate>
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    [[NSThread currentThread] setName:@"Tint EventLoop"];

    // Set Version Information
    process_l->Get(v8::String::NewSymbol("versions"))->ToObject()->Set(v8::String::NewSymbol("tint"), v8::String::NewSymbol(TINT_VERSION));
    process_l->Set(v8::String::NewSymbol("packaged"), v8::Boolean::New(packaged));

    // Register the app:// protocol.
    [NSURLProtocol registerClass:[AppSchema class]];

    // Resgiter the initial bridge objective-c protocols
    NODE_SET_METHOD(process_l, "initbridge", InitBridge);

    // Load node and begin processing.
    node::Load(process_l);

    // Start worker that will interrupt main loop when having uv events.
    // keep the UV loop in-sync with CFRunLoop.
    embed_closed = 0;

    uv_sem_init(&embed_sem, 0);
    uv_thread_create(&embed_thread, uv_event, NULL);
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    node::EmitExit(process_l);
    embed_closed = 1;
    /*uv_sem_post(&embed_sem);
    uv_run(uv_default_loop(), UV_RUN_ONCE);
    uv_thread_join(&embed_thread);
    uv_sem_destroy(&embed_sem);*/
}
@end

static char **copy_argv(int argc, char **argv) {
    size_t strlen_sum;
    char **argv_copy;
    char *argv_data;
    size_t len;
    int i;

    strlen_sum = 0;
    for(i = 0; i < argc; i++) {
        strlen_sum += strlen(argv[i]) + 1;
    }

    argv_copy = (char **) malloc(sizeof(char *) * (argc + 1) + strlen_sum);
    if (!argv_copy) {
        return NULL;
    }

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

int main(int argc, char * argv[]) {
    NSApplication *app = [NSApplication sharedApplication];
    AppDelegate *delegate = [[AppDelegate alloc] init];
    NSBundle *bundle = [NSBundle mainBundle];
    NSString *package = [bundle pathForResource:@"package" ofType:@"json"];
    NSString *identifier = [bundle bundleIdentifier];
    if(package && identifier) {
        NSString *executable = [bundle executablePath];
        NSDictionary *p = [NSJSONSerialization 
                    JSONObjectWithData:[NSData dataWithContentsOfFile:package] 
                    options:NSJSONReadingMutableContainers 
                    error:nil];

        NSString *main = nil;
        for(NSString *key in p) {
            if([key isEqualToString:@"main"]) {
                main =[p valueForKey:key];
                break;
            }
        }

        if(main == nil) {
            fprintf(stderr, "Cannot find main entry within package.json file.\n");
            exit(1);
        }

        main = [[[bundle resourcePath] stringByAppendingString:@"/"] stringByAppendingString:main];

        const char *exec = [executable cStringUsingEncoding:NSASCIIStringEncoding];
        const char *pack = [main cStringUsingEncoding:NSASCIIStringEncoding];
        unsigned int exec_len = strlen(exec) + 1;
        unsigned int pack_len = strlen(pack) + 1;
        unsigned int buf_len = sizeof(char *) * 2;
        char **p_argv = (char **)malloc(exec_len + pack_len + buf_len);
        char *base = (char *)p_argv;
        p_argv[0] = (char *)(base + buf_len);
        p_argv[1] = (char *)(base + buf_len + exec_len); // dont add argv.
        strncpy(p_argv[0], exec, exec_len);
        strncpy(p_argv[1], pack, pack_len);
        init_argc = argc = 2;
        init_argv = copy_argv(argc, p_argv);
        argv = uv_setup_args(argc, p_argv);
        packaged = true;
    } else {
        init_argc = argc;
        init_argv = copy_argv(argc, argv);
        argv = uv_setup_args(argc, argv);
    }

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

        [app setDelegate:delegate];
        [app setActivationPolicy:NSApplicationActivationPolicyAccessory];
        [app run];
#ifndef NDEBUG
        context.Dispose();
#endif
    }

#ifndef NDEBUG
    // Clean up. Not strictly necessary.
    v8::V8::Dispose();
#endif  // NDEBUG
}
