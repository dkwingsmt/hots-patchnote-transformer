import * as parse5 from 'parse5';

export type Node = ITextNode | IParentNode;
export type Attribute = parse5.Attribute;

export interface ITextNode {
  kind: 'text';
  text: string;
}

export interface IParentNode {
  kind: 'parent';
  tag: string;
  children: Node[];
  attrs: Attribute[];
}
