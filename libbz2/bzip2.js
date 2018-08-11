
var Module = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  return (
function(Module) {
  Module = Module || {};

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// Route URL GET parameters to argc+argv
if (typeof window === "object") {
  Module['arguments'] = window.location.search.substr(1).trim().split('&');
  // If no args were passed arguments = [''], in which case kill the single empty string.
  if (!Module['arguments'][0])
    Module['arguments'] = [];
}


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// The environment setup code below is customized to use Module.
// *** Environment setup code ***

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
    ret = tryParseAsDataURI(filename);
    if (!ret) {
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    }
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', function(reason, p) {
    err('node.js exiting due to unhandled promise rejection');
    process['exit'](1);
  });

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WEB) {
    if (document.currentScript) {
      scriptDirectory = document.currentScript.src;
    }
  } else { // worker
    scriptDirectory = self.location.href;
  }
  // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.split('/').slice(0, -1).join('/') + '/';
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
  throw new Error('environment detection error');
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// *** Environment setup code ***

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

// stack management, and other functionality that is provided by the compiled code,
// should not be used before it is ready
stackSave = stackRestore = stackAlloc = setTempRet0 = getTempRet0 = function() {
  abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
};

function staticAlloc(size) {
  assert(!staticSealed);
  var ret = STATICTOP;
  STATICTOP = (STATICTOP + size + 15) & -16;
  assert(STATICTOP < TOTAL_MEMORY, 'not enough memory for static allocation - increase TOTAL_MEMORY');
  return ret;
}

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  if (end >= TOTAL_MEMORY) {
    var success = enlargeMemory();
    if (!success) {
      HEAP32[DYNAMICTOP_PTR>>2] = ret;
      return 0;
    }
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  var ret = size = Math.ceil(size / factor) * factor;
  return ret;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 1;
var functionPointers = new Array(1);

// 'sig' parameter is only used on LLVM wasm backend
function addFunction(func, sig) {
  if (typeof sig === 'undefined') {
    err('warning: addFunction(): You should provide a wasm function signature string as a second argument. This is not necessary for asm.js and asm2wasm, but is required for the LLVM wasm backend, so it is recommended for full portability.');
  }
  var base = 0;
  for (var i = base; i < base + 1; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
}

function removeFunction(index) {
  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    assert(args.length == sig.length-1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    assert(sig.length == 1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].call(null, ptr);
  }
}


function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}

var Runtime = {
  // FIXME backwards compatibility layer for ports. Support some Runtime.*
  //       for now, fix it there, then remove it from here. That way we
  //       can minimize any period of breakage.
  dynCall: dynCall, // for SDL2 port
  // helpful errors
  getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;


// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html



//========================================
// Runtime essentials
//========================================

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

var JSfuncs = {
  // Helpers for cwrap -- it can't refer to Runtime directly because it might
  // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
  // out what the minified function name is.
  'stackSave': function() {
    stackSave()
  },
  'stackRestore': function() {
    stackRestore()
  },
  // type conversion from js to c
  'arrayToC' : function(arr) {
    var ret = stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  },
  'stringToC' : function(str) {
    var ret = 0;
    if (str !== null && str !== undefined && str !== 0) { // null string
      // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
      var len = (str.length << 2) + 1;
      ret = stackAlloc(len);
      stringToUTF8(str, ret, len);
    }
    return ret;
  }
};

// For fast lookup of conversion functions
var toC = {
  'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC']
};


// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === 'string') return Pointer_stringify(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return staticAlloc(size);
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return UTF8ToString(ptr);
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

function demangle(func) {
  warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (x + ' [' + y + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
  // Also test the global address 0 for integrity. This check is not compatible with SAFE_SPLIT_MEMORY though, since that mode already tests all address 0 accesses on its own.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
}


function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

if (!Module['reallocBuffer']) Module['reallocBuffer'] = function(size) {
  var ret;
  try {
    if (ArrayBuffer.transfer) {
      ret = ArrayBuffer.transfer(buffer, size);
    } else {
      var oldHEAP8 = HEAP8;
      ret = new ArrayBuffer(size);
      var temp = new Int8Array(ret);
      temp.set(oldHEAP8);
    }
  } catch(e) {
    return false;
  }
  var success = _emscripten_replace_memory(ret);
  if (!success) return false;
  return ret;
};

function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.
  assert(HEAP32[DYNAMICTOP_PTR>>2] > TOTAL_MEMORY); // This function should only ever be called after the ceiling of the dynamic heap has already been bumped to exceed the current total size of the asm.js heap.


  var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
  var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.

  if (HEAP32[DYNAMICTOP_PTR>>2] > LIMIT) {
    err('Cannot enlarge memory, asked to go up to ' + HEAP32[DYNAMICTOP_PTR>>2] + ' bytes, but the limit is ' + LIMIT + ' bytes!');
    return false;
  }

  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.

  while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR>>2]) { // Keep incrementing the heap size as long as it's less than what is requested.
    if (TOTAL_MEMORY <= 536870912) {
      TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
    } else {
      // ..., but after that, add smaller increments towards 2GB, which we cannot reach
      TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
      if (TOTAL_MEMORY === OLD_TOTAL_MEMORY) {
        warnOnce('Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only ' + TOTAL_MEMORY);
      }
    }
  }

  var start = Date.now();

  var replacement = Module['reallocBuffer'](TOTAL_MEMORY);
  if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
    err('Failed to grow the heap from ' + OLD_TOTAL_MEMORY + ' bytes to ' + TOTAL_MEMORY + ' bytes, not enough memory!');
    if (replacement) {
      err('Expected to get back a buffer of size ' + TOTAL_MEMORY + ' bytes, but instead got back a buffer of size ' + replacement.byteLength);
    }
    // restore the state to before this call, we failed
    TOTAL_MEMORY = OLD_TOTAL_MEMORY;
    return false;
  }

  // everything worked

  updateGlobalBuffer(replacement);
  updateGlobalBufferViews();

  if (!Module["usingWasm"]) {
    err('Warning: Enlarging memory arrays, this is not fast! ' + [OLD_TOTAL_MEMORY, TOTAL_MEMORY]);
  }


  return true;
}

var byteLength;
try {
  byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
  byteLength(new ArrayBuffer(4)); // can fail on older ie
} catch(e) { // can fail on older node/v8
  byteLength = function(buffer) { return buffer.byteLength; };
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  // Use a WebAssembly memory where available
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    assert(TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
    Module['wasmMemory'] = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE });
    buffer = Module['wasmMemory'].buffer;
  } else
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 0x63736d65; /* 'emsc' */
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

