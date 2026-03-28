import reflected from './js/reflected/ffi/worker.js';

let ondata, send;
const bootstrap = reflected({
  ws(...args) {
    [ondata, send] = args;
  },
});

const base = 'https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@latest';

const [
  { loadMicroPython },

  code,

  reflected_ffi_init,
  reflected_ffi_local,
  reflected_ffi_remote,
  reflected_ffi_types,

  flatted_view_init,
  flatted_view_constants,
  flatted_view_decode,
  flatted_view_encode,
] = await Promise.all([
  import(`${base}/micropython.mjs`),

  fetch('./main.py').then(r => r.text()),

  fetch('./mpy/reflected_ffi/__init__.py').then(r => r.arrayBuffer()),
  fetch('./mpy/reflected_ffi/local.py').then(r => r.arrayBuffer()),
  fetch('./mpy/reflected_ffi/remote.py').then(r => r.arrayBuffer()),
  fetch('./mpy/reflected_ffi/types.py').then(r => r.arrayBuffer()),

  fetch('./mpy/flatted_view/__init__.py').then(r => r.arrayBuffer()),
  fetch('./mpy/flatted_view/constants.py').then(r => r.arrayBuffer()),
  fetch('./mpy/flatted_view/decode.py').then(r => r.arrayBuffer()),
  fetch('./mpy/flatted_view/encode.py').then(r => r.arrayBuffer()),
]);

const interpreter = await loadMicroPython({ url: `${base}/micropython.wasm` });

const { ffi, proxy } = await bootstrap;
const window = ffi.global;
delete ffi.global;

const { FS } = interpreter;
const options = { canOwn: true };
const write = (name, buffer) => FS.writeFile(name, new Uint8Array(buffer), options);

FS.mkdir('/reflected_ffi');
write('/reflected_ffi/__init__.py', reflected_ffi_init);
write('/reflected_ffi/local.py', reflected_ffi_local);
write('/reflected_ffi/remote.py', reflected_ffi_remote);
write('/reflected_ffi/types.py', reflected_ffi_types);

FS.mkdir('/flatted_view');
write('/flatted_view/__init__.py', flatted_view_init);
write('/flatted_view/constants.py', flatted_view_constants);
write('/flatted_view/decode.py', flatted_view_decode);
write('/flatted_view/encode.py', flatted_view_encode);

globalThis.positron = view => {
  debugger;
  return send(view);
};

// TODO: check why the send fails
interpreter.runPython(`
from reflected_ffi import local, remote
from flatted_view import encode, decode
import js

send = js.positron
def test(*args):
  print(args)
  details = encode(args)
  view = js.Uint8Array.new(details)
  return send(view)

js.positron = [test, local, remote, encode, decode]
# del local
# del remote
# del encode
# del decode
# del js
`);

const [test, local, remote, encode, decode] = globalThis.positron;
delete globalThis.positron;

ondata(data => decode(data));

const server = remote(test);

interpreter.registerJsModule('reflected', {
  window,
  server,
  proxy,
  ffi,
  module: {
    main: name => window.import(name),
    worker: name => import(name),
    server: name => { /* TODO */ },
  },
});

interpreter.runPythonAsync(code);
