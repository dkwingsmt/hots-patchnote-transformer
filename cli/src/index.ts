import Bluebird from 'bluebird';
import fs from 'fs';
import _ from 'lodash';
import { argv, exit } from 'process';
import rp from 'request-promise';

import { pageToBbsCode } from '@html2nga/hots-transform';

export interface IPageInfo {
  url?: string;
  htmlText: string;
}

async function getPageFromUrl(url: string): Promise<IPageInfo> {
  const htmlText = <string>(await rp(
    url,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
      },
    },
  ));

  return { htmlText, url };
}

// async function getPageFromFile(filePath: string) {
//   const file = await fsp.open(filePath, 'r')
//   const htmlText = await fsp.readFile(file, {encoding: 'utf8'})
//   return {htmlText}
// }

async function getPageFromFile(filePath: string): Promise<IPageInfo> {
  const task = new Bluebird<string>(
    (resolve: (c: string) => void, reject: (e: Error) => void) => {
      fs.readFile(
        filePath,
        'utf8',
        (err: NodeJS.ErrnoException, content: string) => {
          if (err) {
            reject(err);

            return;
          }
          resolve(content);
        },
      );
    },
  );

  return { htmlText: await task };
}

function sourceIsUrl(src: string) {
  // tslint:disable-next-line:no-http-string
  return src.startsWith('http://') || src.startsWith('https://');
}

function argSource() {
  const offset = _.last(_.split(argv[0], '/')) === 'node' ? 1 : 0;
  const src = argv[offset + 1];
  if (!src) {
    // const cmd = _.join(argv.slice(0, offset + 1), ' ');
    console.error(`USAGE: node cli.js SOURCE`);
    exit(1);
  }

  return src;
}

async function main() {
  const src = argSource();
  const task = sourceIsUrl(src) ?
    getPageFromUrl(src) : getPageFromFile(src);
  let content: IPageInfo;
  try {
    content = await task;
    // tslint:disable-next-line:no-console
    console.log(pageToBbsCode(content, { doTranslate: true }));
  } catch (e) {
    console.error(e.stack);
    exit(1);
  }
  exit(0);
}

main();
