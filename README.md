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
The i18n dictionary is included in the repo. To update it with the latest client, follow the following steps on a macOS system.

#### Extract data
To build with live, where `<data dir>` is an arbitrary temporary directory for the output:
```
yarn run extract-data <data dir>
```

To build with PTR:
```
PTR=true yarn run extract-data <data dir>
```

You can also extract the mod before extracting, which saves time for multiple extracts:
```
dotnet heroes-data extract <client dir> -o <mod base>
MOD=<mod dir> yarn run extract-data <data dir>
```

#### Generate i18n files
```
yarn run build-i18n <data dir>
```

And `transform` will have the updated i18n file.

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
