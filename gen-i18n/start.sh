#!/usr/bin/env bash

OUT="../src/external/i18n.ts"
if [ "$PTR" = true ] ; then
DIR="/Applications/Heroes of the Storm Public Test/"
else
DIR="/Applications/Heroes of the Storm/"
fi

echo Dir ${DIR}

if [ "$SKIP" = true ] ; then
  echo "Build skipped."
else
  dotnet-heroes-data -s "${DIR}" -l enUS --localized-text --json -o output/ | tee output/_info
  mv output/_info output/info
  dotnet-heroes-data -s "${DIR}" -l zhCN --localized-text --json -o output/ 
fi
VER=$(grep "Hots Version Build" output/info | sed -Ene "s/.* 2.[0-9]+.[0-9]+.([0-9+])/\1/p")
echo Merging version ${VER}
yarn build
yarn run combine --from output/gamestrings-${VER}/gamestrings_${VER}_enus.txt --to output/gamestrings-${VER}/gamestrings_${VER}_zhcn.txt --out ${OUT}
