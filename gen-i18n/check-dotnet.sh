#!/usr/bin/env bash

if ! [ -x "$(command -v dotnet)" ]; then
  echo 'Error: dotnet is not installed. Install it at https://dotnet.microsoft.com/download .' >&2
  exit 1
fi
