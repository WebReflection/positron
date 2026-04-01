#!/usr/bin/env bash

# # ⚠️ AN NPM PACKAGE WITH DEPENDENCIES CANNOT BE USED DIRECTLY IN HERE
# fetch_npm_package() {
#     NAME=$1
#     if [ -z "$2" ]; then
#         TAG="latest"
#     else
#         TAG=$2
#     fi
#     URL=$(curl https://registry.npmjs.org/${NAME} | jq ".versions[.\"dist-tags\".${TAG}].dist.tarball")
#     echo -e " 🌐 Fetching \x1b[32m${URL:1:-1}\x1b[0m \u2026"
#     curl -LO ${URL:1:-1}
# }

# # FROM NPM LATEST TAG (or pass a tag explicitly as 2nd argument)
# fetch_npm_package "reflected"

# FALLBACK TO MANUALLY EXPORTED FILES VIA GITHUB RAW URLS
fetch_github_tag_file() {
    REPO=$1
    FILE=$2
    if [ -z "$3" ]; then
        TAG=$(git ls-remote --refs --tags https://github.com/${REPO}.git | tail --lines=1 | cut --delimiter='/' --fields=3)
    else
        TAG=$3cp env/lib/*/site-packages/reflected_ffi/types.py public/py/reflected_ffi/types.py

    fi
    URL="https://github.com/${REPO}/raw/refs/tags/${TAG}/${FILE}"
    echo -e " 🌐 Fetching \x1b[32m${URL}\x1b[0m \u2026"
    curl -LO ${URL}
}

python -m venv env
source env/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# FROM GITHUB LATEST TAG (or pass a tag explicitly as 3rd argument)
fetch_github_tag_file "WebReflection/reflected" "reflected.tar.gz"

# # LATEST FROM CDN  (if published)
# curl -LO https://cdn.jsdelivr.net/npm/reflected@latest/reflected.tar.gz

tar -xzf reflected.tar.gz
rm reflected.tar.gz
mkdir -p public/js
rm -rf public/js/reflected
rm -rf public/ffi
mv reflected/sw.js public/
mv reflected/ffi public/
rm -rf public/js
rm -rf reflected

rm -rf public/mpy
mkdir -p public/mpy
rm -rf public/mpy/reflected_ffi
mkdir -p public/mpy/reflected_ffi
cp env/lib/*/site-packages/reflected_ffi/*.py public/mpy/reflected_ffi/
rm -f public/mpy/reflected_ffi/test_*.py

MICRO_PYTHON='https://cdn.jsdelivr.net/npm/@micropython/micropython-webassembly-pyscript@latest'
curl -LO ${MICRO_PYTHON}/micropython.mjs
curl -LO ${MICRO_PYTHON}/micropython.wasm

mv micropython.mjs public/mpy
mv micropython.wasm public/mpy

rm -rf public/mpy/flatted_view
mkdir -p public/mpy/flatted_view
cp env/lib/*/site-packages/flatted_view/*.py public/mpy/flatted_view/
rm -f public/mpy/flatted_view/test_*.py

rm -rf package/src/microdriver
mkdir -p package/src/microdriver
cp -R public package/src/microdriver/
cp -R sample package/src/microdriver/
cp server.py package/src/microdriver/
cp __init__.py package/src/microdriver/
