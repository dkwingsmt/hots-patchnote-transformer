import * as parse5 from 'parse5';

import { generateBbsCode, GenerationChild, genTreeToString } from './generate';
import { standardizeTree } from './html';

describe('test genTreeToString', () => {
  test('Test when tag inner NL is longer than children outer NL', () => {
    const node: GenerationChild = {
      tag: 'a',
      newlines: { inStart: 2, inEnd: 2 },
      keepEmpty: true,
      children: [
        {
          tag: 'b',
          newlines: { outBefore: 1, outAfter: 1 },
          keepEmpty: true,
        },
        {
          tag: 'c',
          newlines: { outBefore: 2, outAfter: 1 },
          keepEmpty: true,
        },
      ],
    };
    expect(genTreeToString(node)).toEqual(
      [
        '[a]\n\n[b][/b]\n\n[c][/c]\n\n[/a]',
        0,
        0,
      ],
    );
  });

  test('Test when tag inner NL is shorter than children outer NL', () => {
    const node: GenerationChild = {
      tag: 'a',
      newlines: { inStart: 1, inEnd: 1 },
      keepEmpty: true,
      children: [
        {
          tag: 'b',
          newlines: { outBefore: 2, outAfter: 2 },
          keepEmpty: true,
        },
        {
          tag: 'c',
          newlines: { outBefore: 1, outAfter: 2 },
          keepEmpty: true,
        },
      ],
    };
    expect(genTreeToString(node)).toEqual(
      [
        '[a]\n\n[b][/b]\n\n[c][/c]\n\n[/a]',
        0,
        0,
      ],
    );
  });

  test('Purge empty children except when keepEmpty is true', () => {
    const node: GenerationChild = {
      tag: 'a',
      children: [
        {
          tag: 'b',
          children: [],
        },
        {
          tag: 'c',
          keepEmpty: true,
          children: ['   '],
        },
      ],
    };
    expect(genTreeToString(node)).toEqual(
      [
        '[a][c]   [/c][/a]',
        0,
        0,
      ],
    );
  });

  test('Render <br /> using outSum', () => {
    const node: GenerationChild = {
      tag: 'a',
      children: [
        {
          children: ['123'],
        },
        {
          keepEmpty: true,
          newlines: { outSum: 1 },
        },
        {
          children: ['456'],
        },
      ],
    };
    expect(genTreeToString(node)).toEqual(
      [
        '[a]123\n456[/a]',
        0,
        0,
      ],
    );
  });

});

describe('test generateBbsCode()', () => {
  test('correctly translate menu', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<ul>
	<li><span style="font-size: 14px;"><a href="#heroes">Heroes</a></span></li>
	<li><span style="font-size: 14px;"><a href="#bug-fixes">Bug Fixes</a></span></li>
</ul>
`,
    );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });

});
