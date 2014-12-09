@echo off

rmdir /S /Q .\build\msvs\ >nul 2>&1
rmdir /S /Q .\build\ninja\ >nul 2>&1
rmdir /S /Q .\build\xcode\ >nul 2>&1
rmdir /S /Q .\build\Release\ >nul 2>&1
rmdir /S /Q .\build\Debug\ >nul 2>&1
rmdir /S /Q .\build\out\ >nul 2>&1
rmdir /S /Q .\build\tint.build >nul 2>&1
rmdir /S /Q .\build\dist\tint >nul 2>&1
:: rmdir /S /Q .\Debug >nul 2>&1
:: rmdir /S /Q .\Release >nul 2>&1
:: rmdir /S /Q .\libraries\dlfcn-win32\Debug >nul 2>&1
:: rmdir /S /Q .\libraries\dlfcn-win32\Release >nul 2>&1
:: del /S /Q .\libraries\dlfcn-win32\dlfcn.sln >nul 2>&1
:: del /S /Q .\libraries\dlfcn-win32\dlfcn.vcxproj >nul 2>&1
:: del /S /Q .\node_dtrace_header.vcxproj >nul 2>&1
:: del /S /Q .\node_dtrace_provider.vcxproj >nul 2>&1
:: del /S /Q .\node_dtrace_ustack.vcxproj >nul 2>&1
:: del /S /Q .\node_etw.vcxproj >nul 2>&1
:: del /S /Q .\node_js2c.vcxproj >nul 2>&1
:: del /S /Q .\node_js2c.vcxproj.filters >nul 2>&1
:: del /S /Q .\tint_js2c.vcxproj >nul 2>&1
:: del /S /Q .\tint_js2c.vcxproj.filters >nul 2>&1
:: del /S /Q .\node_perfctr.vcxproj >nul 2>&1
:: del /S /Q .\node_systemtap_header.vcxproj >nul 2>&1
:: del /S /Q .\ref_binding.vcxproj >nul 2>&1
:: del /S /Q .\ref_binding.vcxproj.filters >nul 2>&1
:: del /S /Q .\tint.sln >nul 2>&1
:: del /S /Q .\tint.vcxproj >nul 2>&1
:: del /S /Q .\tint.vcxproj.filters >nul 2>&1
:: del /S /Q .\tint_js2c.vcxproj >nul 2>&1
:: del /S /Q .\tint_js2c.vcxproj.filters >nul 2>&1
:: del /S /Q .\tint_runtime.vcxproj >nul 2>&1
:: del /S /Q .\tint_runtime.vcxproj.filters >nul 2>&1
:: del /S /Q .\tint_clr.vcxproj >nul 2>&1
:: del /S /Q .\tint_clr.vcxproj.filters >nul 2>&1
:: del /S /Q .\ffi_bindings.vcxproj >nul 2>&1
:: del /S /Q .\ffi_bindings.vcxproj.filters >nul 2>&1
:: del /S /Q .\libraries\node\node.sln >nul 2>&1
:: del /S /Q .\libraries\node\node.vcxproj >nul 2>&1
:: del /S /Q .\libraries\node\node.vcxproj.filters >nul 2>&1
:: del /S /Q .\libraries\libffi\libffi.sln >nul 2>&1
:: del /S /Q .\libraries\libffi\libffi.vcxproj >nul 2>&1
:: del /S /Q .\libraries\libffi\libffi.vcxproj.filters >nul 2>&1
:: del /S /Q .\libraries\node\deps\v8\tools\gyp\v8.sln >nul 2>&1
:: del /S /Q .\libraries\node\deps\v8\tools\gyp\v8.vcxproj >nul 2>&1
:: del /S /Q .\libraries\node\deps\v8\tools\gyp\v8.vcxproj.filters >nul 2>&1