assert(Math['imul'] && Math['fround'] && Math['clz32'] && Math['trunc'], 'this is a legacy browser, build with LEGACY_VM_SUPPORT');

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



var /* show errors on likely calls to FS when it was not included */ FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;



// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




function integrateWasmJS() {
  // wasm.js has several methods for creating the compiled code module here:
  //  * 'native-wasm' : use native WebAssembly support in the browser
  //  * 'interpret-s-expr': load s-expression code from a .wast and interpret
  //  * 'interpret-binary': load binary wasm and interpret
  //  * 'interpret-asm2wasm': load asm.js code, translate to wasm, and interpret
  //  * 'asmjs': no wasm, just load the asm.js code and use that (good for testing)
  // The method is set at compile time (BINARYEN_METHOD)
  // The method can be a comma-separated list, in which case, we will try the
  // options one by one. Some of them can fail gracefully, and then we can try
  // the next.

  // inputs

  var method = 'native-wasm';

  var wasmTextFile = '';
  var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABdRJgA39/fwBgA39/fwF/YAJ/fwBgAX8Bf2AAAX9gAX8AYAJ/fwF/YAR/f39/AX9gBH9/f38AYAAAYAV/f39/fwF/YAd/f39/f39/AGADfn9/AX9gAn5/AX9gBX9/f39/AGAGf3x/f39/AX9gAXwBfmACfH8BfAKLBBwDZW52Bm1lbW9yeQIAgAIDZW52BXRhYmxlAXAAEgNlbnYJdGFibGVCYXNlA38AA2Vudg5EWU5BTUlDVE9QX1BUUgN/AANlbnYIU1RBQ0tUT1ADfwADZW52CVNUQUNLX01BWAN/AANlbnYNZW5sYXJnZU1lbW9yeQAEA2Vudg5nZXRUb3RhbE1lbW9yeQAEA2VudhdhYm9ydE9uQ2Fubm90R3Jvd01lbW9yeQAEA2VudhJhYm9ydFN0YWNrT3ZlcmZsb3cABQNlbnYLbnVsbEZ1bmNfaWkABQNlbnYNbnVsbEZ1bmNfaWlpaQAFA2VudgxudWxsRnVuY192aWkABQNlbnYNbnVsbEZ1bmNfdmlpaQAFA2Vudglqc0NhbGxfaWkABgNlbnYLanNDYWxsX2lpaWkABwNlbnYKanNDYWxsX3ZpaQAAA2Vudgtqc0NhbGxfdmlpaQAIA2VudgdfX19sb2NrAAUDZW52C19fX3NldEVyck5vAAUDZW52DV9fX3N5c2NhbGwxNDAABgNlbnYNX19fc3lzY2FsbDE0NgAGA2VudgxfX19zeXNjYWxsNTQABgNlbnYLX19fc3lzY2FsbDYABgNlbnYJX19fdW5sb2NrAAUDZW52Bl9hYm9ydAAJA2VudhZfZW1zY3JpcHRlbl9tZW1jcHlfYmlnAAEDZW52BV9leGl0AAUDVlUDAwQFAgIFBAUECgMFAQIBBgMDAwsDBQMBAQMEAwEGAwEKAwUAAwAMDQ0DAQ4GDxAREQEEBAYGBgEGAQMHBgQJAwMBBgkDAQEDBgMHAQACCAADAQIABh8GfwEjAQt/ASMCC38BIwMLfwFBAAt/AUEAC38BQQALB9MCGRBfX2dyb3dXYXNtTWVtb3J5ABYRX19fZXJybm9fbG9jYXRpb24AMQtfZGVjb21wcmVzcwAgB19mZmx1c2gAVgdfZmluaXNoACEFX2ZyZWUALA9fbGx2bV9ic3dhcF9pMzIAWwdfbWFsbG9jACsHX21lbWNweQBcB19t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CwsgQCAEQXhqIgI2AgAgAEE0aiIEKAIAQQh0IDogAnZB/wFxciECIAQgAjYCACACQQBIBH9BfCE/ICAhQiAPIUMgLyENIDEhRCAfIUUgMiFGIBIhRyAXIUggIiFJIA4hSiAKIUsgByFMIAUhTSABIU4gECFPIDQhUCA3IVEgFCFSIBMhUyAbIVQgFSEhIDAhVSAzIVYgCyFXIBEhWCAZIVkgFiFaIC4hWyA1IVwgGiFdIB0hXiAjIV8gJCFgIBwhYSAlIWIgJiFjICchZCAoIWUgKSE9ICohPiArITggDCE7IAghOSAJITwgBiEtIAMhGCAeIWZBjgQFIAIgACgCJEGgjQZsQQpySgR/QXwhPyAgIUIgDyFDIC8hDSAxIUQgHyFFIDIhRiASIUcgFyFIICIhSSAOIUogCiFLIAchTCAFIU0gASFOIBAhTyA0IVAgNyFRIBQhUiATIVMgGyFUIBUhISAwIVUgMyFWIAshVyARIVggGSFZIBYhWiAuIVsgNSFcIBohXSAdIV4gIyFfICQhYCAcIWEgJSFiICYhYyAnIWQgKCFlICkhPSAqIT4gKyE4IAwhOyAIITkgCSE8IAYhLSADIRggHiFmQY4EBSALIbEGIBEhsgYgGSGzBiAWIbQGIC4htQYgNSG2BiAaIbcGIB0huAYgIyG5BiAkIboGIBwhuwYgJSG8BiAmIb0GICchvgYgKCG/BiApIcAGICohwQYgKyHCBiAMIcMGIAghxAYgCSHFBiAGIcYGIAMhxwYgGyHIBiAQIckGIBMhygYgFCHLBiA3IcwGIC8hzQYgEiHOBiAXIc8GIDAh0AYgMSHRBiAiIdIGIDIh0wYgMyHUBiA0IdUGIB4h1gYgHyHXBiAgIdgGIA8h2QYgDiHaBiAKIdsGIAch3AYgBSHdBiABId4GQbkBCwshAgsCfwJAA0ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAkG5AWsO1gIAARAQEBAQEBAQEBAQAhAQEBAQEBAQEBAQEBAQEBADEBAQEBAQEAQQEBAQEBAQEAUQEBAQEBAQEBAQEBAQEBAQEBAQEBAGEBAQEBAQEBAQBxAQEBAQEBAIEBAQEBAQEBAQEBAQEBAQEBAQEBAQCRAQEBAQEBAQEBAKEBAQEBAQEBAQ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ByD/BiG5ByCAByG6ByCBByG7ByCCByG8ByCDByG9ByCEByG+ByCFByG/ByCGByHAByCHByHBByCIByHCByCJByHDByCKByHEByCLByHFByCMBwshxgcLCyCYByHpAiCZB0EBaiFwIJoHIXsgmwchfCCcByF9IJ0HIX4gngchfyCfByGAASCgByGBASChByGCASCiByGDASCjByGEASCkByGFASClByGGASCmByGHASCnByGIASCoByGJASCpByGKASCqByGLASCrByGMASCsByGNASCtByGOASCuByGPASCvByGQASCwByGRASCxByGSASCyByHqAiCzByGTASC0ByGUASC1ByGVASC2ByGWASC3ByGXASC4ByGYASC5ByGZASC6ByGaASC7ByGbASC8ByGcASC9ByGdASC+ByGeASC/ByGfASDAByGgASDBByGhASDCByGiASDDByGjASDEByGkASDFByGlASDGByGmAUHDASECDAELCyAAQegYaiIFQQA2AgBBACEDQQAhAQNAIABB7BhqIANqLAAABEAgAEH8GmogAWogAzoAACAFIAUoAgBBAWoiATYCAAsgA0EBaiIDQYACRw0ACyABBEAgAUECaiGrASDpAiGsASBwIa0BIHshrgEgfCGvASB9IbABIH4hsQEgfyGyASCAASGzASCBASG0ASCCASG1ASCDASG2ASCEASG3ASCFASG4ASCGASG5ASCHASG6ASCIASG7ASCJASG8ASCKASG9ASCLASG+ASCMASG/ASCNASHAASCOASHBASCPASHCASCQASHDASCRASHEASCSASHFASCTASGNByCUASHGASCVASHHASCWASHIASCXASHJASCYASHKASCZASHLASCaASHMASCbASHNASCcASHOASCdASHPASCeASHQASCfASHRASCgASHSASChASHTASCiASHUASCjASHVASCkASHWASClASHXASCmASHYAUHXASECBUF8IT8goAEhQiChASFDIJUBIQ0gmQEhRCCfASFFIJsBIUYglgEhRyCXASFIIJoBIUkgogEhSiCjASFLIKQBIUwgpQEhTSCmASFOIJIBIU8gnQEhUCCUASFRIJMBIVIg6gIhUyDpAiFUIHAhISCYASFVIJwBIVYgeyFXIHwhWCB9IVkgfiFaIH8hWyCAASFcIIEBIV0gggEhXiCDASFfIIQBIWAghQEhYSCGASFiIIcBIWMgiAEhZCCJASFlIIoBIT0giwEhPiCMASE4II0BITsgjgEhOSCPASE8IJABIS0gkQEhGCCeASFmQY4EIQILDAAACwALIKcBJAUgAAsL0AoBKn8CfwJAIAQgBUoiMEUEQCAGQQBMBEAgAUIANwIAIAFCADcCCCABQgA3AhAgAUIANwIYIAFCADcCICABQgA3AiggAUIANwIwIAFCADcCOCABQUBrQgA3AgAgAUIANwJIIAFCADcCUCABQQA2AlgMAgsgBCEJA0BBACEHA0AgCSADIAdqLQAARgRAIAIgCEECdGogBzYCACAIQQFqIQgLIAdBAWoiByAGRw0ACyAJQQFqIQcgCSAFSARAIAchCQwBCwsLIAFCADcCACABQgA3AgggAUIANwIQIAFCADcCGCABQgA3AiAgAUIANwIoIAFCADcCMCABQgA3AjggAUFAa0IANwIAIAFCADcCSCABQgA3AlAgAUEANgJYIAZBAEwNAEEAIQIDQCABIAMgAmotAABBAWpBAnRqIgggCCgCAEEBajYCACACQQFqIgIgBkcNAAsgAUEIaiIKIQMgAUEMaiILIQYgAUEQaiIMIQggAUEUaiINIQkgAUEYaiIOIQcgAUEcaiIPIR8gAUEgaiIQISAgAUEkaiIRISEgAUEoaiISISIgAUEsaiITISMgAUEwaiIUISQgAUE0aiIVISUgAUE4aiIWISYgAUE8aiIXIScgAUFAayIYISggAUHEAGoiGSEpIAFByABqIhohKiABQcwAaiIbISsgAUHQAGoiHCEsIAFB1ABqIh0hLSABQdgAaiIeIS4gAUEEaiICIS8gCigCACEKIAsoAgAhCyAMKAIAIQwgDSgCACENIA4oAgAhDiAPKAIAIQ8gECgCACEQIBEoAgAhESASKAIAIRIgEygCACETIBQoAgAhFCAVKAIAIRUgFigCACEWIBcoAgAhFyAYKAIAIRggGSgCACEZIBooAgAhGiAbKAIAIRsgHCgCACEcIB0oAgAhHSAeKAIAIR4gAigCAAwBCyABQQhqIQMgAUEMaiEGIAFBEGohCCABQRRqIQkgAUEYaiEHIAFBHGohHyABQSBqISAgAUEkaiEhIAFBKGohIiABQSxqISMgAUEwaiEkIAFBNGohJSABQThqISYgAUE8aiEnIAFB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ASgCEDYCECAAIAEoAhQ2AhQgACABKAIYNgIYIAAgASgCHDYCHCAAIAEoAiA2AiAgACABKAIkNgIkIAAgASgCKDYCKCAAIAEoAiw2AiwgACABKAIwNgIwIAAgASgCNDYCNCAAIAEoAjg2AjggACABKAI8NgI8IABBQGshACABQUBrIQEMAQsLA0AgACACSARAIAAgASgCADYCACAAQQRqIQAgAUEEaiEBDAELCwUgA0EEayECA0AgACACSARAIAAgASwAADoAACAAIAEsAAE6AAEgACABLAACOgACIAAgASwAAzoAAyAAQQRqIQAgAUEEaiEBDAELCwsDQCAAIANIBEAgACABLAAAOgAAIABBAWohACABQQFqIQEMAQsLIAQLmAIBBH8gACACaiEEIAFB/wFxIQEgAkHDAE4EQANAIABBA3EEQCAAIAE6AAAgAEEBaiEADAELCyAEQXxxIgVBQGohBiABIAFBCHRyIAFBEHRyIAFBGHRyIQMDQCAAIAZMBEAgACADNgIAIAAgAzYCBCAAIAM2AgggACADNgIMIAAgAzYCECAAIAM2AhQgACADNgIYIAAgAzYCHCAAIAM2AiAgACADNgIkIAAgAzYCKCAAIAM2AiwgACADNgIwIAAgAzYCNCAAIAM2AjggACADNgI8IABBQGshAAwBCwsDQCAAIAVIBEAgACADNgIAIABBBGohAAwBCwsLA0AgACAESARAIAAgAToAACAAQQFqIQAMAQsLIAQgAmsLVQECfyAAQQBKIwQoAgAiASAAaiIAIAFIcSAAQQBIcgRAEAIaQQwQDUF/DwsjBCAANgIAEAEhAiAAIAJKBEAQAEUEQCMEIAE2AgBBDBANQX8PCwsgAQsMACABIABBA3ERAwALCABBACAAEAgLEwAgASACIAMgAEEHcUEEahEBAAsMAEEAIAAgASACEAkLEQAgASACIABBA3FBDGoRAgALCgBBACAAIAEQCgsTACABIAIgAyAAQQFxQRBqEQAACwwAQQAgACABIAIQCwsIAEEAEARBAAsIAEEBEAVBAAsGAEECEAYLBgBBAxAHCwuwNxwAQYQIC5QYtx3BBG47ggnZJkMN3HYEE2trxReyTYYaBVBHHrjtCCYP8Mki1taKL2HLSytkmww104bNMQqgjjy9vU84cNsRTMfG0Ege4JNFqf1SQaytFV8bsNRb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bGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbgAAAAAAAFQZAAAFAEHgMgsBAgBB+DILCgIAAAADAAAALCgAQZAzCwECAEGfMwsF//////8AQdAzCwEFAEHcMwsBAgBB9DMLDgQAAAADAAAA2CEAAAAEAEGMNAsBAQBBmzQLBQr/////AEHMNAsC0BkAQYw2CwL8JwBBxDYLiA0KCmJ6aXAyL2xpYmJ6aXAyOiBpbnRlcm5hbCBlcnJvciBudW1iZXIgJWQuClRoaXMgaXMgYSBidWcgaW4gYnppcDIvbGliYnppcDIsICVzLgpQbGVhc2UgcmVwb3J0IGl0IHRvIG1lIGF0OiBqc2V3YXJkQGJ6aXAub3JnLiAgSWYgdGhpcyBoYXBwZW5lZAp3aGVuIHlvdSB3ZXJlIHVzaW5nIHNvbWUgcHJvZ3JhbSB3aGljaCB1c2VzIGxpYmJ6aXAyIGFzIGEKY29tcG9uZW50LCB5b3Ugc2hvdWxkIGFsc28gcmVwb3J0IHRoaXMgYnVnIHRvIHRoZSBhdXRob3IocykKb2YgdGhhdCBwcm9ncmFtLiAgUGxlYXNlIG1ha2UgYW4gZWZmb3J0IHRvIHJlcG9ydCB0aGlzIGJ1ZzsKdGltZWx5IGFuZCBhY2N1cmF0ZSBidWcgcmVwb3J0cyBldmVudHVhbGx5IGxlYWQgdG8gaGlnaGVyCnF1YWxpdHkgc29mdHdhcmUuICBUaGFua3MuICBKdWxpYW4gU2V3YXJkLCAxMCBEZWNlbWJlciAyMDA3LgoKADEuMC42LCA2LVNlcHQtMjAxMAAKKioqIEEgc3BlY2lhbCBub3RlIGFib3V0IGludGVybmFsIGVycm9yIG51bWJlciAxMDA3ICoqKgoKRXhwZXJpZW5jZSBzdWdnZXN0cyB0aGF0IGEgY29tbW9uIGNhdXNlIG9mIGkuZS4gMTAwNwppcyB1bnJlbGlhYmxlIG1lbW9yeSBvciBvdGhlciBoYXJkd2FyZS4gIFRoZSAxMDA3IGFzc2VydGlvbgpqdXN0IGhhcHBlbnMgdG8gY3Jvc3MtY2hlY2sgdGhlIHJlc3VsdHMgb2YgaHVnZSBudW1iZXJzIG9mCm1lbW9yeSByZWFkcy93cml0ZXMsIGFuZCBzbyBhY3RzICh1bmludGVuZGVkbHkpIGFzIGEgc3RyZXNzCnRlc3Qgb2YgeW91ciBtZW1vcnkgc3lzdGVtLgoKSSBzdWdnZXN0IHRoZSBmb2xsb3dpbmc6IHRyeSBjb21wcmVzc2luZyB0aGUgZmlsZSBhZ2FpbiwKcG9zc2libHkgbW9uaXRvcmluZyBwcm9ncmVzcyBpbiBkZXRhaWwgd2l0aCB0aGUgLXZ2IGZsYWcuCgoqIElmIHRoZSBlcnJvciBjYW5ub3QgYmUgcmVwcm9kdWNlZCwgYW5kL29yIGhhcHBlbnMgYXQgZGlmZmVyZW50CiAgcG9pbnRzIGluIGNvbXByZXNzaW9uLCB5b3UgbWF5IGhhdmUgYSBmbGFreSBtZW1vcnkgc3lzdGVtLgogIFRyeSBhIG1lbW9yeS10ZXN0IHByb2dyYW0uICBJIGhhdmUgdXNlZCBNZW10ZXN0ODYKICAod3d3Lm1lbXRlc3Q4Ni5jb20pLiAgQXQgdGhlIHRpbWUgb2Ygd3JpdGluZyBpdCBpcyBmcmVlIChHUExkKS4KICBNZW10ZXN0ODYgdGVzdHMgbWVtb3J5IG11Y2ggbW9yZSB0aG9yb3VnbHkgdGhhbiB5b3VyIEJJT1NzCiAgcG93ZXItb24gdGVzdCwgYW5kIG1heSBmaW5kIGZhaWx1cmVzIHRoYXQgdGhlIEJJT1MgZG9lc24ndC4KCiogSWYgdGhlIGVycm9yIGNhbiBiZSByZXBlYXRhYmx5IHJlcHJvZHVjZWQsIHRoaXMgaXMgYSBidWcgaW4KICBiemlwMiwgYW5kIEkgd291bGQgdmVyeSBtdWNoIGxpa2UgdG8gaGVhciBhYm91dCBpdC4gIFBsZWFzZQogIGxldCBtZSBrbm93LCBhbmQsIGlkZWFsbHksIHNhdmUgYSBjb3B5IG9mIHRoZSBmaWxlIGNhdXNpbmcgdGhlCiAgcHJvYmxlbSAtLSB3aXRob3V0IHdoaWNoIEkgd2lsbCBiZSB1bmFibGUgdG8gaW52ZXN0aWdhdGUgaXQuCgoAIHsweCUwOHgsIDB4JTA4eH0ACiAgICBjb21iaW5lZCBDUkNzOiBzdG9yZWQgPSAweCUwOHgsIGNvbXB1dGVkID0gMHglMDh4AAogICAgWyVkOiBodWZmK210ZiAAcnQrcmxkAC0rICAgMFgweAAobnVsbCkALTBYKzBYIDBYLTB4KzB4IDB4AGluZgBJTkYAbmFuAE5BTgAuAIQLBG5hbWUB/AprAA1lbmxhcmdlTWVtb3J5AQ5nZXRUb3RhbE1lbW9yeQIXYWJvcnRPbkNhbm5vdEdyb3dNZW1vcnkDEmFib3J0U3RhY2tPdmVyZmxvdwQLbnVsbEZ1bmNfaWkFDW51bGxGdW5jX2lpaWkGDG51bGxGdW5jX3ZpaQcNbnVsbEZ1bmNfdmlpaQgJanNDYWxsX2lpCQtqc0NhbGxfaWlpaQoKanNDYWxsX3ZpaQsLanNDYWxsX3ZpaWkMB19fX2xvY2sNC19fX3NldEVyck5vDg1fX19zeXNjYWxsMTQwDw1fX19zeXNjYWxsMTQ2EAxfX19zeXNjYWxsNTQRC19fX3N5c2NhbGw2EglfX191bmxvY2sTBl9hYm9ydBQWX2Vtc2NyaXB0ZW5fbWVtY3B5X2JpZxUFX2V4aXQWEF9fZ3Jvd1dhc21NZW1vcnkXCnN0YWNrQWxsb2MYCXN0YWNrU2F2ZRkMc3RhY2tSZXN0b3JlGhNlc3RhYmxpc2hTdGFja1NwYWNlGwhzZXRUaHJldxwLc2V0VGVtcFJldDAdC2dldFRlbXBSZXQwHhFfcmVnaXN0ZXJDYWxsYmFjax8GX3N0YXJ0IAtfZGVjb21wcmVzcyEHX2ZpbmlzaCIWX0JaMl9iel9fQXNzZXJ0SF9fZmFpbCMQX2RlZmF1bHRfYnphbGxvYyQPX2RlZmF1bHRfYnpmcmVlJRVfQloyX2J6RGVjb21wcmVzc0luaXQmD19CWjJfaW5kZXhJbnRvRicRX0JaMl9iekRlY29tcHJlc3MoFF9CWjJfYnpEZWNvbXByZXNzRW5kKQ9fQloyX2RlY29tcHJlc3MqGV9CWjJfaGJDcmVhdGVEZWNvZGVUYWJsZXMrB19tYWxsb2MsBV9mcmVlLQ5fX19zdGRpb19jbG9zZS4OX19fc3RkaW9fd3JpdGUvDV9fX3N0ZGlvX3NlZWswDl9fX3N5c2NhbGxfcmV0MRFfX19lcnJub19sb2NhdGlvbjIKX2R1bW15XzU2OTMPX19fc3Rkb3V0X3dyaXRlNAdfc3RyY21wNQhfaXNkaWdpdDYJX3ZmcHJpbnRmNwxfcHJpbnRmX2NvcmU4C19fX2xvY2tmaWxlOQ1fX191bmxvY2tmaWxlOgRfb3V0OwdfZ2V0aW50PAhfcG9wX2FyZz0GX2ZtdF94PgZfZm10X28/Bl9mbXRfdUAJX3N0cmVycm9yQQdfbWVtY2hyQghfcGFkXzY4MEMHX3djdG9tYkQHX2ZtdF9mcEUSX19fRE9VQkxFX0JJVFNfNjgxRgdfZnJleHBsRwZfZnJleHBICF93Y3J0b21iSRNfX19wdGhyZWFkX3NlbGZfNDMwSg1fcHRocmVhZF9zZWxmSw1fX19zdHJlcnJvcl9sTApfX19sY3RyYW5zTQ9fX19sY3RyYW5zX2ltcGxODF9fX21vX2xvb2t1cE8GX3N3YXBjUApfX19md3JpdGV4UQpfX190b3dyaXRlUgdfZndyaXRlUwtfX19vdmVyZmxvd1QLX19fb2ZsX2xvY2tVDV9fX29mbF91bmxvY2tWB19mZmx1c2hXEl9fX2ZmbHVzaF91bmxvY2tlZFgIX2ZwcmludGZZBl9mcHV0Y1oLcnVuUG9zdFNldHNbD19sbHZtX2Jzd2FwX2kzMlwHX21lbWNweV0HX21lbXNldF4FX3NicmtfCmR5bkNhbGxfaWlgC2pzQ2FsbF9paV8wYQxkeW5DYWxsX2lpaWliDWpzQ2FsbF9paWlpXzBjC2R5bkNhbGxfdmlpZAxqc0NhbGxfdmlpXzBlDGR5bkNhbGxfdmlpaWYNanNDYWxsX3ZpaWlfMGcCYjBoAmIxaQJiMmoCYjM=';
  var asmjsCodeFile = '';

  if (!isDataURI(wasmTextFile)) {
    wasmTextFile = locateFile(wasmTextFile);
  }
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  if (!isDataURI(asmjsCodeFile)) {
    asmjsCodeFile = locateFile(asmjsCodeFile);
  }

  // utilities

  var wasmPageSize = 64*1024;

  var info = {
    'global': null,
    'env': null,
    'asm2wasm': asm2wasmImports,
    'parent': Module // Module inside wasm-js.cpp refers to wasm-js.cpp; this allows access to the outside program.
  };

  var exports = null;


  function mergeMemory(newBuffer) {
    // The wasm instance creates its memory. But static init code might have written to
    // buffer already, including the mem init file, and we must copy it over in a proper merge.
    // TODO: avoid this copy, by avoiding such static init writes
    // TODO: in shorter term, just copy up to the last static init write
    var oldBuffer = Module['buffer'];
    if (newBuffer.byteLength < oldBuffer.byteLength) {
      err('the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here');
    }
    var oldView = new Int8Array(oldBuffer);
    var newView = new Int8Array(newBuffer);


    newView.set(oldView);
    updateGlobalBuffer(newBuffer);
    updateGlobalBufferViews();
  }

  function fixImports(imports) {
    return imports;
  }

  function getBinary() {
    try {
      if (Module['wasmBinary']) {
        return new Uint8Array(Module['wasmBinary']);
      }
      var binary = tryParseAsDataURI(wasmBinaryFile);
      if (binary) {
        return binary;
      }
      if (Module['readBinary']) {
        return Module['readBinary'](wasmBinaryFile);
      } else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
      abort(err);
    }
  }

  function getBinaryPromise() {
    // if we don't have the binary yet, and have the Fetch api, use that
    // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
    if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
        return getBinary();
      });
    }
    // Otherwise, getBinary should be able to get it synchronously
    return new Promise(function(resolve, reject) {
      resolve(getBinary());
    });
  }

  // do-method functions


  function doNativeWasm(global, env, providedBuffer) {
    if (typeof WebAssembly !== 'object') {
      // when the method is just native-wasm, our error message can be very specific
      abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
      err('no native wasm support detected');
      return false;
    }
    // prepare memory import
    if (!(Module['wasmMemory'] instanceof WebAssembly.Memory)) {
      err('no native wasm Memory in use');
      return false;
    }
    env['memory'] = Module['wasmMemory'];
    // Load the wasm module and create an instance of using native support in the JS engine.
    info['global'] = {
      'NaN': NaN,
      'Infinity': Infinity
    };
    info['global.Math'] = Math;
    info['env'] = env;
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    function receiveInstance(instance, module) {
      exports = instance.exports;
      if (exports.memory) mergeMemory(exports.memory);
      Module['asm'] = exports;
      Module["usingWasm"] = true;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');

    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
      try {
        return Module['instantiateWasm'](info, receiveInstance);
      } catch(e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }

    // Async compilation can be confusing when an error on the page overwrites Module
    // (for example, if the order of elements is wrong, and the one defining Module is
    // later), so we save Module and check it later.
    var trueModule = Module;
    function receiveInstantiatedSource(output) {
      // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
      // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
      trueModule = null;
      receiveInstance(output['instance'], output['module']);
    }
    function instantiateArrayBuffer(receiver) {
      getBinaryPromise().then(function(binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver).catch(function(reason) {
        err('failed to asynchronously prepare wasm: ' + reason);
        abort(reason);
      });
    }
    // Prefer streaming instantiation if available.
    if (!Module['wasmBinary'] &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
        .then(receiveInstantiatedSource)
        .catch(function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err('wasm streaming compile failed: ' + reason);
          err('falling back to ArrayBuffer instantiation');
          instantiateArrayBuffer(receiveInstantiatedSource);
        });
    } else {
      instantiateArrayBuffer(receiveInstantiatedSource);
    }
    return {}; // no exports yet; we'll fill them in later
  }


  // We may have a preloaded value in Module.asm, save it
  Module['asmPreload'] = Module['asm'];

  // Memory growth integration code

  var asmjsReallocBuffer = Module['reallocBuffer'];

  var wasmReallocBuffer = function(size) {
    var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
    size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
    var old = Module['buffer'];
    var oldSize = old.byteLength;
    if (Module["usingWasm"]) {
      // native wasm support
      try {
        var result = Module['wasmMemory'].grow((size - oldSize) / wasmPageSize); // .grow() takes a delta compared to the previous size
        if (result !== (-1 | 0)) {
          // success in native wasm memory growth, get the buffer from the memory
          return Module['buffer'] = Module['wasmMemory'].buffer;
        } else {
          return null;
        }
      } catch(e) {
        console.error('Module.reallocBuffer: Attempted to grow from ' + oldSize  + ' bytes to ' + size + ' bytes, but got error: ' + e);
        return null;
      }
    }
  };

  Module['reallocBuffer'] = function(size) {
    if (finalMethod === 'asmjs') {
      return asmjsReallocBuffer(size);
    } else {
      return wasmReallocBuffer(size);
    }
  };

  // we may try more than one; this is the final one, that worked and we are using
  var finalMethod = '';

  // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
  // the wasm module at that time, and it receives imports and provides exports and so forth, the app
  // doesn't need to care that it is wasm or olyfilled wasm or asm.js.

  Module['asm'] = function(global, env, providedBuffer) {
    env = fixImports(env);

    // import table
    if (!env['table']) {
      var TABLE_SIZE = Module['wasmTableSize'];
      if (TABLE_SIZE === undefined) TABLE_SIZE = 1024; // works in binaryen interpreter at least
      var MAX_TABLE_SIZE = Module['wasmMaxTableSize'];
      if (typeof WebAssembly === 'object' && typeof WebAssembly.Table === 'function') {
        if (MAX_TABLE_SIZE !== undefined) {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, 'maximum': MAX_TABLE_SIZE, 'element': 'anyfunc' });
        } else {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, element: 'anyfunc' });
        }
      } else {
        env['table'] = new Array(TABLE_SIZE); // works in binaryen interpreter at least
      }
      Module['wasmTable'] = env['table'];
    }

    if (!env['memoryBase']) {
      env['memoryBase'] = Module['STATIC_BASE']; // tell the memory segments where to place themselves
    }
    if (!env['tableBase']) {
      env['tableBase'] = 0; // table starts at 0 by default, in dynamic linking this will change
    }

    // try the methods. each should return the exports if it succeeded

    var exports;
    exports = doNativeWasm(global, env, providedBuffer);

    assert(exports, 'no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: https://github.com/kripken/emscripten/wiki/WebAssembly#binaryen-methods');


    return exports;
  };

  var methodHandler = Module['asm']; // note our method handler, as we may modify Module['asm'] later
}

