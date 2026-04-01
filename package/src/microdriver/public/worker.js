import reflected from '/@microdriver/ffi/worker.js';

const MAIN = new URL(import.meta.url).searchParams.get('micropython');

let ondata, send;

const bootstrap = reflected({
  ws(...args) {
    [ondata, send] = args;
  },
});

const [
  { loadMicroPython },
  bootstrapMicroPython,

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
  import('/@microdriver/mpy/micropython.mjs'),

  fetch('/@microdriver/bootstrap.py').then(r => r.arrayBuffer()),

  fetch(new URL(import.meta.url).searchParams.get('micropython')).then(
    r => r.ok ? r.text() : (
        console.error(`Unable to run ${MAIN}: ${r.statusText}`),
        fetch('/@microdriver/main.py').then(r => r.text())
    )
  ),

  fetch('/@microdriver/mpy/reflected_ffi/__init__.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/reflected_ffi/local.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/reflected_ffi/remote.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/reflected_ffi/types.py').then(r => r.arrayBuffer()),

  fetch('/@microdriver/mpy/flatted_view/__init__.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/flatted_view/constants.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/flatted_view/decode.py').then(r => r.arrayBuffer()),
  fetch('/@microdriver/mpy/flatted_view/encode.py').then(r => r.arrayBuffer()),
]);

const interpreter = await loadMicroPython({ url: '/@microdriver/mpy/micropython.wasm' });

const { ffi, proxy } = await bootstrap;
const window = ffi.global;
delete ffi.global;

const { FS } = interpreter;
const options = { canOwn: true };
const write = (name, buffer) => FS.writeFile(name, new Uint8Array(buffer), options);

write('/bootstrap.py', bootstrapMicroPython);

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

// TODO: this is ugly but it works now!
globalThis.positron = [ondata, send];

interpreter.runPython('import bootstrap;del bootstrap');

const [server, local, remote, encode, decode] = globalThis.positron;
delete globalThis.positron;

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
