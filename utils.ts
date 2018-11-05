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