integrateWasmJS();

// === Body ===

var ASM_CONSTS = [];





STATIC_BASE = GLOBAL_BASE;

STATICTOP = STATIC_BASE + 10288;
/* global initializers */  __ATINIT__.push();







var STATIC_BUMP = 10288;
Module["STATIC_BASE"] = STATIC_BASE;
Module["STATIC_BUMP"] = STATIC_BUMP;

/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  function ___lock() {}

  
  var SYSCALLS={varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      var fflush = Module["_fflush"];
      if (fflush) fflush(0);
      var printChar = ___syscall146.printChar;
      if (!printChar) return;
      var buffers = ___syscall146.buffers;
      if (buffers[1].length) printChar(1, 10);
      if (buffers[2].length) printChar(2, 10);
    }function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in NO_FILESYSTEM
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      if (!___syscall146.buffers) {
        ___syscall146.buffers = [null, [], []]; // 1 => stdout, 2 => stderr
        ___syscall146.printChar = function(stream, curr) {
          var buffer = ___syscall146.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
      }
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          ___syscall146.printChar(stream, HEAPU8[ptr+j]);
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___unlock() {}

  function _abort() {
      Module['abort']();
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exit(status);
    }function _exit(status) {
      __exit(status);
    }

   

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

   

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else err('failed to set errno from JS');
      return value;
    } 
