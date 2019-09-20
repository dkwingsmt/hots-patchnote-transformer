#!/usr/bin/env bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <output dir>"
    echo "Environment variables:"
    echo "    PTR - If use PTR dir"
    echo "    MOD - Specify MOD dir (overwrites PTR)"
    exit 1
fi

OUT=$1
mkdir -p $OUT
LOG="$1/build-data.log"

if [ -z "$MOD" ]
then

if [ "$PTR" = true ] ; then
MOD="/Applications/Heroes of the Storm Public Test/"
else
MOD="/Applications/Heroes of the Storm/"
fi

fi

echo Mod directory: ${MOD}
echo Output directory: $1

dotnet heroes-data "$MOD" -o "$1" -d 3 \
  --json --warnings \
  -l enUS -l zhCN \
  -e herodata -e heroskins -e mounts \
  | tee $LOG

if [ $? -ne 0 ]; then
exit $?
fi
if [ $(grep -c 'Error' $LOG) -ne 0 ]; then
exit 1
fi

# Get build number
BUILD=$(cat $LOG | grep -E 'Hots Version Build|Hots build' | tr '.' ' ' | tr ' ' '\n' | grep -E '\d{5}')

if [ -z "$BUILD" ]; then
exit 1
fi

echo $BUILD > $OUT/BUILD
echo Successfully extracted build $BUILD to $OUT
