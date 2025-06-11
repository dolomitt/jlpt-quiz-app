#!/bin/sh
echo "Checking dependencies..."
npm install
nodemon /app/server.js
