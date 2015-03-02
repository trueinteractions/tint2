#import <Foundation/Foundation.h>
#if !defined(V8_TARGET_OS_IOS)
#import <Cocoa/Cocoa.h>
#endif

@interface AppSchema : NSURLProtocol
- (void)startLoading;
- (void)stopLoading;
+ (BOOL)canInitWithRequest:(NSURLRequest *) request;
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request;
@end
