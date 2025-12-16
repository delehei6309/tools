# 判断下当前分支是否为 gh-pages 分支
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "gh-pages" ]; then
  echo "Error: This script must be run on the gh-pages branch."
  exit 1
fi

# 如果存在上次部署的文件列表，先清理
if [ -f ".deployed-files" ]; then
  echo "Cleaning old deployed files..."
  while IFS= read -r file; do
    if [ -e "$file" ]; then
      echo "Removing $file"
      rm -rf "$file"
    fi
  done < .deployed-files
  rm .deployed-files
fi

# 记录本次要复制的文件列表
echo "Recording new files..."
ls -A dist > .deployed-files

cp -r dist/* .

git add .
git commit -m "deploy dist to gh-pages"
git push origin gh-pages