__ATEXIT__.push(flush_NO_FILESYSTEM);;
DYNAMICTOP_PTR = staticAlloc(4);

STACK_BASE = STACKTOP = alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

var ASSERTIONS = true;

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {String} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}



function nullFunc_ii(x) { err("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { err("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vii(x) { err("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_viii(x) { err("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  err("Build with ASSERTIONS=2 for more info.");abort(x) }

Module['wasmTableSize'] = 18;

Module['wasmMaxTableSize'] = 18;

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function jsCall_ii(index,a1) {
    return functionPointers[index](a1);
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function jsCall_iiii(index,a1,a2,a3) {
    return functionPointers[index](a1,a2,a3);
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function jsCall_vii(index,a1,a2) {
    functionPointers[index](a1,a2);
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function jsCall_viii(index,a1,a2,a3) {
    functionPointers[index](a1,a2,a3);
}

Module.asmGlobalArg = {};

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "abortStackOverflow": abortStackOverflow, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_vii": nullFunc_vii, "nullFunc_viii": nullFunc_viii, "invoke_ii": invoke_ii, "jsCall_ii": jsCall_ii, "invoke_iiii": invoke_iiii, "jsCall_iiii": jsCall_iiii, "invoke_vii": invoke_vii, "jsCall_vii": jsCall_vii, "invoke_viii": invoke_viii, "jsCall_viii": jsCall_viii, "___lock": ___lock, "___setErrNo": ___setErrNo, "___syscall140": ___syscall140, "___syscall146": ___syscall146, "___syscall54": ___syscall54, "___syscall6": ___syscall6, "___unlock": ___unlock, "__exit": __exit, "_abort": _abort, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_exit": _exit, "flush_NO_FILESYSTEM": flush_NO_FILESYSTEM, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX };
// EMSCRIPTEN_START_ASM
var asm =Module["asm"]// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real____errno_location.apply(null, arguments);
};

var real__decompress = asm["_decompress"]; asm["_decompress"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__decompress.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__fflush.apply(null, arguments);
};

var real__finish = asm["_finish"]; asm["_finish"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__finish.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__free.apply(null, arguments);
};

var real__llvm_bswap_i32 = asm["_llvm_bswap_i32"]; asm["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__llvm_bswap_i32.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__malloc.apply(null, arguments);
};

var real__registerCallback = asm["_registerCallback"]; asm["_registerCallback"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__registerCallback.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__sbrk.apply(null, arguments);
};

var real__start = asm["_start"]; asm["_start"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real__start.apply(null, arguments);
};

var real_establishStackSpace = asm["establishStackSpace"]; asm["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_establishStackSpace.apply(null, arguments);
};

var real_getTempRet0 = asm["getTempRet0"]; asm["getTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_getTempRet0.apply(null, arguments);
};

var real_setTempRet0 = asm["setTempRet0"]; asm["setTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setTempRet0.apply(null, arguments);
};

var real_setThrew = asm["setThrew"]; asm["setThrew"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_setThrew.apply(null, arguments);
};

var real_stackAlloc = asm["stackAlloc"]; asm["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackAlloc.apply(null, arguments);
};

var real_stackRestore = asm["stackRestore"]; asm["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackRestore.apply(null, arguments);
};

var real_stackSave = asm["stackSave"]; asm["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return real_stackSave.apply(null, arguments);
};
Module["asm"] = asm;
var ___errno_location = Module["___errno_location"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["___errno_location"].apply(null, arguments) };
var _decompress = Module["_decompress"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_decompress"].apply(null, arguments) };
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments) };
var _fflush = Module["_fflush"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_fflush"].apply(null, arguments) };
var _finish = Module["_finish"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_finish"].apply(null, arguments) };
var _free = Module["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_free"].apply(null, arguments) };
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
var _malloc = Module["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_malloc"].apply(null, arguments) };
var _memcpy = Module["_memcpy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memcpy"].apply(null, arguments) };
var _memset = Module["_memset"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_memset"].apply(null, arguments) };
var _registerCallback = Module["_registerCallback"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_registerCallback"].apply(null, arguments) };
var _sbrk = Module["_sbrk"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_sbrk"].apply(null, arguments) };
var _start = Module["_start"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["_start"].apply(null, arguments) };
var establishStackSpace = Module["establishStackSpace"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["establishStackSpace"].apply(null, arguments) };
var getTempRet0 = Module["getTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["getTempRet0"].apply(null, arguments) };
var runPostSets = Module["runPostSets"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["runPostSets"].apply(null, arguments) };
var setTempRet0 = Module["setTempRet0"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["setTempRet0"].apply(null, arguments) };
var setThrew = Module["setThrew"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["setThrew"].apply(null, arguments) };
var stackAlloc = Module["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackAlloc"].apply(null, arguments) };
var stackRestore = Module["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackRestore"].apply(null, arguments) };
var stackSave = Module["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackSave"].apply(null, arguments) };
var dynCall_ii = Module["dynCall_ii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_ii"].apply(null, arguments) };
var dynCall_iiii = Module["dynCall_iiii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
var dynCall_vii = Module["dynCall_vii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_vii"].apply(null, arguments) };
var dynCall_viii = Module["dynCall_viii"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["dynCall_viii"].apply(null, arguments) };
;



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;

if (!Module["intArrayFromString"]) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["intArrayToString"]) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["ccall"]) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["cwrap"]) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["setValue"]) Module["setValue"] = function() { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getValue"]) Module["getValue"] = function() { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocate"]) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getMemory"]) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["Pointer_stringify"]) Module["Pointer_stringify"] = function() { abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["AsciiToString"]) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToAscii"]) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ArrayToString"]) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF8ToString"]) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8Array"]) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF8"]) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF8"]) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF16ToString"]) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF16"]) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF16"]) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["UTF32ToString"]) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stringToUTF32"]) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["lengthBytesUTF32"]) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["allocateUTF8"]) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackTrace"]) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreRun"]) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnInit"]) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addOnPreMain"]) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["addOnExit"] = addOnExit;
if (!Module["addOnPostRun"]) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeStringToMemory"]) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeArrayToMemory"]) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["writeAsciiToMemory"]) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["addRunDependency"]) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["removeRunDependency"]) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["ENV"]) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS"]) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["FS_createFolder"]) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPath"]) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDataFile"]) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createPreloadedFile"]) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLazyFile"]) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createLink"]) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_createDevice"]) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["FS_unlink"]) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Module["GL"]) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["staticAlloc"]) Module["staticAlloc"] = function() { abort("'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynamicAlloc"]) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["warnOnce"]) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadDynamicLibrary"]) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["loadWebAssemblyModule"]) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getLEB"]) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFunctionTables"]) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["alignFunctionTables"]) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["registerFunctions"]) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["addFunction"] = addFunction;
if (!Module["removeFunction"]) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getFuncWrapper"]) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["prettyPrint"]) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["makeBigInt"]) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["dynCall"]) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["getCompilerSetting"]) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackSave"]) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackRestore"]) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["stackAlloc"]) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["establishStackSpace"]) Module["establishStackSpace"] = function() { abort("'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["print"]) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["printErr"]) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["intArrayFromBase64"]) Module["intArrayFromBase64"] = function() { abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Module["tryParseAsDataURI"]) Module["tryParseAsDataURI"] = function() { abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Module["ALLOC_NORMAL"]) Object.defineProperty(Module, "ALLOC_NORMAL", { get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_STACK"]) Object.defineProperty(Module, "ALLOC_STACK", { get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_STATIC"]) Object.defineProperty(Module, "ALLOC_STATIC", { get: function() { abort("'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_DYNAMIC"]) Object.defineProperty(Module, "ALLOC_DYNAMIC", { get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Module["ALLOC_NONE"]) Object.defineProperty(Module, "ALLOC_NONE", { get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });



