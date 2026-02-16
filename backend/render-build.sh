#!/usr/bin/env bash
# exit on error
set -o errexit

STORAGE_DIR=/opt/render/project/.render

if [[ ! -d $STORAGE_DIR/ffmpeg ]]; then
  echo "...Downloading FFmpeg..."
  mkdir -p $STORAGE_DIR/ffmpeg
  wget -q https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -O $STORAGE_DIR/ffmpeg/ffmpeg.tar.xz
  tar -xJf $STORAGE_DIR/ffmpeg/ffmpeg.tar.xz -C $STORAGE_DIR/ffmpeg --strip-components 1
else
  echo "...FFmpeg found in cache..."
fi

# Make sure ffmpeg is in the PATH
export PATH=$STORAGE_DIR/ffmpeg:$PATH

# Install Python dependencies
pip install -r requirements.txt