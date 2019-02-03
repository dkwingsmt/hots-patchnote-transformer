import _ from 'lodash';

import { findNearestColor } from './color';
import { Attribute, Node } from './const';
import { collapsedConcat, nl } from './utils';

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

/* INewlines defines at least how many new lines are required at each position.

     1        2                 3                 4         5
     v        v                 v                 v         v
      [parent] [child1][/child1] [child2][/child2] [/parent]

 Each position above is controlled by properties as below:
1: parent.outBefore
2: max(parent.inStart, child1.outBefore)
3: max(child1.outAfter, child2.outBefore)
4: max(child2.outAfter, parent.inEnd)
5: parent.outAfter

outSum regulates outAfter, making it at least (outSum - outBefore). It is only used by <br />.
*/
interface INewlines {
  inStart?: number;
  inEnd?: number;
  outBefore?: number;
  outAfter?: number;
  outSum?: number;
}

interface IGenerationNode {
  tag?: string;
  tagSuffix?: string;
  children?: (IGenerationNode | string)[];
  newlines?: INewlines;
  // By default empty nodes are removed, including #text that is empty after trimming,
  // or parent nodes that have 0 children. Removed nodes will have nothing output,
  // including its tags. `keepEmpty` will force keeping the tags of an empty parent node.
  keepEmpty?: boolean;
}

export type GenerationChild = IGenerationNode | string;

// Convert HTML tree to GenerationTree, which includes indication to stringify the node tree.
// In terms of implementation, this function does not remove empty nodes, but handles trimming.
// tslint:disable-next-line:max-func-body-length cyclomatic-complexity
export function bbsTreeToGenerationTree(node: Node): GenerationChild {
  if (node.kind === 'text') {
    return node.text.replace(/(^\s{2,})|(\s{2,}$)|(^\t|\t$)/,"")
  }

  // Node types to skip
  if (_.includes(['style', 'script', '#comment'], node.tag)) {
    return '';
  }

  const style = parseStyle(node);
  let children = node.children.map(bbsTreeToGenerationTree);
  // <picture>: pick only the first node child
  if (node.tag === 'picture') {
    const firstNode = _.find(children, (child: GenerationChild) => typeof child !== 'string');
    children = firstNode ? [firstNode] : [];
  }

  // Wrap children with styles
  if (style.color) {
    const ngaColor = findNearestColor(style.color);
    children = [{
      tag: 'color',
      tagSuffix: `=${ngaColor}`,
      children,
    }];
  }

  switch (node.tag) {
  case 'br':
    return {
      keepEmpty: true,
      newlines: {
        outSum: 1,
      },
    };
  case 'hr':
    return {
      children: ['======'],
      keepEmpty: true,
      newlines: {
        outBefore: 2,
        outAfter: 2,
      },
    };
  case 'figure':
    return {
      children,
      newlines: {
        outBefore: 1,
        outAfter: 1,
      },
    };
  case 'table':
    return {
      tag: node.tag,
      children,
      newlines: {
        outBefore: 1,
        outAfter: 1,
        inEnd: 1,
      },
    };
  case 'tbody':
  case 'thead':
    return {
      children,
    };
  case 'tr':
    return {
      tag: 'tr',
      children,
      newlines: {
        outBefore: 1,
        outAfter: 1,
        inEnd: 1,
      },
    };
  case 'th':
  case 'td': {
    const colspan = getNumAttr(node, 'colspan');
    const colspanStr = colspan ? ` colspan=${colspan}` : '';
    const rowspan = getNumAttr(node, 'rowspan');
    const rowspanStr = rowspan ? ` rowspan=${rowspan}` : '';
    // const boldChildren = node.tag === 'th' ? `[b]${children}[/b]` : children;

    return {
      tag: 'td',
      tagSuffix: `${rowspanStr}${colspanStr}`,
      children,
      keepEmpty: true,
      newlines: {
        outBefore: 1,
        outAfter: 1,
      },
    };
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

    return {
      tag: 'size',
      tagSuffix: `=${sizes[node.tag]}%`,
      children: [{
        tag: 'b',
        children,
      }],
      newlines: {
        outBefore: 1,
        outAfter: 1,
      },
    };
  }

  case 'p':
    return {
      children,
      newlines: {
        outSum: 1,
      },
    };
  case 'strong':
  case 'b':
    // https://github.com/dkwingsmt/hots-patchnote-transformer/issues/1
    if (children.length === 1 && children[0].toString() === 'Lt.') {
      return '';
    }
    if (children.length === 1 && children[0] === 'Morales：') {
      children[0] = '莫拉莉斯中尉：';
    }

    return {
      children,
      tag: 'b',
    };
  case 's':
    return {
      children,
      tag: 'del',
    };
  case 'u':
    return {
      children,
      tag: 'u',
    };
  case 'em':
  case 'i':
    return {
      children,
      tag: 'i',
    };
  case 'sup':
    return {
      children,
      tag: 'sup',
    };
  case 'sub':
    return {
      children,
      tag: 'sub',
    };
  case 'blockquote':
    return {
      children,
      tag: 'quote',
      newlines: {
        outBefore: 1,
        outAfter: 1,
        inEnd: 1,
      },
    };
  case 'ul': {
    return {
      children,
      tag: 'list',
      newlines: {
        outBefore: 1,
        inEnd: 1,
        outAfter: 1,
      },
    };
  }
  case 'ol': {
    return {
      children,
      tag: 'list',
      tagSuffix: '=1',
      newlines: {
        outBefore: 1,
        inEnd: 1,
        outAfter: 1,
      },
    };
  }
  case 'li': {
    return {
      children: [<GenerationChild>'[*]'].concat(children),
      newlines: {
        outAfter: 1,
      },
    };
  }

  case 'img': {
    const src = findAttr(node, 'src');
    if (src) {
      return {
        children: [src.value],
        tag: 'img',
        newlines: {
          outBefore: 1,
          outAfter: 1,
        },
      };
    }

    return '';
  }

  case 'article':
  case 'picture':
  case 'span':
  case 'div':
  case 'font':
    return {
      children,
    };

  case 'a':
    const href = findAttr(node, 'href');
    // #xxx is just anchor so no need for special handling
    if (href && href.value.indexOf('#') !== 0) {
      return {
        children,
        tag: 'url',
        tagSuffix: `=${href.value}`,
      };
    }

    return {
      children,
    };
  default:
    console.warn(`Unhandled node type ${node.tag}`);

    return {
      children,
    };
  }
}

