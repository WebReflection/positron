import asyncio

from server.next_resolver import Promise

async def test(value):
    wr = Promise.with_resolvers()   
    wr.resolve(value)
    return wr.promise.then(print)

asyncio.run(test(123))
