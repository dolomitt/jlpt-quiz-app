#!/bin/bash
# Script to update version information for the JLPT Quiz App

# Get version from package.json
PACKAGE_VERSION=$(node -p "require('./package.json').version")

# Try to get git commit hash if git is available
if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
    GIT_HASH=$(git rev-parse --short HEAD)
else
    GIT_HASH="unknown"
fi

# Create version object
BUILD_DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Create JSON and save to file
cat > version.json << EOF
{
    "version": "$PACKAGE_VERSION",
    "gitCommit": "$GIT_HASH",
    "buildDate": "$BUILD_DATE"
}
EOF

echo "Version information updated:"
echo "Version: $PACKAGE_VERSION"
echo "Git Commit: $GIT_HASH"
echo "Build Date: $BUILD_DATE"
