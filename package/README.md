# microdriver

*WIP* — bootstraps MicroPython in a PyScript-compatible fashion from a worker, for localhost deployment and Briefcase / Positron / Toga.

```python
from microdriver import app
# app is a FastAPI application

import uvicorn

uvicorn.run(app(), host="localhost", port=8000)
```

`app` is defined in `microdriver.server` (see `microdriver/server.py`).

## Publishing to PyPI

From this directory (`package/`):

```bash
python -m pip install --upgrade build twine
python -m build
python -m twine check dist/*
python -m twine upload dist/*
```

Install build tools once: `pip install build twine`. Use [TestPyPI](https://test.pypi.org/) first if you prefer (`twine upload --repository testpypi dist/*`).


