#import <Foundation/Foundation.h>
#import <Cocoa/Cocoa.h>

@interface AppSchema : NSURLProtocol
- (void)startLoading;
- (void)stopLoading;
+ (BOOL)canInitWithRequest:(NSURLRequest *) request;
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request;
@end
