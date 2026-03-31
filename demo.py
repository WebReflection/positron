import builtins

def signature(*args, **kwargs):
    print('args', args)
    print('kwargs', kwargs)

# TEST
signature(1, 2, three=3)
signature(one=1, two=2, three=3)

# DEMO
builtins.signature = signature

from server import main
main()
