def bootstrap(ondata, send):
    from reflected_ffi import local, remote
    from flatted_view import encode, decode
    from jsffi import to_js

    ondata(lambda data: decode(data))

    def reflect(*args):
        view = to_js(encode(args))
        ok, err = decode(send(view))
        if err: raise Exception(err)
        return ok

    worker = local(lambda *args: args)
    server = remote(reflect)
    return [server, local, remote, encode, decode]

import js
js.positron = bootstrap(js.positron[0], js.positron[1])
