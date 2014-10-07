#include "AppSchema_mac.h"

@implementation AppSchema

- (void)startLoading {
	NSString *url = [[[self request] URL] description];

	if([url rangeOfString:@"app:///"].location != NSNotFound)
		url = [url stringByReplacingOccurrencesOfString:@"app:///" withString:@"/"];
	else if([url rangeOfString:@"app://"].location != NSNotFound)
		url = [url stringByReplacingOccurrencesOfString:@"app://" withString:@"/"];

	NSFileManager *filemgr;
	NSString *currentpath;
	filemgr = [NSFileManager defaultManager];
	currentpath = [filemgr currentDirectoryPath];

	//NSArray *arguments = [[NSProcessInfo processInfo] arguments];
	//NSString *cmd = arguments[0];
	//NSArray *arr = [cmd pathComponents];

	for(int i=0; i < [arr count]; i++)
		NSLog((NSString *)arr[i]);

	NSString *possible = [currentpath stringByAppendingString:url];
	if ([filemgr fileExistsAtPath:possible] == YES) {
		NSData *data = [filemgr contentsAtPath:possible];
		NSURLResponse *response = [[NSURLResponse alloc] initWithURL:[[self request] URL] MIMEType:@"" expectedContentLength:[data length] textEncodingName:nil];
		[[self client] URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageAllowed];
		[[self client] URLProtocol:self didLoadData:data];
		[[self client] URLProtocolDidFinishLoading:self];
	} else {
		[[self client] URLProtocol:self didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:-1 userInfo:nil]];
	}
}

- (void)stopLoading {

}

+ (BOOL)canInitWithRequest:(NSURLRequest *)request {
	if ([[[request URL] scheme] caseInsensitiveCompare:@"app"] == NSOrderedSame)
		return YES;
	else
		return NO;
}

+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request {
	return request;
}

@end
