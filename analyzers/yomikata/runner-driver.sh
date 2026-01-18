#!/bin/sh
cd runner
PYTHONUTF8=1 uv run --frozen ./main.py ../../../challenge-sentences.json ../output.json
