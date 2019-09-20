import _ from 'lodash';
import * as parse5 from 'parse5';

export function isNode(node: {}): node is parse5.DefaultTreeNode {
  return !!(<parse5.DefaultTreeNode>node).nodeName;
}

export function isElement(node: parse5.DefaultTreeNode): node is parse5.DefaultTreeElement {
  return !!(<parse5.DefaultTreeElement>node).attrs;
}

export function isParentNode(node: {}): node is parse5.DefaultTreeParentNode {
  return !!(<parse5.DefaultTreeParentNode>node).childNodes;
}

export function isTextNode(node: parse5.DefaultTreeNode): node is parse5.DefaultTreeTextNode {
  return node.nodeName === '#text';
}

// export function toI18nKey(origin: string): string {
//   const lowered = origin.toLowerCase();

//   // Remove non-alnum
//   return lowered.replace(/[^a-z0-9 ]/g, '');
// }

export function toI18nKey(origin: string): string {
  return origin.toLowerCase().replace(/[’.'!?]/g, '');
}

export function nl(num: number) {
  return _.repeat('\n', num);
}

// Return `${a}${b}`, but the new lines between them are collapsed (the larger "newlines" is used).
export function collapsedConcat(head: string, ...strs: string[]) {
  return _.reduce<string, string>(
    strs,
    (prevResult: string, currStr: string) => {
      const trimmedA = _.trimEnd(prevResult, '\n');
      const trimmedB = _.trimStart(currStr, '\n');
      const numNL = Math.max(
        prevResult.length - trimmedA.length,
        currStr.length - trimmedB.length,
      );

      return `${trimmedA}${nl(numNL)}${trimmedB}`;
    },
    head,
  );
}
