#define TINT_MAJOR_VERSION 2
#define TINT_MINOR_VERSION 1
#define TINT_PATCH_VERSION 0
// #define TINT_TAG ""			// comment out for releases.

#ifndef TINT_STRINGIFY
#define TINT_STRINGIFY(n) TINT_STRINGIFY_HELPER(n)
#define TINT_STRINGIFY_HELPER(n) #n
#endif

#ifdef TINT_TAG
#define TINT_VERSION  TINT_STRINGIFY(TINT_MAJOR_VERSION) "." \
                      TINT_STRINGIFY(TINT_MINOR_VERSION) "." \
                      TINT_STRINGIFY(TINT_PATCH_VERSION) "-" \
                      TINT_TAG
#else
#define TINT_VERSION  TINT_STRINGIFY(TINT_MAJOR_VERSION) "." \
                      TINT_STRINGIFY(TINT_MINOR_VERSION) "." \
                      TINT_STRINGIFY(TINT_PATCH_VERSION)
#endif

#ifdef BUILD_AS_TOOL
#include <stdio.h>
int main(int argc, char **argv) { fprintf(stdout, "%s", TINT_VERSION); }
#endif