import _ from 'lodash';

import { findNearestColor } from './color';
import { Attribute, Node } from './const';

function parseStyle(node: Node): Record<string, string> {
  if (node.kind === 'text') {
    return {};
  }
  const styleAttr = node.attrs.find((v: Attribute) => v.name === 'style');
  if (!styleAttr) {
    return {};
  }
  const styles = styleAttr.value
    .split(';')
    .map(_.trim)
    .filter(Boolean)
    .map((s: string) => s.split(':'))
    .map(([a, b]: string[]) => [_.trim(a), _.trim(b)])
    .filter((v: string[]) => v.length === 2);

  return _.fromPairs(styles);
}

function findAttr(node: Node, field: string): Attribute | undefined {
  if (node.kind === 'text') {
    return undefined;
  }

  return node.attrs.find((attr: Attribute) => attr.name === field);
}

function getNumAttr(node: Node, attr: string) {
  if (node.kind === 'text') {
    return null;
  }
  const attrObj = node.attrs.find((v: Attribute) => v.name === attr);
  if (!attrObj) {
    return null;
  }

  return attrObj.value;
}

function trimNewlines(str: string): [string, number, number] {
  const trimmedLeft = _.trimStart(str, '\n');
  const left = str.length - trimmedLeft.length;
  const trimmedRight = _.trimEnd(trimmedLeft, '\n');
  const right = trimmedLeft.length - trimmedRight.length;

  return [trimmedRight, left, right];
}

function ensureNewlines(nodeText: string, startNum: number, endNum: number = 0) {
  const [trimmed, left, right] = trimNewlines(nodeText);

  return _.repeat('\n', Math.max(startNum, left)) + trimmed + _.repeat('\n', Math.max(endNum, right));
}

// tslint:disable-next-line:max-func-body-length cyclomatic-complexity
export function generateBbsCode(node: Node, context: Record<string, unknown> = {}) {
  if (node.kind === 'text') {
    return node.text;
  }
  // <picture>: pick only the first child
  if (node.tag === 'picture') {
    node.children = node.children.slice(0, 1);
  }
  // Node types to skip
  if (_.includes(['style', 'script', '#comment'], node.tag)) {
    return '';
  }
  const style = parseStyle(node);
  const childrenRaw = generateBbsNodeList(node.children);
  let children = childrenRaw;
  if (style.color) {
    const ngaColor = findNearestColor(style.color);
    if (ngaColor) {
      children = `[color=${ngaColor}]${children}[/color]`;
    }
  }
  switch (node.tag) {
  case 'br':
    return '\n';
  case 'hr':
    return '\n======\n';
  case 'figure':
    return `\n${children}\n`;
  case 'table':
    return `\n[${node.tag}]${children}\n[/${node.tag}]\n`;
  case 'tbody':
  case 'thead':
    return children;
  case 'tr':
    return `\n[${node.tag}]${children}\n[/${node.tag}]`;
  case 'th':
  case 'td': {
    const colspan = getNumAttr(node, 'colspan');
    const colspanStr = colspan ? ` colspan=${colspan}` : '';
    const rowspan = getNumAttr(node, 'rowspan');
    const rowspanStr = rowspan ? ` rowspan=${rowspan}` : '';
    // const boldChildren = node.tag === 'th' ? `[b]${children}[/b]` : children;

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

    return children ? `\n[size=${sizes[node.tag]}%][b]${children}[/b][/size]\n` : '';
  }

  case 'picture':
  case 'span':
  case 'a':
  case 'div':
  case 'font':
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
    const src = findAttr(node, 'src');
    if (src) {
      return `\n[img]${src.value}[/img]\n`;
    }

    return '';
  }

  default:
    console.warn(`Unhandled node type ${node.tag}`);

    return children;
  }
}

function generateBbsNodeList(nodes: Node[]) {
  let result = '';
  let prevNode: Node;
  let prevNewlines = 0;
  _.forEach(nodes, (node: Node) => {
    const nodeText = generateBbsCode(node, { $prev: prevNode });
    if (nodeText.length !== 0) {
      prevNode = node;
      const [trimmedNodeText, leftNewlines, rightNewlines] = trimNewlines(nodeText);
      // console.log('trimmed', prevNewlines, leftNewlines, rightNewlines);
      result += _.repeat('\n', Math.max(prevNewlines, leftNewlines));
      result += trimmedNodeText;
      prevNewlines = rightNewlines;
    } else if (prevNode && prevNode.kind !== 'text') {
      result += ' ';
    }
  });

  return (result + _.repeat('\n', prevNewlines))
    .replace(/ *\n/g, '\n');
}
