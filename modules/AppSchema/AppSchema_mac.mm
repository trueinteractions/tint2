#include "AppSchema_mac.h"

@implementation AppSchema

- (void)startLoading {
	// Remove app:/// protocol.
	NSString *url = [[[self request] URL] description];
	if([url rangeOfString:@"app:///"].location != NSNotFound)
		url = [url stringByReplacingOccurrencesOfString:@"app:///" withString:@"/"];
	else if([url rangeOfString:@"app://"].location != NSNotFound)
		url = [url stringByReplacingOccurrencesOfString:@"app://" withString:@"/"];

	NSFileManager *filemgr = [NSFileManager defaultManager];
	NSBundle *bundle = [NSBundle mainBundle];
	NSString *package = [bundle pathForResource:@"package" ofType:@"json"];
	NSString *identifier = [bundle bundleIdentifier];
	NSString *path = nil;
	if(package && identifier) {
		// We're in a packaged context; in this situation we cannot trust
		// the command line arguments or working directory (to prevent security issues)
		path = [bundle resourcePath];
	} else {
		// We're not bundled, but executed by a command line script, if we have
		// an argument on argv use that as the path root.
		NSArray *args = [[NSProcessInfo processInfo] arguments];
		for(NSUInteger i=1; i < [args count]; i++) {
			NSString *arg = (NSString *)[args objectAtIndex:i];
			// if the first character is not '-'
			if(![[arg substringToIndex:1] isEqualToString:@"-"]) {
				path = arg;
				break;
			}
		}
		// we did not find a passed in script, use the working directory.
		if(path == nil) {
			path = [filemgr currentDirectoryPath];

		// we did find a passed in script, go ahead and remove the file name and 
		// keep the path. NSURL will help by resolving relative paths to the 
		// working directory or preserving absolute ones.
		} else {
			NSArray *pathComponents = [[NSURL fileURLWithPath:path] pathComponents];
			path = @"";
			for(NSUInteger i=0; i < ([pathComponents count] - 1); i++) {
				NSString *component = (NSString *)[pathComponents objectAtIndex:i];
				if(component && ![component isEqualToString:@""] && ![component isEqualToString:@"/"]) {
					path = [[path  stringByAppendingString:@"/"] stringByAppendingString:component];
				}
			}
		}
	}

	// if url has a leading /
	if([[url substringToIndex:1] isEqualToString:@"/"]) {
		path = [[path stringByAppendingString:@"/."] stringByAppendingString:url];
	} else {
		path = [[path stringByAppendingString:@"/"] stringByAppendingString:url];
	}

	// one last backup, if we are NOT a packaged app; check the working path one last time.
	if(!(package && identifier) && ([filemgr fileExistsAtPath:path] == NO)) {
		path = [filemgr currentDirectoryPath];
		path = [[path stringByAppendingString:@"/"] stringByAppendingString:url];
	}

	if ([filemgr fileExistsAtPath:path] == YES) {
		NSData *data = [filemgr contentsAtPath:path];
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
