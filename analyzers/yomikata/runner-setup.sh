#!/bin/sh
cd runner
uv sync --frozen
PYTHONUTF8=1 ./.venv/Scripts/python.exe -m yomikata download
