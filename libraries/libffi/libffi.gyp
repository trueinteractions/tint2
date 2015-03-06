
{
  'variables': {
    'target_os%': 'none',
  },
  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # static release
          },
        },
      }
    },
    'msvs_settings': {
      'VCCLCompilerTool': {
      },
      'VCLibrarianTool': {
      },
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },
    'conditions': [
      ['OS == "win"', {
        'defines': [
          'WIN32'
        ],
      }]
    ],
  },

  # Compile .asm files on Windows
  'conditions': [
    ['OS=="win"', {
      'target_defaults': {
        'conditions': [
          ['target_arch=="ia32"', {
            'variables': { 'ml': ['ml', '/nologo', '/safeseh' ] }
          }, {
            'variables': { 'ml': ['ml64', '/nologo' ] }
          }]
        ],
        'rules': [
          {
            'rule_name': 'assembler',
            'msvs_cygwin_shell': 0,
            'extension': 'asm',
            'inputs': [
            ],
            'outputs': [
              '<(INTERMEDIATE_DIR)/<(RULE_INPUT_ROOT).obj',
            ],
            'action': [
              '<@(ml)', '/c', '/Fo<(INTERMEDIATE_DIR)/<(RULE_INPUT_ROOT).obj', '<(RULE_INPUT_PATH)'
            ],
            'message': 'Building assembly file <(RULE_INPUT_PATH)',
            'process_outputs_as_sources': 1,
          },
        ],
      },
    }],
  ],

  'targets': [
    {
      'target_name': 'ffi',
      'product_prefix': 'lib',
      'type': 'static_library',
      'sources': [
      ],
      'defines': [
        'PIC',
        'FFI_BUILDING',
        'HAVE_CONFIG_H'
      ],
      'conditions': [
        ['OS=="mac" and target_ios==1', {
          'cflags': [
            '-fasm-blocks'
          ],
          'include_dirs': [ 
            'ios/include/',
            '<!(xcrun --sdk iphoneos --show-sdk-path)/usr/include/mach'
          ],
          'sources': [
            # 'ios/src/aarch64/ffi_arm64.c',
            # 'ios/src/aarch64/sysv_arm64.S',
            'ios/src/arm/ffi_armv7.c',
            'ios/src/arm/sysv_armv7.S',
            'ios/src/arm/trampoline_armv7.S',
            'ios/src/java_raw_api.c',
            'ios/src/prep_cif.c',
            'ios/src/raw_api.c',
            'ios/src/types.c'
          ],
        }], 
        ['OS=="mac" and target_ios==0', {
          'include_dirs': [ 'osx/' ],
          'sources': [
            'osx/ffi.c',
            'osx/ffi64.c',
            'osx/java_raw_api.c',
            'osx/prep_cif.c',
            'osx/raw_api.c',
            'osx/sysv.S',
            'osx/unix64.S',
            'osx/types.c',
          ],
        }], 
        ['OS=="win"', {
          'include_dirs': [ 'win/' ],
          'sources': [
            'win/ffi.c',
            'win/ffiw64.c',
            'win/java_raw_api.c',
            'win/prep_cif.c',
            'win/raw_api.c',
            'win/win64.S',
            'win/types.c',
          ],
        }],
      ]
    }
  ]
}