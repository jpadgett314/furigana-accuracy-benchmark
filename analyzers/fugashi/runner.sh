#!/bin/sh
cd runner
uv run --frozen ./main.py ../../../challenge-sentences.json ../output.json
