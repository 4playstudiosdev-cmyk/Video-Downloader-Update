#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python packages
pip install -r requirements.txt

# Create bin directory for local ffmpeg
mkdir -p bin

# Download standalone FFmpeg
echo "Downloading FFmpeg..."
curl -L https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz -o ffmpeg.tar.xz

# Extract it
echo "Extracting FFmpeg..."
tar -xf ffmpeg.tar.xz

# Move binaries to bin folder
mv ffmpeg-master-latest-linux64-gpl/bin/ffmpeg bin/ffmpeg
mv ffmpeg-master-latest-linux64-gpl/bin/ffprobe bin/ffprobe

# Make them executable
chmod +x bin/ffmpeg bin/ffprobe

# Clean up
rm -rf ffmpeg-master-latest-linux64-gpl ffmpeg.tar.xz