cp -r dist/* .

git add .
git commit -m "deploy dist to gh-pages"
git push origin gh-pages