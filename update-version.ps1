#!/usr/bin/env pwsh
# Script to update version information for the JLPT Quiz App

# Get version from package.json
$packageVersion = (Get-Content -Raw -Path "package.json" | ConvertFrom-Json).version

# Try to get git commit hash if git is available
try {
    $gitHash = git rev-parse --short HEAD
    if ($LASTEXITCODE -ne 0) {
        $gitHash = "unknown"
    }
} catch {
    $gitHash = "unknown"
}

# Create version object
$versionInfo = @{
    version = $packageVersion
    gitCommit = $gitHash
    buildDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

# Convert to JSON and save to file
$versionInfo | ConvertTo-Json | Set-Content -Path "version.json"

Write-Host "Version information updated:"
Write-Host "Version: $($versionInfo.version)"
Write-Host "Git Commit: $($versionInfo.gitCommit)"
Write-Host "Build Date: $($versionInfo.buildDate)"
