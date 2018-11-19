import _ from 'lodash';
import * as parse5 from 'parse5';

import { Node } from './const';
import { generateBbsCode } from './generate';
import { translateTree } from './translate';
import { isElement, isParentNode, isTextNode } from './utils';

function getArticleTreeTraverse(tree: parse5.DefaultTreeNode) {
  if (tree.nodeName === 'article') {
    return tree;
  }
  if (tree.nodeName === 'blockquote') {
    return tree;
  }
  if (isElement(tree)) {
    const classAttr = tree.attrs.find((v: parse5.Attribute) => v.name === 'class');
    if (classAttr && classAttr.value.includes('notes-detail')) {
      return tree;
    }
    if (classAttr && classAttr.value.includes('news_area')) {
      return tree;
    }
    if (classAttr && classAttr.value.includes('article-container')) {
      return tree;
    }
    const idAttr = tree.attrs.find((v: parse5.Attribute) => v.name === 'id');
    if (idAttr && idAttr.value === 'mainNews') {
      return tree;
    }
  }
  if (!isParentNode(tree)) {
    return undefined;
  }
  let result;
  _.forEach(tree.childNodes, (node: parse5.DefaultTreeNode) => {
    if (node) {
      const found = getArticleTreeTraverse(node);
      if (found) {
        result = found;

        return false; // break
      }
    }
  });

  return result;
}

function getArticleTree(htmlText: string) {
  const htmlTree = <parse5.DefaultTreeDocument>parse5.parse(htmlText);
  const articleTree = getArticleTreeTraverse(htmlTree);
  if (!articleTree) {
    throw new Error('Can\'t find the article.');
  }

  return articleTree;
}

export function standardizeTree(node: parse5.DefaultTreeNode): Node {
  if (isTextNode(node)) {
    return {
      kind: 'text',
      text: node.value,
    };
  }

  return {
    kind: 'parent',
    tag: node.nodeName,
    children: isParentNode(node) ? node.childNodes.map(standardizeTree) : [],
    attrs: isElement(node) ? node.attrs : [],
  };
}

function transformNgaNode(tree: Node): string {
  return generateBbsCode(tree);
}

export function pageToNga({ htmlText, url }: { url?: string; htmlText: string }) {
  const tree = standardizeTree(getArticleTree(htmlText));
  const sourceStr = url ? `[quote]英文日志：${url}
[/quote]
` : '';

  return `[quote]转载请注明本帖来源NGA[s:a2:poi]
[/quote]
${sourceStr}${transformNgaNode(translateTree(tree))}`;
}
