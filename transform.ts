import _ from 'lodash';
import { AST } from 'parse5';

import { translate } from './translate';
import { findNearestColor } from './color';

function parseStyle(node): Record<string, string> {
  if (!node.attrs) {
    return {};
  }
  const styleAttr = node.attrs.find(v => v.name === 'style');
  if (!styleAttr) {
    return {};
  }
  const styles = styleAttr.value
    .split(';')
    .map(s => _.trim(s))
    .filter(Boolean)
    .map(s => s.split(':'))
    .map(([a, b]) => [_.trim(a), _.trim(b)])
    .filter(v => v.length === 2);
  return _.fromPairs(styles);
}

function getNumAttr(node, attr) {
  if (!node.attrs) {
    return null;
  }
  const attrObj = node.attrs.find(v => v.name === attr);
  if (!attrObj) {
    return null;
  }
  return attrObj.value;
}

function trimNewlines(str): [string, number, number] {
  const trimmedLeft = _.trimStart(str, '\n');
  const left = str.length - trimmedLeft.length;
  const trimmedRight = _.trimEnd(trimmedLeft, '\n');
  const right = trimmedLeft.length - trimmedRight.length;
  return [trimmedRight, left, right];
}

function ensureNewlines(nodeText, startNum, endNum: number=0) {
  const [trimmed, left, right] = trimNewlines(nodeText);
  return _.repeat('\n', Math.max(startNum, left)) + trimmed + _.repeat('\n', Math.max(endNum, right));
}

export function translateNgaNode(node, context: Record<string, any>={}) {
  if (node.nodeName === '#text') {
    const replaced = node.value
    .replace('’', '\'')
    .replace('​', ' ')
    .replace(String.fromCharCode(10), ' ')
    .replace(String.fromCharCode(8203), ' ')
    ;
    const result = _.trim(replaced);
    const translated = translate(result);
    return translated
    .replace('ú', 'u');
  }
  // <picture>: pick only the first child
  if (node.nodeNames === 'picture') {
    node.childNodes = node.childNodes.slice(0, 1);
  }
  // Node types to skip
  if (_.includes(['style', 'script', '#comment', 'font'], node.nodeName)) {
    return '';
  }
  const style = parseStyle(node);
  const childrenRaw = translateNgaNodeList(node.childNodes);
  let children = childrenRaw;
  if (style.color) {
    const ngaColor = findNearestColor(style.color);
    if (ngaColor) {
      children = `[color=${ngaColor}]${children}[/color]`;
    }
  }
  switch (node.nodeName) {
  case 'br':
    return '\n';
  case 'hr':
    return '\n======\n';
  case 'figure':
    return `\n${children}\n`;
  case 'table':
    return `\n[${node.nodeName}]${children}\n[/${node.nodeName}]\n`;
  case 'tbody':
  case 'thead':
    return children;
  case 'tr':
    return `\n[${node.nodeName}]${children}\n[/${node.nodeName}]`;
  case 'th':
  case 'td': {
    const colspan = getNumAttr(node, 'colspan');
    const colspanStr = colspan ? ` colspan=${colspan}` : '';
    const rowspan = getNumAttr(node, 'rowspan');
    const rowspanStr = rowspan ? ` rowspan=${rowspan}` : '';
    // const boldChildren = node.nodeName === 'th' ? `[b]${children}[/b]` : children;
    return `\n[td${rowspanStr}${colspanStr}]${children}[/td]`;
  }
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

  case 'picture':
  case 'span':
  case 'a':
  case 'div':
    return children;

  case 'p':
    return children ? ensureNewlines(children, 1) : '';
  case 'strong':
  case 'b':
    return children ? `[b]${children}[/b]` : '';
  case 's':
    return children ? `[del]${children}[/del]` : '';
  case 'u':
    return children ? `[u]${children}[/u]` : '';
  case 'em':
  case 'i':
    return `[i]${children}[/i]`;
  case 'sup':
    return `[sup]${children}[/sup]`;
  case 'sub':
    return `[sub]${children}[/sub]`;
  case 'blockquote':
    return `\n[quote]${ensureNewlines(children, 1, 1)}[/quote]`;
  case 'article':
    return children;
  case 'ul': {
    const prefix = context.$prev ? '' : '\n';
    return `\n${prefix}[list]${ensureNewlines(children, 0, 1)}[/list]\n`;
  }
  case 'ol': {
    const prefix = context.$prev ? '' : '\n';
    return `\n${prefix}[list=1]${ensureNewlines(children, 0, 1)}[/list]\n`;
  }
  case 'li': {
    const prefix = context.$prev ? '\n' : '';
    return `${prefix}[*]${children}`;
  }

  case 'img': {
    const src = node.attrs.find((attr) => attr.name === 'src');
    if (src) {
      return `\n[img]${src.value}[/img]\n`;
    }
    return '';
  }

  default:
    console.warn(`Unhandled node type ${node.nodeName}`);
    return children;
  }
}

function translateNgaNodeList(nodes) {
  let result = '';
  let prevNode: AST.Default.Node;
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
  return (result + _.repeat('\n', prevNewlines))
  .replace(/ *\n/g, '\n');
}