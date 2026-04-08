from reflected import window, server

Promise = window.Promise
document = window.document

body = document.body

platform = server.__import__('platform')

body.append(platform.platform())

body.onclick = lambda event: print('direct', event.type)

async def handler(event):
    print('handler', event.type)

body.addEventListener('click', handler)

print(await Promise.resolve(42))

# THERE WE GO!
server.builtins.print('hello world')
