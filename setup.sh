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
        TAG=$3
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
mv reflected public/js/
mv public/js/reflected/sw.js public/
