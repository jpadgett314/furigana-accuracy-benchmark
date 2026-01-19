#!/bin/sh

BASE_DIR="$1"

if [ -z "$BASE_DIR" ]; then
  echo "Usage: $0 <base-directory>"
  exit 1
fi

for dir in "$BASE_DIR"/*/; do
  [ -d "$dir" ] || continue

  folder_name=$(basename "$dir")
  runner="$dir/runner.sh"

  if [ -x "$runner" ]; then
    echo "Running in folder: $folder_name"
    (cd "$dir" && ./runner.sh)
  else
    echo "Skipping folder (no executable runner.sh): $folder_name"
  fi
done
