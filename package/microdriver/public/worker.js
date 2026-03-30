import reflected from '/@microdriver/ffi/worker.js';

const MAIN = new URL(import.meta.url).searchParams.get('micropython');

let ondata, send;

const bootstrap = reflected({
  ws(...args) {
    [ondata, send] = args;
  },
});

const base = '/@microdriver/mpy';

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

// TODO: this is ugly but it works now!
globalThis.positron = [ondata, send];

interpreter.runPython(`
def __positron__(ondata, send):
    from reflected_ffi import local, remote
    from flatted_view import encode, decode
    import js
    from jsffi import to_js

    ondata(lambda data: decode(data))

    def test(*args):
        # print(args)
        details = encode(args)
        # TODO: which one is faster?
        # view = js.Uint8Array.new(details) # View
        view = to_js(details) # Array!
        # js.console.log(view)
        ok, err = decode(send(view))
        if err: raise Exception(err)
        return ok

    worker = local(lambda *args: args)
    server = remote(test)
    return [server, local, remote, encode, decode]

import js
js.positron = __positron__(js.positron[0], js.positron[1])
del js
del __positron__
`);

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
