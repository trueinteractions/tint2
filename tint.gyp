{
  'variables': {
    'v8_use_snapshot%': 'true',
    # Turn off -Werror in V8
    # See http://codereview.chromium.org/8159015
    'werror': '',
    'node_use_dtrace%': 'false',
    'node_use_etw%': 'false',
    'node_use_perfctr%': 'false',
    'node_has_winsdk%': 'false',
    'node_shared_v8%': 'false',
    'node_shared_zlib%': 'false',
    'node_shared_http_parser%': 'false',
    'node_shared_cares%': 'false',
    'node_shared_libuv%': 'false',
    'node_use_openssl%': 'true',
    'node_use_systemtap%': 'false',
    'node_shared_openssl%': 'false',
    'library_files': [
      'modules/Bridge/ref.js',
      'modules/Bridge/struct.js',
      'modules/Bridge/_foreign_function.js',
      'modules/Bridge/bindings.js',
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
      'modules/Bridge/class.js',
      'modules/Bridge/core.js',
      'modules/Bridge/exception.js',
      'modules/Bridge/id.js',
      'modules/Bridge/import.js',
      'modules/Bridge/index.js',
      'modules/Bridge/ivar.js',
      'modules/Bridge/method.js',
      'modules/Bridge/types.js',
      'modules/Application/Application_mac.js',
      'modules/Application/Common_mac.js',
      'modules/AppSchema/AppSchema_mac.js',
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
      'modules/SelectInput/SelectInput_mac.js',
      'modules/Slider/Slider_mac.js',
      'modules/StatusBar/StatusBar_mac.js',
      'modules/Split/Split_mac.js',
      'modules/Table/Table_mac.js',
      'modules/TextInput/TextInput_mac.js',
      'modules/Toolbar/Toolbar_mac.js',
      'modules/Utilities/Utilities_base.js',
      'modules/Utilities/Utilities_mac.js',
      'modules/WebView/WebView_mac.js',
      'modules/Window/Window_mac.js',
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
      'libraries/node/lib/https.js',
      'libraries/node/lib/module.js',
      'libraries/node/lib/net.js',
      'libraries/node/lib/os.js',
      'libraries/node/lib/path.js',
      'libraries/node/lib/punycode.js',
      'libraries/node/lib/querystring.js',
      'libraries/node/lib/readline.js',
      'libraries/node/lib/repl.js',
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
      'libraries/node/lib/tty.js',
      'libraries/node/lib/url.js',
      'libraries/node/lib/util.js',
      'libraries/node/lib/vm.js',
      'libraries/node/lib/zlib.js',
    ],
  },

  'targets': [
    {
      'target_name': 'tint',
      'type': 'executable',

      'dependencies': [
        'libraries/node/deps/v8/tools/gyp/v8.gyp:postmortem-metadata',
        'node_js2c#host',
        'ffi_bindings',
      ],

      'include_dirs': [
        'libraries/node/src',
        'libraries/node/tools/msvs/genfiles',
        'libraries/node/deps/uv/src/ares',
        'libraries/node-ffi/src',
        '<(SHARED_INTERMEDIATE_DIR)' # for node_natives.h
      ],

      'sources': [
        'modules/AppSchema/AppSchema_mac.h',
        'modules/AppSchema/AppSchema_mac.mm',
        'modules/Runtime/Main_mac.mm',
        'libraries/node/src/fs_event_wrap.cc',
        'libraries/node/src/cares_wrap.cc',
        'libraries/node/src/handle_wrap.cc',
        'libraries/node/src/node.cc',
        'libraries/node/src/node_buffer.cc',
        'libraries/node/src/node_constants.cc',
        'libraries/node/src/node_extensions.cc',
        'libraries/node/src/node_file.cc',
        'libraries/node/src/node_http_parser.cc',
        'libraries/node/src/node_javascript.cc',
        #'libraries/node/src/node_main.cc',
        'libraries/node/src/node_os.cc',
        'libraries/node/src/node_script.cc',
        'libraries/node/src/node_stat_watcher.cc',
        'libraries/node/src/node_string.cc',
        'libraries/node/src/node_zlib.cc',
        'libraries/node/src/pipe_wrap.cc',
        'libraries/node/src/signal_wrap.cc',
        'libraries/node/src/string_bytes.cc',
        'libraries/node/src/stream_wrap.cc',
        'libraries/node/src/slab_allocator.cc',
        'libraries/node/src/tcp_wrap.cc',
        'libraries/node/src/timer_wrap.cc',
        'libraries/node/src/tty_wrap.cc',
        'libraries/node/src/process_wrap.cc',
        'libraries/node/src/v8_typed_array.cc',
        'libraries/node/src/udp_wrap.cc',
        # headers to make for a more pleasant IDE experience
        'libraries/node/src/handle_wrap.h',
        'libraries/node/src/node.h',
        'libraries/node/src/node_buffer.h',
        'libraries/node/src/node_constants.h',
        'libraries/node/src/node_crypto.h',
        'libraries/node/src/node_extensions.h',
        'libraries/node/src/node_file.h',
        'libraries/node/src/node_http_parser.h',
        'libraries/node/src/node_javascript.h',
        'libraries/node/src/node_os.h',
        'libraries/node/src/node_root_certs.h',
        'libraries/node/src/node_script.h',
        'libraries/node/src/node_string.h',
        'libraries/node/src/node_version.h',
        'libraries/node/src/ngx-queue.h',
        'libraries/node/src/pipe_wrap.h',
        'libraries/node/src/tty_wrap.h',
        'libraries/node/src/tcp_wrap.h',
        'libraries/node/src/udp_wrap.h',
        'libraries/node/src/req_wrap.h',
        'libraries/node/src/slab_allocator.h',
        'libraries/node/src/string_bytes.h',
        'libraries/node/src/stream_wrap.h',
        'libraries/node/src/tree.h',
        'libraries/node/src/v8_typed_array.h',
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
        'PLATFORM="<(OS)"',
        'NODE_TAG="<(node_tag)"',
      ],

      'conditions': [
        [ 'node_use_openssl=="true"', {
          'defines': [ 'HAVE_OPENSSL=1' ],
          'sources': [ 'libraries/node/src/node_crypto.cc' ],
          'conditions': [
            [ 'node_shared_openssl=="false"', {
              'dependencies': [ './libraries/node/deps/openssl/openssl.gyp:openssl' ],
            }]]
        }, {
          'defines': [ 'HAVE_OPENSSL=0' ]
        }],
        [ 'node_use_dtrace=="true"', {
          'defines': [ 'HAVE_DTRACE=1' ],
          'dependencies': [ 'node_dtrace_header' ],
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
          'sources': [
            'libraries/node/src/node_dtrace.cc',
          ],
          'conditions': [ [
            'OS!="mac"', {
              'sources': [
                'libraries/node/src/node_dtrace_ustack.cc',
                'libraries/node/src/node_dtrace_provider.cc',
              ]
            }
          ] ]
        } ],
        [ 'node_use_systemtap=="true"', {
          'defines': [ 'HAVE_SYSTEMTAP=1', 'STAP_SDT_V1=1' ],
          'dependencies': [ 'node_systemtap_header' ],
          'include_dirs': [ '<(SHARED_INTERMEDIATE_DIR)' ],
          'sources': [
            'libraries/node/src/node_dtrace.cc',
            '<(SHARED_INTERMEDIATE_DIR)/node_systemtap.h',
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
        [ 'node_shared_v8=="false"', {
          'sources': [
            'libraries/node/deps/v8/include/v8.h',
            'libraries/node/deps/v8/include/v8-debug.h',
          ],
          'dependencies': [ 'libraries/node/deps/v8/tools/gyp/v8.gyp:v8' ],
        }],

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
          'sources': [
            'libraries/node/src/res/node.rc',
          ],
          'defines': [
            'FD_SETSIZE=1024',
            # we need to use node's preferred "win32" rather than gyp's preferred "win"
            'PLATFORM="win32"',
            '_UNICODE=1',
          ],
          'libraries': [ '-lpsapi.lib' ]
        }, { # POSIX
          'defines': [ '__POSIX__' ],
        }],
        [ 'OS=="mac"', {
          'libraries': [ '-framework Carbon' ],
          'defines!': [
            'PLATFORM="mac"',
          ],
          'defines': [
            # we need to use node's preferred "darwin" rather than gyp's preferred "mac"
            'PLATFORM="darwin"',
          ],
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
        'VCLinkerTool': {
          'SubSystem': 1, # /subsystem:console
        },
      },
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
      'target_name': 'node_js2c',
      'type': 'none',
      'toolsets': ['host'],
      'actions': [
        {
          'action_name': 'node_js2c',
          'inputs': [
            '<@(library_files)',
            './build/config.gypi',
          ],
          'outputs': [
            '<(SHARED_INTERMEDIATE_DIR)/node_natives.h',
          ],
          'conditions': [
            [ 'node_use_dtrace=="false"'
              ' and node_use_etw=="false"'
              ' and node_use_systemtap=="false"',
            {
                'inputs': ['libraries/node/src/macros.py']
              }
              ],
            [ 'node_use_perfctr=="false"', {
              'inputs': [ 'libraries/node/src/perfctr_macros.py' ]
            }]
          ],
              'action': [
                '<(python)',
                'tools/js2c.py',
                '<@(_outputs)',
                '<@(_inputs)',
              ],
        },
      ],
    }, # end node_js2c
    #{
    #  'target_name': 'node_js2c',
    #  'type': 'none',
    #  'toolsets': ['host'],
    #  'actions': [
    #    {
    #      'action_name': 'node_js2c',
    #      'inputs': [
    #        '<@(library_files)',
    #        './config.gypi',
    #      ],
    #      'outputs': [
    #        '<(SHARED_INTERMEDIATE_DIR)/node_natives.h',
    #      ],
    #      'conditions': [
    #        [ 'node_use_dtrace=="false"'
    #          ' and node_use_etw=="false"'
    #          ' and node_use_systemtap=="false"',
    #        {
    #            'inputs': ['libraries/node/src/macros.py']
    #          }
    #          ],
    #        [ 'node_use_perfctr=="false"', {
    #          'inputs': [ 'libraries/node/src/perfctr_macros.py' ]
    #        }]
    #      ],
    #          'action': [
    #            '<(python)',
    #            'libraries/node/tools/js2c.py',
    #            '<@(_outputs)',
    #            '<@(_inputs)',
    #          ],
    #    },
    #  ],
    #}, # end node_js2c
    {
      'target_name': 'ffi_bindings',
      'type': 'static_library',
      'sources': [
          'modules/Bridge/ffi.h',
          'modules/Bridge/ffi.cc',
          'modules/Bridge/callback_info.cc',
          'modules/Bridge/threaded_callback_invokation.cc'
      ],
      'include_dirs': [
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
      'target_name': 'node_systemtap_header',
      'type': 'none',
      'conditions': [
        [ 'node_use_systemtap=="true"', {
          'actions': [
            {
              'action_name': 'node_systemtap_header',
              'inputs': [ 'libraries/node/src/node_systemtap.d' ],
              'outputs': [ '<(SHARED_INTERMEDIATE_DIR)/node_systemtap.h' ],
              'action': [ 'dtrace', '-h', '-C', '-s', '<@(_inputs)',
                '-o', '<@(_outputs)' ]
            }
          ]
        } ]
      ]
    },
    {
      'target_name': 'node_dtrace_provider',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true" and OS!="mac"', {
          'actions': [
            {
              'action_name': 'node_dtrace_provider_o',
              'inputs': [
                'libraries/node/src/node_provider.d',
                '<(PRODUCT_DIR)/obj.target/node/src/node_dtrace.o'
              ],
              'outputs': [
                '<(PRODUCT_DIR)/obj.target/node/src/node_dtrace_provider.o'
              ],
              'action': [ 'dtrace', '-G', '-xnolibs', '-s', '<@(_inputs)',
                '-o', '<@(_outputs)' ]
            }
          ]
        } ]
      ]
    },
    {
      'target_name': 'node_dtrace_ustack',
      'type': 'none',
      'conditions': [
        [ 'node_use_dtrace=="true" and OS!="mac"', {
          'actions': [
            {
              'action_name': 'node_dtrace_ustack_constants',
              'inputs': [
                '<(PRODUCT_DIR)/obj.target/deps/v8/tools/gyp/libv8_base.a'
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
                '<(PRODUCT_DIR)/obj.target/node/src/node_dtrace_ustack.o'
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
            }
          ]
        } ],
      ]
    }
  ] # end targets
}