// Modularize mode returns a function, which can be called to
// create instances. The instances provide a then() method,
// must like a Promise, that receives a callback. The callback
// is called when the module is ready to run, with the module
// as a parameter. (Like a Promise, it also returns the module
// so you can use the output of .then(..)).
Module['then'] = function(func) {
  // We may already be ready to run code at this time. if
  // so, just queue a call to the callback.
  if (Module['calledRun']) {
    func(Module);
  } else {
    // we are not ready to call then() yet. we must call it
    // at the same time we would call onRuntimeInitialized.
    var old = Module['onRuntimeInitialized'];
    Module['onRuntimeInitialized'] = function() {
      if (old) old();
      func(Module);
    };
  }
  return Module;
};

/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}





/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;


function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      err('exit(' + status + ') called, but noExitRuntime is set due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
    }
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';
  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}



run();

// {{POST_RUN_ADDITIONS}}





// {{MODULE_ADDITIONS}}



if (typeof window === "object" && (typeof ENVIRONMENT_IS_PTHREAD === 'undefined' || !ENVIRONMENT_IS_PTHREAD)) {
  function emrun_register_handlers() {
    // When C code exit()s, we may still have remaining stdout and stderr messages in flight. In that case, we can't close
    // the browser until all those XHRs have finished, so the following state variables track that all communication is done,
    // after which we can close.
    var emrun_num_post_messages_in_flight = 0;
    var emrun_should_close_itself = false;
    function postExit(msg) {
      var http = new XMLHttpRequest();
      http.onreadystatechange = function() {
        if (http.readyState == 4 /*DONE*/) {
          try {
            // Try closing the current browser window, since it exit()ed itself. This can shut down the browser process
            // and emrun does not need to kill the whole browser process.
            if (typeof window !== 'undefined' && window.close) window.close();
          } catch(e) {}
        }
      }
      http.open("POST", "stdio.html", true);
      http.send(msg);
    }
    function post(msg) {
      var http = new XMLHttpRequest();
      ++emrun_num_post_messages_in_flight;
      http.onreadystatechange = function() {
        if (http.readyState == 4 /*DONE*/) {
          if (--emrun_num_post_messages_in_flight == 0 && emrun_should_close_itself) postExit('^exit^'+EXITSTATUS);
        }
      }
      http.open("POST", "stdio.html", true);
      http.send(msg);
    }
    // If the address contains localhost, or we are running the page from port 6931, we can assume we're running the test runner and should post stdout logs.
    if (document.URL.search("localhost") != -1 || document.URL.search(":6931/") != -1) {
      var emrun_http_sequence_number = 1;
      var prevPrint = out;
      var prevErr = err;
      function emrun_exit() { if (emrun_num_post_messages_in_flight == 0) postExit('^exit^'+EXITSTATUS); else emrun_should_close_itself = true; };
      Module['addOnExit'](emrun_exit);
      out = function emrun_print(text) { post('^out^'+(emrun_http_sequence_number++)+'^'+encodeURIComponent(text)); prevPrint(text); }
      err = function emrun_printErr(text) { post('^err^'+(emrun_http_sequence_number++)+'^'+encodeURIComponent(text)); prevErr(text); }

      // Notify emrun web server that this browser has successfully launched the page.
      post('^pageload^');
    }
  }

  // POSTs the given binary data represented as a (typed) array data back to the emrun-based web server.
  // To use from C code, call e.g. EM_ASM({emrun_file_dump("file.dat", HEAPU8.subarray($0, $0 + $1));}, my_data_pointer, my_data_pointer_byte_length);
  function emrun_file_dump(filename, data) {
    var http = new XMLHttpRequest();
    out('Dumping out file "' + filename + '" with ' + data.length + ' bytes of data.');
    http.open("POST", "stdio.html?file=" + filename, true);
    http.send(data); // XXX  this does not work in workers, for some odd reason (issue #2681)
  }

  if (typeof Module !== 'undefined' && typeof document !== 'undefined') emrun_register_handlers();
}



  return Module;
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
    module.exports = Module;
  else if (typeof define === 'function' && define['amd'])
    define([], function() { return Module; });
  else if (typeof exports === 'object')
    exports["Module"] = Module;
  