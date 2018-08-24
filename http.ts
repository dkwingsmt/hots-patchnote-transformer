import { parse } from 'parse5';
import _ from 'lodash';
import rp from 'request-promise';

import { translateNgaNode } from './transform';

function getPage(url: string) {
  return rp(url).then(htmlText => ({ htmlText, url }));
}

function getArticleTreeTraverse(tree) {
  if (tree.nodeName === 'article') {
    return tree;
  }
  if (tree.attrs) {
    const classAttr = tree.attrs.find(v => v.name === 'class');
    if (classAttr && classAttr.value.includes('notes-detail')) {
      return tree;
    }
    if (classAttr && classAttr.value.includes('news_area')) {
      return tree;
    }
    if (classAttr && classAttr.value.includes('article-container')) {
      return tree;
    }
    const idAttr = tree.attrs.find(v => v.name === 'id');
    if (idAttr && idAttr.value === 'mainNews') {
      return tree;
    }
  }
  let result;
  _.forEach(tree.childNodes, (node) => {
    if (node) {
      const found = getArticleTreeTraverse(node);
      if (found) {
        result = found;
        return false;
      }
    }
  });
  return result;
}

function getArticleTree({ url, htmlText }) {
  const htmlTree = parse(htmlText);
  const articleTree = getArticleTreeTraverse(htmlTree);
  if (!articleTree) {
    throw new Error('Can\'t find the article.');
  }
  return { tree: articleTree, url };
}


function serializeToNga({ tree, url }) {
  return `[quote]转载请注明本帖来源NGA[s:a2:poi]
[/quote]
[quote]英文日志：${url}
[/quote]
${translateNgaNode(tree)}`;
}

getPage('https://heroesofthestorm.com/en-us/blog/22358469')
.then(getArticleTree)
.then(serializeToNga)
.then(console.log);
