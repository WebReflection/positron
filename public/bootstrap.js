import reflected from '/@microdriver/ffi/main.js';

const main = document.querySelector('script[src="/@microdriver/bootstrap.js"]').getAttribute('micropython') || '/main.py';
const { href } = new URL(main, location.href);
const worker = new URL('/@microdriver/worker.js', location.href);
worker.searchParams.set('micropython', href);

reflected(worker.href, {
    ws: `${location.protocol.replace(/^http/, 'ws')}//${location.host}`,
    serviceWorker: '/sw.js'
});
