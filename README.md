## 《风暴英雄》更新日志转换器
- 本工具获取指定位置的更新日志，并将其转换为NGA论坛的BBS Code形式。
- 还可以自动翻译一些简单格式的文字。

### Initialize
```
git clone
yarn run install
yarn run check-tools # You may need sudo here
```

### Rebuild i18n
Only available on macOS.

#### Extract data
Build with live:
```
yarn run extract-data <data dir>
```

Build with PTR:
```
PTR=true yarn run extract-data <data dir>
```

Extracting mod can save time for future extracts:
```
dotnet heroes-data extract <game install dir> -o <mod base>
MOD=<mod dir> yarn run extract-data <data dir>
```

#### Generate i18n files
```
yarn run build-i18n <data dir>
```

### Run
```
yarn run start-web
```

### Deploy
```
yarn run deploy-web
```

### Test
```
yarn test
```
