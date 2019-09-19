#!/usr/bin/env bash

OUT="../transform/src/external/i18n.ts"
if [ "$PTR" = true ] ; then
DIR="/Applications/Heroes of the Storm Public Test/"
else
DIR="/Applications/Heroes of the Storm/"
fi

echo Dir ${DIR}

if [ "$SKIP" = true ] ; then
  echo "Build skipped."
else
  dotnet heroes-data $DIR -o ./output -d 3 -e herodata -e heroskins -e mounts -l enUS -l zhCN
fi
VER=$(grep "Hots Version Build" output/info | sed -Ene "s/.* 2.[0-9]+.[0-9]+.([0-9+])/\1/p")
echo Merging version ${VER}
yarn build
yarn run combine --from output/gamestrings-${VER}/gamestrings_${VER}_enus.txt --to output/gamestrings-${VER}/gamestrings_${VER}_zhcn.txt --out ${OUT}
