{
  'variables': {
    'v8_use_snapshot%': 'true',
    'v8_postmortem_support%': 'true',
    'node_use_dtrace%': 'false',         # enabled in common.gypi for posix
    'node_use_etw': 'false',             # enabled in common.gypi for windows
    'node_has_winsdk': 'false',          # enabled in common.gypi for windows
    'node_use_perfctr': 'false',         # performance counters, linux only, not enabled.
    'node_shared_v8': 'false',
    'node_shared_zlib': 'false',
    'node_shared_http_parser': 'false',
    'node_shared_cares': 'false',
    'node_shared_libuv': 'false',
    'node_use_openssl': 'true',
    'node_shared_openssl': 'false',
    'node_install_npm': 'false',
    'node_use_mdb': 'false',
    'v8_enable_gdbjit': 0,
    'v8_no_strict_aliasing%': 0,
    'node_unsafe_optimizations': 0,
    'node_v8_options': '',
    'node_prefix': '',
    'node_tag': '',
    'win_subsystem': 'console',
    'linux_library_files': [
      'modules/Bridge/Bridge_gtk.js',
      'modules/Application/Application_gtk.js',
      'modules/Utilities/Utilities_gtk.js',
      'modules/Window/Window_gtk.js',
    ],
    'mac_library_files': [
      'modules/Bridge/class.js',
      'modules/Bridge/core.js',
      'modules/Bridge/exception.js',
      'modules/Bridge/id.js',
      'modules/Bridge/import.js',
      'modules/Bridge/index.js',
      'modules/Bridge/ivar.js',
      'modules/Bridge/method.js',
      'modules/Application/Application_mac.js',
      'modules/Box/Box_mac.js',
      'modules/Button/Button_mac.js',
      'modules/ButtonGroup/ButtonGroup_mac.js',
      'modules/Bridge/Bridge_mac.js',
      'modules/Color/Color_mac.js',
      'modules/Color/ColorPanel_mac.js',
      'modules/Color/ColorWell_mac.js',
      'modules/Container_mac.js',
      'modules/Control_mac.js',
      'modules/Date/DateWell_mac.js',
      'modules/Dialog/Dialog_mac.js',
      'modules/DropDown/DropDown_mac.js',
      'modules/FileDialog/FileDialog_mac.js',
      'modules/FileInput/FileInput_mac.js',
      'modules/Fonts/Font_mac.js',
      'modules/Fonts/FontInternals_mac.js',
      'modules/Fonts/FontPanel_mac.js',
      'modules/Image/ImageWell_mac.js',
      'modules/Menu/Menu_mac.js',
      'modules/Menu/MenuItem_mac.js',
      'modules/Menu/MenuItemSeparator_mac.js',
      'modules/Notification/Notification_mac.js',
      'modules/Panel/Panel_mac.js',
      'modules/ProgressBar/ProgressBar_mac.js',
      'modules/PopOver/PopOver_mac.js',
      'modules/Screens/Screens_mac.js',
      'modules/Scroll/Scroll_mac.js',
      'modules/SearchInput/SearchInput_mac.js',
      'modules/SecureTextInput/SecureTextInput_mac.js',
      'modules/SelectInput/SelectInput_mac.js',
      'modules/Slider/Slider_mac.js',
      'modules/StatusBar/StatusBar_mac.js',
      'modules/Split/Split_mac.js',
      'modules/System/System_mac.js',
      'modules/Table/Table_mac.js',
      'modules/TextInput/TextInput_mac.js',
      'modules/Toolbar/Toolbar_mac.js',
      'modules/Toolbar/ToolbarItem_mac.js',
      'modules/Utilities/Utilities_mac.js',
      'modules/WebView/WebView_mac.js',
      'modules/Window/Window_mac.js',
    ],
    'win_library_files':[
      'modules/Bridge/win32.js',
      'modules/Bridge/Bridge_win.js',
      'modules/Application/Application_win.js',
      'modules/Box/Box_win.js',
      'modules/Button/Button_win.js',
      'modules/ButtonGroup/ButtonGroup_win.js',
      'modules/Bridge/Bridge_win.js',
      'modules/Color/Color_win.js',
      'modules/Color/ColorPanel_win.js',
      'modules/Color/ColorWell_win.js',
      'modules/Container_win.js',
      'modules/Control_win.js',
      'modules/Date/DateWell_win.js',
      'modules/Dialog/Dialog_win.js',
      'modules/DropDown/DropDown_win.js',
      'modules/FileDialog/FileDialog_win.js',
      'modules/FileInput/FileInput_win.js',
      'modules/Fonts/Font_win.js',
      'modules/Fonts/FontPanel_win.js',
      'modules/Image/ImageWell_win.js',
      'modules/Menu/Menu_win.js',
      'modules/Menu/MenuItem_win.js',
      'modules/Menu/MenuItemSeparator_win.js',
      'modules/Notification/Notification_win.js',
      'modules/Panel/Panel_win.js',
      'modules/ProgressBar/ProgressBar_win.js',
      'modules/PopOver/PopOver_win.js',
      'modules/Screens/Screens_win.js',
      'modules/Scroll/Scroll_win.js',
      'modules/SearchInput/SearchInput_win.js',
      'modules/SecureTextInput/SecureTextInput_win.js',
      'modules/SelectInput/SelectInput_win.js',
      'modules/Slider/Slider_win.js',
      'modules/StatusBar/StatusBar_win.js',
      'modules/Split/Split_win.js',
      'modules/System/System_win.js',
      'modules/Table/Table_win.js',
      'modules/TextInput/TextInput_win.js',
      'modules/Toolbar/Toolbar_win.js',
      'modules/Toolbar/ToolbarItem_win.js',
      'modules/Utilities/Utilities_win.js',
      'modules/WebView/WebView_win.js',
      'modules/Window/Window_win.js',
    ],
    'library_files': [
      'libraries/node/src/node.js',
      'libraries/node/lib/_debugger.js',
      'libraries/node/lib/_linklist.js',
      'libraries/node/lib/assert.js',
      'libraries/node/lib/buffer.js',
      'libraries/node/lib/child_process.js',
      'libraries/node/lib/console.js',
      'libraries/node/lib/constants.js',
      'libraries/node/lib/crypto.js',
      'libraries/node/lib/cluster.js',
      'libraries/node/lib/dgram.js',
      'libraries/node/lib/dns.js',
      'libraries/node/lib/domain.js',
      'libraries/node/lib/events.js',
      'libraries/node/lib/freelist.js',
      'libraries/node/lib/fs.js',
      'libraries/node/lib/http.js',
      'libraries/node/lib/_http_agent.js',
      'libraries/node/lib/_http_client.js',
      'libraries/node/lib/_http_common.js',
      'libraries/node/lib/_http_incoming.js',
      'libraries/node/lib/_http_outgoing.js',
      'libraries/node/lib/_http_server.js',
      'libraries/node/lib/https.js',
      'libraries/node/lib/module.js',
      'libraries/node/lib/net.js',
      'libraries/node/lib/os.js',
      'libraries/node/lib/path.js',
      'libraries/node/lib/punycode.js',
      'libraries/node/lib/querystring.js',
      'libraries/node/lib/readline.js',
      'libraries/node/lib/repl.js',
      'libraries/node/lib/smalloc.js',
      'libraries/node/lib/stream.js',
      'libraries/node/lib/_stream_readable.js',
      'libraries/node/lib/_stream_writable.js',
      'libraries/node/lib/_stream_duplex.js',
      'libraries/node/lib/_stream_transform.js',
      'libraries/node/lib/_stream_passthrough.js',
      'libraries/node/lib/string_decoder.js',
      'libraries/node/lib/sys.js',
      'libraries/node/lib/timers.js',
      'libraries/node/lib/tls.js',
      'libraries/node/lib/_tls_common.js',
      'libraries/node/lib/_tls_legacy.js',
      'libraries/node/lib/_tls_wrap.js',
      'libraries/node/lib/tty.js',
      'libraries/node/lib/url.js',
      'libraries/node/lib/util.js',
      'libraries/node/lib/vm.js',
      'libraries/node/lib/zlib.js',
      'libraries/node/deps/debugger-agent/lib/_debugger_agent.js',
      # begin common tint files.
      'modules/AppSchema/AppSchema.js',
      'modules/Application/Common.js',
      'modules/Bridge/ref.js',
      'modules/Bridge/struct.js',
      'modules/Bridge/_foreign_function.js',
      'modules/Bridge/callback.js',
      'modules/Bridge/cif.js',
      'modules/Bridge/cif_var.js',
      'modules/Bridge/dynamic_library.js',
      'modules/Bridge/errno.js',
      'modules/Bridge/ffi.js',
      'modules/Bridge/foreign_function.js',
      'modules/Bridge/foreign_function_var.js',
      'modules/Bridge/function.js',
      'modules/Bridge/library.js',
      'modules/Bridge/type.js',
      'modules/Bridge/types.js',
      'modules/Color/Color_base.js',
      'modules/Utilities/Utilities_base.js',
    ],
  },

  'targets': [
    {
      'target_name': 'tint',
      'type': 'executable',

      'dependencies': [
        'libraries/node/deps/v8/tools/gyp/v8.gyp:postmortem-metadata',
        'libraries/node/deps/debugger-agent/debugger-agent.gyp:debugger-agent',
        'libraries/node/deps/v8/tools/gyp/v8.gyp:v8',
        'tint_js2c#host',
        'ffi_bindings',
      ],

      'include_dirs': [
        'libraries/nan',
        'libraries/node/src',
        'libraries/node/tools/msvs/genfiles',
        'libraries/node/deps/uv/src/ares',
        'libraries/node-ffi/src',
        'libraries/node/deps/v8/include/',
        'libraries/node/deps/uv/include/',
        'libraries/node/deps/uv/src/',
        'tools/',
		    'modules/Bridge/',
        '<(SHARED_INTERMEDIATE_DIR)'
      ],
      'sources': [
        # not sure why but from upstream..
        'libraries/node/deps/v8/include/v8.h',
        'libraries/node/deps/v8/include/v8-debug.h',
        # regular includes.
        'libraries/node/src/async-wrap.cc',
        'libraries/node/src/fs_event_wrap.cc',
        'libraries/node/src/cares_wrap.cc',
        'libraries/node/src/handle_wrap.cc',
        # We include this with a preprocessor in Main_mac.mm
        # 'libraries/node/src/node.cc',
        'libraries/node/src/node_buffer.cc',
        'libraries/node/src/node_constants.cc',
        'libraries/node/src/node_contextify.cc',
        'libraries/node/src/node_file.cc',
        'libraries/node/src/node_http_parser.cc',
        'libraries/node/src/node_javascript.cc',
        # 'libraries/node/src/node_main.cc',
        'libraries/node/src/node_os.cc',
        'libraries/node/src/node_v8.cc',
        'libraries/node/src/node_stat_watcher.cc',
        'libraries/node/src/node_watchdog.cc',
        'libraries/node/src/node_zlib.cc',
        'libraries/node/src/node_i18n.cc',
        'libraries/node/src/pipe_wrap.cc',
        'libraries/node/src/signal_wrap.cc',
        'libraries/node/src/smalloc.cc',
        'libraries/node/src/spawn_sync.cc',
        'libraries/node/src/string_bytes.cc',
        'libraries/node/src/stream_wrap.cc',
        'libraries/node/src/tcp_wrap.cc',
        'libraries/node/src/timer_wrap.cc',
        'libraries/node/src/tty_wrap.cc',
        'libraries/node/src/process_wrap.cc',
        'libraries/node/src/udp_wrap.cc',
        'libraries/node/src/uv.cc',
        # headers to make for a more pleasant IDE experience
        'libraries/node/src/async-wrap.h',
        'libraries/node/src/async-wrap-inl.h',
        'libraries/node/src/base-object.h',
        'libraries/node/src/base-object-inl.h',
        'libraries/node/src/env.h',
        'libraries/node/src/env-inl.h',
        'libraries/node/src/handle_wrap.h',
        'libraries/node/src/node.h',
        'libraries/node/src/node_buffer.h',
        'libraries/node/src/node_constants.h',
        'libraries/node/src/node_file.h',
        'libraries/node/src/node_http_parser.h',
        'libraries/node/src/node_internals.h',
        'libraries/node/src/node_javascript.h',
        'libraries/node/src/node_root_certs.h',
        'libraries/node/src/node_version.h',
        'libraries/node/src/node_watchdog.h',
        'libraries/node/src/node_wrap.h',
        'libraries/node/src/node_i18n.h',
        'libraries/node/src/pipe_wrap.h',
        'libraries/node/src/queue.h',
        'libraries/node/src/smalloc.h',
        'libraries/node/src/tty_wrap.h',
        'libraries/node/src/tcp_wrap.h',
        'libraries/node/src/udp_wrap.h',
        'libraries/node/src/req_wrap.h',
        'libraries/node/src/string_bytes.h',
        'libraries/node/src/stream_wrap.h',
        'libraries/node/src/tree.h',
        'libraries/node/src/util.h',
        'libraries/node/src/util-inl.h',
        'libraries/node/src/util.cc',
        'libraries/node/deps/http_parser/http_parser.h',
        '<(SHARED_INTERMEDIATE_DIR)/node_natives.h',
        # javascript files to make for an even more pleasant IDE experience
        '<@(library_files)',
        # node.gyp is added to the project by default.
        'build/common.gypi',
      ],
      'defines': [
        'NODE_WANT_INTERNALS=1',
        'ARCH="<(target_arch)"',
        #'PLATFORM="<(OS)"', # we use conditions to define which OS value to use, GYP changes them, creating havok.
        'NODE_TAG="<(node_tag)"',
        'NODE_V8_OPTIONS="<(node_v8_options)"',
      ],
      'conditions': [
        [ 'v8_enable_i18n_support==1', {
          'defines': [ 'NODE_HAVE_I18N_SUPPORT=1' ],
          'dependencies': [
            '<(icu_gyp_path):icui18n',
            '<(icu_gyp_path):icuuc',
          ],
          'conditions': [
            [ 'icu_small=="true"', {
              'defines': [ 'NODE_HAVE_SMALL_ICU=1' ],
          }]],
        }],
        [ 'node_use_openssl=="true"', {
          'defines': [ 'HAVE_OPENSSL=1' ],
          'sources': [ 
            'libraries/node/src/node_crypto.cc',
            'libraries/node/src/node_crypto_bio.cc',
            'libraries/node/src/node_crypto_clienthello.cc',
            'libraries/node/src/node_crypto.h',
            'libraries/node/src/node_crypto_bio.h',
            'libraries/node/src/node_crypto_clienthello.h',
            'libraries/node/src/tls_wrap.cc',
            'libraries/node/src/tls_wrap.h'
          ],
          'conditions': [
            [ 'node_shared_openssl=="false"', {
              'dependencies': [ 
                './libraries/node/deps/openssl/openssl.gyp:openssl',

                # For tests
                # './libraries/node/deps/openssl/openssl.gyp:openssl-cli',
              ],
              # Do not let unused OpenSSL symbols to slip away
              'xcode_settings': {
                'OTHER_LDFLAGS': [
                  '-Wl,-force_load,<(PRODUCT_DIR)/libopenssl.a',
                ],
              },
              'conditions': [
                ['OS in "linux freebsd"', {
                  'ldflags': [
                    '-Wl,--whole-archive <(PRODUCT_DIR)/libopenssl.a -Wl,--no-whole-archive',
                  ],
                }],
              ],
            }]]
        }, {
          'defines': [ 'HAVE_OPENSSL=0' ]
        }],
        [ 'node_use_dtrace=="true"', {
          'defines': [ 'HAVE_DTRACE=1' ],
          'dependencies': [ 
            'node_dtrace_header',
            'specialize_node_d',
          ],
          'include_dirs': [ '<(SHARED_INTERMEDIATE_DIR)' ],
          #
          # DTrace is supported on solaris, mac, and bsd.  There are three
          # object files associated with DTrace support, but they're not all
          # used all the time:
          #
          #   node_dtrace.o           all configurations
          #   node_dtrace_ustack.o    not supported on OS X
          #   node_dtrace_provider.o  All except OS X.  "dtrace -G" is not
          #                           used on OS X.
          #
          # Note that node_dtrace_provider.cc and node_dtrace_ustack.cc do not
          # actually exist.  They're listed here to trick GYP into linking the
          # corresponding object files into the final "node" executable.  These
          # object files are generated by "dtrace -G" using custom actions
          # below, and the GYP-generated Makefiles will properly build them when
          # needed.
          #
          'sources': [ 'libraries/node/src/node_dtrace.cc' ],
          'conditions': [
            [ 'OS=="linux"', {
              'sources': [
                '<(SHARED_INTERMEDIATE_DIR)/node_dtrace_provider.o'
              ],
            }],
            [ 'OS!="mac" and OS!="linux"', {
              'sources': [
                'libraries/node/src/node_dtrace_ustack.cc',
                'libraries/node/src/node_dtrace_provider.cc',
              ]
            }
          ] ]
        } ],
        [ 'node_use_mdb=="true"', {
          'dependencies': [ 'node_mdb' ],
          'include_dirs': [ '<(SHARED_INTERMEDIATE_DIR)' ],
          'sources': [
            'libaries/node/src/node_mdb.cc',
          ],
        } ],
        [ 'node_use_etw=="true"', {
          'defines': [ 'HAVE_ETW=1' ],
          'dependencies': [ 'node_etw' ],
          'sources': [
            'libraries/node/src/node_win32_etw_provider.h',
            'libraries/node/src/node_win32_etw_provider-inl.h',
            'libraries/node/src/node_win32_etw_provider.cc',
            'libraries/node/src/node_dtrace.cc',
            'libraries/node/tools/msvs/genfiles/node_etw_provider.h',
            'libraries/node/tools/msvs/genfiles/node_etw_provider.rc',
          ]
        } ],
        [ 'node_use_perfctr=="true"', {
          'defines': [ 'HAVE_PERFCTR=1' ],
          'dependencies': [ 'node_perfctr' ],
          'sources': [
            'libraries/node/src/node_win32_perfctr_provider.h',
            'libraries/node/src/node_win32_perfctr_provider.cc',
            'libraries/node/src/node_counters.cc',
            'libraries/node/src/node_counters.h',
            'libraries/node/tools/msvs/genfiles/node_perfctr_provider.rc',
          ]
        } ],
        [ 'node_shared_zlib=="false"', {
          'dependencies': [ 'libraries/node/deps/zlib/zlib.gyp:zlib' ],
        }],

        [ 'node_shared_http_parser=="false"', {
          'dependencies': [ 'libraries/node/deps/http_parser/http_parser.gyp:http_parser' ],
        }],

        [ 'node_shared_cares=="false"', {
          'dependencies': [ 'libraries/node/deps/cares/cares.gyp:cares' ],
        }],

        [ 'node_shared_libuv=="false"', {
          'dependencies': [ 'libraries/node/deps/uv/uv.gyp:libuv' ],
        }],
        [ 'OS=="win"', {
          'dependencies': [
            'tint_clr'
          ],
          'sources': [
            'modules/Runtime/Main_win.cc',
            'tools/tint.rc',
          ],
          'defines': [
            'FD_SETSIZE=1024',
            # we need to use node's preferred "win32" rather than gyp's preferred "win"
            'PLATFORM="win32"',
            '_UNICODE=1',
          ],
          'libraries': ['-lpsapi.lib','-lDwmapi.lib']
        }, { # POSIX
          'defines': [ 
            '__POSIX__',
            'PLATFORM="<(OS)"'
          ],
        }],
        [ 'OS=="mac"', {
          'sources':[
            'modules/AppSchema/AppSchema_mac.h',
            'modules/AppSchema/AppSchema_mac.mm',
            'modules/Runtime/Main_mac.mm',
          ],
          'defines!': [
            'PLATFORM="mac"',
          ],
          'defines': [
            # we need to use node's preferred "darwin" rather than gyp's preferred "mac"
            'PLATFORM="darwin"',
          ],
        }],
        [ 'OS=="linux"', {
          'sources':[
            'modules/Runtime/Main_gtk.cc',
          ],
          'dependencies':[
            'node_gir',
          ],
          'cflags': [
            '<!@(pkg-config --cflags gtk+-3.0 gobject-2.0 gobject-introspection-1.0)',
            '-D_FILE_OFFSET_BITS=64',
            '-D_LARGEFILE_SOURCE'
          ],
          'link_settings': {
            'ldflags': [
                '<!@(pkg-config --libs gtk+-3.0 gobject-2.0 gobject-introspection-1.0)',
            ],
            'libraries': [
                '<!@(pkg-config --libs gtk+-3.0 gobject-2.0 gobject-introspection-1.0)'
            ],
          },
        }],
        [ 'OS=="freebsd"', {
          'libraries': [
            '-lutil',
            '-lkvm',
          ],
        }],
        [ 'OS=="solaris"', {
          'libraries': [
            '-lkstat',
            '-lumem',
          ],
          'defines!': [
            'PLATFORM="solaris"',
          ],
          'defines': [
            # we need to use node's preferred "sunos"
            # rather than gyp's preferred "solaris"
            'PLATFORM="sunos"',
          ],
        }],
      ],
      'msvs_settings': {
        'VCCLCompilerTool':{
          'AdditionalIncludeDirectories': [
            '$(newincludepath)'
          ]
        },
        'VCManifestTool': {
          'AdditionalManifestFiles': [
            '$(ProjectDir)..\\..\\tools\\tint.manifest',
          ],
        },
        'VCLinkerTool': {
          'SubSystem': 1,
          'AdditionalDependencies':[ ],
          'AdditionalOptions': [
            '/IGNORE:4248', # forward-declarations between .NET and native C++ spit out
                            # a very ominous (useless) warning that if the native C++ type
                            # uses the same symbols as the .NET type and the .NET type is
                            # managed all hell will breakout.
            '/CLRTHREADATTRIBUTE:STA',
          ],
          'conditions': [
            ['win_subsystem=="console"', {
              'AdditionalOptions':[ '/SUBSYSTEM:CONSOLE' ]
            }],
            ['win_subsystem=="windows"', {
              'AdditionalOptions':[ '/SUBSYSTEM:WINDOWS' ]
            }],
            ['target_arch=="x64"', {
              'AdditionalLibraryDirectories':[
                # '$(WINDOWSSDKDIR)lib\\x64'
                '$(newlibpath)'
              ]
            }],
            ['target_arch=="ia32"', {
              'AdditionalLibraryDirectories':[
                # '$(WINDOWSSDKDIR)lib'
                '$(newlibpath)'
              ]
            }]
          ]
        },
      },
      'all_dependent_settings': {
        'variables': {
          'python':'>(python)'
        },
        'msvs_settings': {
          'VCCLCompilerTool': {
            'WholeProgramOptimization': 'false', # very slow builds with this :(
            'AdditionalIncludeDirectories': [
              '$(newincludepath)'
            ],
            'AdditionalOptions': [
              '/MP', # compile across multiple CPUs - this causes deadlocks in VS2013
            ],
          },
          'VCLinkerTool': {
            'LinkIncremental': 1,
            'RuntimeLibrary':'>(runtime)',
            'conditions': [
              ['target_arch=="x64"', {
                'AdditionalLibraryDirectories':[
                  '$(WINDOWSSDKDIR)\\lib\\x64'
                ]
              }],
              ['target_arch=="ia32"', {
                'AdditionalLibraryDirectories':[
                  '$(WINDOWSSDKDIR)\\lib'
                ]
              }]
            ]
          },
          'VCLibrarianTool': {
            'LinkTimeCodeGeneration': 'true',
          }
        }
      }
    }, #end target tint
    {
      'target_name': 'node_gir',
      'type': 'static_library',
      'conditions':[
        ['OS=="linux"', {
          'include_dirs':[
            'libraries/gir/src/',
            'libraries/nan',
            'libraries/node/deps/v8/include/',
            'libraries/node/deps/uv/include/',
            'libraries/node/src/',
            'modules/Bridge/',
          ],
          'sources':[
            'libraries/gir/src/arguments.cc',
            'libraries/gir/src/function.cc',
            'libraries/gir/src/init.cc',
            'libraries/gir/src/namespace_loader.cc',
            'libraries/gir/src/util.cc',
            'libraries/gir/src/values.cc',
            'libraries/gir/src/types/function_type.cc',
            'libraries/gir/src/types/object.cc',
            'libraries/gir/src/types/struct.cc',
          ],
          'libraries': [
            '<!@(pkg-config --libs gobject-2.0 gobject-introspection-1.0)'
          ],
          'cflags': [
            '<!@(pkg-config --cflags gobject-2.0 gobject-introspection-1.0)',
            '-D_FILE_OFFSET_BITS=64',
            '-D_LARGEFILE_SOURCE',
            '-std=c++11'
          ],
          'ldflags': [
            '<!@(pkg-config --libs gobject-2.0 gobject-introspection-1.0)'
          ]
        }]
      ]
    },
    {
      'target_name': 'tint_clr',
      'type': 'static_library',
      'include_dirs': [
        'libraries/nan',
        'libraries/node/src',
        'libraries/node/tools/msvs/genfiles',
        'libraries/node/deps/uv/include/',
        'libraries/node/deps/uv/src/',
        'libraries/node-ffi/src',
        'libraries/node/deps/v8/include/',
		    'modules/Bridge/',
        '<(SHARED_INTERMEDIATE_DIR)'
      ],
      'sources':[
      ],
      'conditions': [
        ['OS=="win"', {
          'include_dirs': [
            'libraries/wpf-autolayout/cpp/include/',
          ],
          'sources': [
            # do to linking optimization issues, this is #include from CLR_win.cpp.
            # 'libraries/wpf-autolayout/cpp/AutoLayoutPanel.cpp',
            'libraries/wpf-autolayout/cpp/ClAbstractVariable.cc',
            'libraries/wpf-autolayout/cpp/ClC.cc',
            'libraries/wpf-autolayout/cpp/ClConstraint.cc',
            #'libraries/wpf-autolayout/cpp/ClDummyVariable.cc',
            'libraries/wpf-autolayout/cpp/ClFDBinaryOneWayConstraint.cc',
            'libraries/wpf-autolayout/cpp/ClFDConnectorVariable.cc',
            # 'ClFDSolver.cc',
            'libraries/wpf-autolayout/cpp/ClFDVariable.cc',
            'libraries/wpf-autolayout/cpp/ClFloatVariable.cc',
            'libraries/wpf-autolayout/cpp/ClLinearExpression.cc',
            'libraries/wpf-autolayout/cpp/ClSimplexSolver.cc',
            #'libraries/wpf-autolayout/cpp/ClSlackVariable.cc',
            'libraries/wpf-autolayout/cpp/ClSolver.cc',
            'libraries/wpf-autolayout/cpp/ClStrength.cc',
            'libraries/wpf-autolayout/cpp/ClSymbolicWeight.cc',
            'libraries/wpf-autolayout/cpp/ClTableau.cc',
            'libraries/wpf-autolayout/cpp/ClVariable.cc',
            'libraries/wpf-autolayout/cpp/include/Cassowary.h',
            'libraries/wpf-autolayout/cpp/include/Cl.h',
            'libraries/wpf-autolayout/cpp/include/ClAbstractVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClC.h',
            'libraries/wpf-autolayout/cpp/include/ClConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClConstraintHash.h',
            #'libraries/wpf-autolayout/cpp/include/ClDummyVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClEditConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClEditOrStayConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClErrors.h',
            'libraries/wpf-autolayout/cpp/include/ClFDBinaryOneWayConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClFDConnectorVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClFDConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClFDSolver.h',
            'libraries/wpf-autolayout/cpp/include/ClFDVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClFloatVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClLinearConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClLinearEquation.h',
            'libraries/wpf-autolayout/cpp/include/ClLinearExpression.h',
            'libraries/wpf-autolayout/cpp/include/ClLinearExpression_fwd.h',
            'libraries/wpf-autolayout/cpp/include/ClLinearInequality.h',
            'libraries/wpf-autolayout/cpp/include/ClMap.h',
            'libraries/wpf-autolayout/cpp/include/ClObjectiveVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClPoint.h',
            'libraries/wpf-autolayout/cpp/include/ClReader.h',
            'libraries/wpf-autolayout/cpp/include/ClSet.h',
            'libraries/wpf-autolayout/cpp/include/ClSimplexSolver.h',
            'libraries/wpf-autolayout/cpp/include/ClSlackVariable.h',
            'libraries/wpf-autolayout/cpp/include/ClSolver.h',
            'libraries/wpf-autolayout/cpp/include/ClStayConstraint.h',
            'libraries/wpf-autolayout/cpp/include/ClStrength.h',
            'libraries/wpf-autolayout/cpp/include/ClSymbolicWeight.h',
            'libraries/wpf-autolayout/cpp/include/ClTableau.h',
            'libraries/wpf-autolayout/cpp/include/ClTimedSimplexSolver.h',
            'libraries/wpf-autolayout/cpp/include/ClTypedefs.h',
            'libraries/wpf-autolayout/cpp/include/ClVariable.h',
            'libraries/wpf-autolayout/cpp/include/auto_ptr.h',
            'libraries/wpf-autolayout/cpp/include/cl_auto_ptr.h',
            'libraries/wpf-autolayout/cpp/include/config-inline.h',
            # config.h.in
            'libraries/wpf-autolayout/cpp/include/debug.h',
            'libraries/wpf-autolayout/cpp/include/timer.h',
            'modules/AppSchema/AppSchema_win.cc',
            'modules/Bridge/CLR_win.cpp'
          ]
        }]
      ],
      'msvs_settings': {
        'VCLinkerTool': {
          'AdditionalOptions': [ '/CLRTHREADATTRIBUTE:STA' ],
        },
        'VCCLCompilerTool': {
          'RuntimeTypeInfo': 'true',
          'AdditionalOptions': [ 
            '/CLR',   # enable cross-talk with .NET assemblies.
          ]
        },
      }
    },
    # generate ETW header and resource files
    {
      'target_name': 'node_etw',
      'type': 'none',
      'conditions': [
        [ 'node_use_etw=="true" and node_has_winsdk=="true"', {
          'actions': [
            {
              'action_name': 'node_etw',
              'inputs': [ 'libraries/node/src/res/node_etw_provider.man' ],
              'outputs': [
                'libraries/node/tools/msvs/genfiles/node_etw_provider.rc',
                'libraries/node/tools/msvs/genfiles/node_etw_provider.h',
                'libraries/node/tools/msvs/genfiles/node_etw_providerTEMP.BIN',
              ],
              'action': [ 'mc <@(_inputs) -h tools/msvs/genfiles -r tools/msvs/genfiles' ]
            }
          ]
        } ]
      ]
    },
    # generate perf counter header and resource files
    {
      'target_name': 'node_perfctr',
      'type': 'none',
      'conditions': [
        [ 'node_use_perfctr=="true" and node_has_winsdk=="true"', {
          'actions': [
            {
              'action_name': 'node_perfctr_man',
              'inputs': [ 'libraries/node/src/res/node_perfctr_provider.man' ],
              'outputs': [
                'libraries/node/tools/msvs/genfiles/node_perfctr_provider.h',
                'libraries/node/tools/msvs/genfiles/node_perfctr_provider.rc',
                'libraries/node/tools/msvs/genfiles/MSG00001.BIN',
              ],
              'action': [ 'ctrpp <@(_inputs) '
                          '-o libraries/node/tools/msvs/genfiles/node_perfctr_provider.h '
                          '-rc libraries/node/tools/msvs/genfiles/node_perfctr_provider.rc'
              ]
            },
          ],
        } ]
      ]
    },
    {
      'target_name': 'tint_js2c',
      'type': 'none',
      'toolsets': ['host'],
      'actions': [
        {
          'action_name': 'tint_js2c',
          'inputs': [
            '<@(library_files)',
            'libraries/node/config.gypi'
          ],
          'outputs': [
            '<(SHARED_INTERMEDIATE_DIR)/node_natives.h',
          ],
          'conditions': [
            ['OS=="linux"',{
              'inputs': ['<@(linux_library_files)'],
            }],
            ['OS=="mac"',{
              'inputs': ['<@(mac_library_files)'],
            }],
            ['OS=="win"',{
              'inputs': ['<@(win_library_files)'],
            }],
            [ 'node_use_dtrace=="false"'
              ' and node_use_etw=="false"'
              ' and node_use_systemtap=="false"',
            {
              'inputs': ['libraries/node/src/notrace_macros.py']
            }],
            [ 'node_use_perfctr=="false"', {
              'inputs': [ 'libraries/node/src/perfctr_macros.py' ]
            }],
          ],
          'action': [
            '<(python)',
            'tools/tint_js2c.py',
            '<@(_outputs)',
            '<@(_inputs)',
          ],
        },
      ],
    }, # end tint_js2c
    {
      'target_name': 'ffi_bindings',
      'type': 'static_library',
      'sources': [
          'modules/Bridge/ffi.cc',
      ],
      'include_dirs': [
        'libraries/nan',
        'libraries/node/deps/uv/include',
        'libraries/node/src',
        'libraries/node/deps/v8/include',
      ],
      'dependencies': [
        'libraries/libffi/libffi.gyp:ffi',
        'ref_binding',
      ],
      'conditions': [
        ['OS=="win"', {
          'dependencies': [
            'libraries/dlfcn-win32/dlfcn.gyp:dlfcn',
            'libraries/pthreads-win32/pthread.gyp:pthread'
          ]
        }],
        ['OS=="mac"', {
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'MACOSX_DEPLOYMENT_TARGET': '10.7',
            'OTHER_CFLAGS': [
                '-ObjC++'
            ]
          },
        }]
      ]
    },
    {
      'target_name': 'ref_binding',
      'type': 'static_library',
      'sources': [ 'modules/Bridge/ref.cc' ],
      'include_dirs': [ 
        'modules/Bridge/',
        'libraries/nan',
        'libraries/node/deps/uv/include',
        'libraries/node/src',
        'libraries/node/deps/v8/include',
      ],
    },
    {
      'target_name': 'node_dtrace_header',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true"', {
          'actions': [
            {
              'action_name': 'node_dtrace_header',
              'inputs': [ 'libraries/node/src/node_provider.d' ],
              'outputs': [ '<(SHARED_INTERMEDIATE_DIR)/node_provider.h' ],
              'action': [ 'dtrace', '-h', '-xnolibs', '-s', '<@(_inputs)',
                '-o', '<@(_outputs)' ]
            }
          ]
        } ]
      ]
    },
    {
      'target_name': 'node_mdb',
      'type': 'none',
      'conditions': [
        [ 'node_use_mdb=="true"',
          {
            'dependencies': [ 'libraries/node/deps/mdb_v8/mdb_v8.gyp:mdb_v8' ],
            'actions': [
              {
                'action_name': 'node_mdb',
                'inputs': [ '<(PRODUCT_DIR)/obj.target/deps/mdb_v8/mdb_v8.so' ],
                'outputs': [ '<(PRODUCT_DIR)/obj.target/node/src/node_mdb.o' ],
                'conditions': [
                  [ 'target_arch=="ia32"', {
                    'action': [ 'elfwrap', '-o', '<@(_outputs)', '<@(_inputs)' ],
                  } ],
                  [ 'target_arch=="x64"', {
                    'action': [ 'elfwrap', '-64', '-o', '<@(_outputs)', '<@(_inputs)' ],
                  } ],
                ],
              },
            ],
          },
        ],
      ],
    },
    {
      'target_name': 'node_dtrace_provider',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true" and OS!="mac" and OS!="linux"', {
          'actions': [
            {
              'action_name': 'node_dtrace_provider_o',
              'inputs': [
                '<(OBJ_DIR)/node/src/node_dtrace.o',
              ],
              'outputs': [
                '<(OBJ_DIR)/node/src/node_dtrace_provider.o'
              ],
              'action': [ 'dtrace', '-G', '-xnolibs', '-s', 'libraries/node/src/node_provider.d',
                '<@(_inputs)', '-o', '<@(_outputs)' ]
            }
          ]
        }],
        [ 'node_use_dtrace=="true" and OS=="linux"', {
          'actions': [
            {
              'action_name': 'node_dtrace_provider_o',
              'inputs': [ 'libraries/node/src/node_provider.d' ],
              'outputs': [
                '<(SHARED_INTERMEDIATE_DIR)/node_dtrace_provider.o'
              ],
              'action': [
                'dtrace', '-C', '-G', '-s', '<@(_inputs)', '-o', '<@(_outputs)'
              ],
            }
          ],
        }],
      ]
    },
    {
      'target_name': 'node_dtrace_ustack',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true" and OS!="mac" and OS!="linux"', {
          'actions': [
            {
              'action_name': 'node_dtrace_ustack_constants',
              'inputs': [
                '<(V8_BASE)'
              ],
              'outputs': [
                '<(SHARED_INTERMEDIATE_DIR)/v8constants.h'
              ],
              'action': [
                'libraries/node/tools/genv8constants.py',
                '<@(_outputs)',
                '<@(_inputs)'
              ]
            },
            {
              'action_name': 'node_dtrace_ustack',
              'inputs': [
                'libraries/node/src/v8ustack.d',
                '<(SHARED_INTERMEDIATE_DIR)/v8constants.h'
              ],
              'outputs': [
                '<(OBJ_DIR)/node/src/node_dtrace_ustack.o'
              ],
              'conditions': [
                [ 'target_arch=="ia32"', {
                  'action': [
                    'dtrace', '-32', '-I<(SHARED_INTERMEDIATE_DIR)', '-Isrc',
                    '-C', '-G', '-s', 'libraries/node/src/v8ustack.d', '-o', '<@(_outputs)',
                  ]
                } ],
                [ 'target_arch=="x64"', {
                  'action': [
                    'dtrace', '-64', '-I<(SHARED_INTERMEDIATE_DIR)', '-Isrc',
                    '-C', '-G', '-s', 'libraries/node/src/v8ustack.d', '-o', '<@(_outputs)',
                  ]
                } ],
              ]
            },
          ]
        } ],
      ]
    },
    {
      'target_name': 'specialize_node_d',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true"', {
          'actions': [
            {
              'action_name': 'specialize_node_d',
              'inputs': [
                'libraries/node/src/node.d'
              ],
              'outputs': [
                '<(PRODUCT_DIR)/node.d',
              ],
              'action': [
                'libraries/node/tools/specialize_node_d.py',
                '<@(_outputs)',
                '<@(_inputs)',
                '<@(OS)',
                '<@(target_arch)',
              ],
            },
          ],
        } ],
      ]
    }
  ] # end targets
}
