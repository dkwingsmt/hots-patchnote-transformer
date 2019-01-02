# Gen-i18n

This module parses Heroes of the Storm client using [HeroesDataParser](https://github.com/koliva8245/HeroesDataParser) and generate `i18n.ts` that is used by the web module. 

## Install
- Currently only supports MacOS
- Install HeroesDataParser
  - You should have `dotnet-heroes-data` in your PATH.
- Run
```
yarn
yarn build
```

## Run
```
yarn start
```
To run with PTR build, run
```
PTR=true yarn start
``` 