// genTreeToString recursively convert a GenerationChild to BbsCode.
// Returns [prefix, body, suffix], where prefix and suffix contains in-newlines, out-newlines and tags.
// In terms of implementation, this function does not handle trimming, but removes empty nodes.
export function genTreeToString(node: GenerationChild): [string, string, string] {
  if (typeof node === 'string') {
    return ['', node, ''];  // Should I trim the string and put NLs into prefix and suffix?
  }
  const nodeNewlines = {
    inStart: 0,
    inEnd: 0,
    outBefore: 0,
    outAfter: 0,
    outSum: 0,
    ...node.newlines,
  };

  // const filteredChildren: GenerationChild[] = (node.children || []).filter((child: GenerationChild) => {
  //   if (typeof child === 'string') {
  //     return child;
  //   }

  //   if (child.keepEmpty) {
  //     return true;
  //   }

  //   return child.children && child.children.filter(Boolean).length;
  // });

  const [childrenStrReturned, childrenEndNL] = _.reduce<GenerationChild, [string, string]>(
    node.children,
    ([prevStr, prevNLAfter]: [string, string], curChild: GenerationChild) => {
      const [nextNLBefore, nextStr, nextNLAfter] = genTreeToString(curChild);
      if (!nextStr && (typeof curChild === 'string' || !curChild.keepEmpty)) {
        return [prevStr, prevNLAfter];
      }

      return [
        collapsedConcat(prevStr, prevNLAfter, nextNLBefore, nextStr),
        nextNLAfter,
      ];
    },
    ['', ''],
  );
  const nodeBodyStr = collapsedConcat(childrenStrReturned, childrenEndNL);

  const tagSuffix = node.tagSuffix || '';
  const startTag = node.tag ? `[${node.tag}${tagSuffix}]` : '';
  const endTag = node.tag ? `[/${node.tag}]` : '';
  const outBeforeNL = nodeNewlines.outBefore;
  const outAfterNL = Math.max(nodeNewlines.outSum - nodeNewlines.outBefore, nodeNewlines.outAfter);

  return [
    `${nl(outBeforeNL)}${startTag}${nl(nodeNewlines.inStart)}`,
    nodeBodyStr,
    `${nl(nodeNewlines.inEnd)}${endTag}${nl(outAfterNL)}`,
  ];
}

export function generateBbsCode(node: Node): string {
  const genTree = bbsTreeToGenerationTree(node);

  return _.trim(collapsedConcat(...genTreeToString(genTree)));
}
