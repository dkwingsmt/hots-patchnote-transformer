#!/usr/bin/env bash

if ! [ -x "$(command -v dotnet)" ]; then
  echo 'Error: dotnet is not installed. Install it at https://dotnet.microsoft.com/download .' >&2
  exit 1
fi

if [ $(dotnet tool list --global | grep -c heroesdataparser) -eq 0 ]; then
  echo 'HeroesDataParser has not been installed. Installing...'
  dotnet tool install --global heroesdataparser
else
  echo 'HeroesDataParser has been installed. Checking updates...'
  dotnet tool update --global heroesdataparser
fi
