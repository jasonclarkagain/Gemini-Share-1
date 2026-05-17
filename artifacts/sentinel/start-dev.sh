#!/bin/sh
export PORT=8081
export BASE_PATH=/
cd /home/runner/workspace/artifacts/sentinel
exec ./node_modules/.bin/vite --config vite.config.ts --host 0.0.0.0
