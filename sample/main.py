# ⚠️ ignore the reflected name, this is a DEMO!
from reflected import window, server

# just for the sake of testing
Promise = window.Promise
document = window.document

body = document.body

body.append('Hello World')

body.onclick = lambda event: print('direct', event.type)

async def handler(event):
    print('handler', event.type)

body.addEventListener('click', handler)

print(await Promise.resolve(42))

# THERE WE GO!
server.builtins.print('hello world')

# # DEMO - REQUIRES demo.py
# server.builtins.signature(1, 2, three=3)

# # JUST SHOWING OFF 😇
# print(server.builtins.type({}))
# print(server.builtins.type([]))
# print(server.builtins.type(True))
