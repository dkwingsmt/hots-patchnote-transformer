import parse5 from 'parse5';
import _ from 'lodash';
import rp from 'request-promise';

function getPage(url) {
  return rp(url);
}

function getArticleTreeTraverse(tree) {
  if (tree.nodeName === 'article') {
    return tree;
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

function getArticleTree(htmlText) {
  const htmlTree = parse5.parse(htmlText);
  const articleTree = getArticleTreeTraverse(htmlTree);
  if (!articleTree) {
    throw new Error('Can\'t find the article.');
  }
  return articleTree;
}

function translateNgaNode(node, context) {
  if (node.nodeName === '#text') {
    const replaced = node.value
    .replace('’', '\'')
    .replace('ú', 'u')
    .replace(String.fromCharCode(10), ' ')
    ;
    const result = _.trim(replaced);
    return result;
  }
  // Node types to skip
  if (['style', 'script', '#comment', 'font'].includes(node.nodeName)) {
    return '';
  }
  const children = translateNgaNodeList(node.childNodes);
  switch (node.nodeName) {
  case 'table':
    return `\n[${node.nodeName}]${children}\n[/${node.nodeName}]\n`;
  case 'tbody':
  case 'thead':
    return children;
  case 'tr':
    return `\n[${node.nodeName}]${children}\n[/${node.nodeName}]`;
  case 'th':
  case 'td':
    return `\n[td]${children}[/td]`;
  case 'h1':
  case 'h2':
  case 'h3':
  case 'h4':
  case 'h5': {
    const sizes = {
      h1: 150,
      h2: 140,
      h3: 130,
      h4: 120,
      h5: 110,
    };
    return children ? `\n[size=${sizes[node.nodeName]}%][b]${children}[/b][/size]\n` : '';
  }

  case 'span':
  case 'a':
  case 'div':
    return children;

  case 'p':
    return children ? `\n${children}` : '';
  case 'strong':
  case 'b':
    return children ? `[b]${children}[/b]` : '';
  case 'em':
  case 'i':
    return `[i]${children}[/i]`;
  case 'blockquote':
    return `\n[quote]\n${children}\n[/quote]`;
  case 'article':
    return children;
  case 'ul': {
    const prefix = context.$prev ? '' : '\n';
    return `\n${prefix}[list]${children}\n[/list]\n`;
  }
  case 'ol':
    const prefix = context.$prev ? '' : '\n';
    return `\n${prefix}[list=1]${children}\n[/list]\n`;
  case 'li': {
    const prefix = context.$prev ? '\n' : '';
    return `${prefix}[*]${children}`;
  }

  case 'img': {
    const src = node.attrs.find((attr) => attr.name === 'src');
    if (src) {
      return `\n[img]${src.value}[/img]\n`;
    }
  }

  default:
    console.warn(`Unhandled node type ${node.nodeName}`);
    return children;
  }
}

function trimNewlines(str) {
  const trimmedLeft = _.trimStart(str, '\n');
  const left = str.length - trimmedLeft.length;
  const trimmedRight = _.trimEnd(trimmedLeft, '\n');
  const right = trimmedLeft.length - trimmedRight.length;
  return [trimmedRight, left, right];
}

function translateNgaNodeList(nodes) {
  let result = '';
  let prevNode = null;
  let prevNewlines = 0;
  _.forEach(nodes, (node) => {
    const nodeText = translateNgaNode(node, { $prev: prevNode });
    if (nodeText.length !== 0) {
      prevNode = node;
      const [trimmedNodeText, leftNewlines, rightNewlines] = trimNewlines(nodeText);
      // console.log('trimmed', prevNewlines, leftNewlines, rightNewlines);
      result += _.repeat('\n', Math.max(prevNewlines, leftNewlines));
      result += trimmedNodeText;
      prevNewlines = rightNewlines;
    } else if (prevNode && prevNode.nodeName !== '#text') {
      result += ' ';
    }
  });
  return _.trim(result)
  .replace(/:$/g, ': ');
}

function serializeToNga(tree) {
  return translateNgaNode(tree);
}

getPage('http://us.battle.net/heroes/en/blog/20581815/heroes-of-the-storm-balance-update-february-27-2017-2-27-2017')
.then(getArticleTree)
.then(serializeToNga)
.then(console.log);
