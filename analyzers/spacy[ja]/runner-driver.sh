#!/bin/sh
cd runner
uv run ./main.py ../../../challenge-sentences.json ../output.json
