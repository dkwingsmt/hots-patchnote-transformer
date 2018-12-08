import * as parse5 from 'parse5';

import { generateBbsCode, GenerationChild, genTreeToString } from './generate';
import { standardizeTree } from './html';
import { collapsedConcat } from './utils';

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
    expect(collapsedConcat(...genTreeToString(node))).toEqual(
      '[a]\n\n[b][/b]\n\n[c][/c]\n\n[/a]',
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
    expect(collapsedConcat(...genTreeToString(node))).toEqual(
      '[a]\n\n[b][/b]\n\n[c][/c]\n\n[/a]',
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
    expect(collapsedConcat(...genTreeToString(node))).toEqual(
      '[a][c]   [/c][/a]',
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
    expect(collapsedConcat(...genTreeToString(node))).toEqual(
      '[a]123\n456[/a]',
    );
  });

});

describe('test generateBbsCode()', () => {
  test('correctly translate menu in desired format', () => {
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

  test('correctly translate menu in desired format (as a child)', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<div> <ul>
	<li><span style="font-size: 14px;"><a href="#heroes">Heroes</a></span></li>
	<li><span style="font-size: 14px;"><a href="#bug-fixes">Bug Fixes</a></span></li>
</ul> <div>
`,
    );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });

  test('correctly translate empty list to empty string', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<article><ul>
  </ul></article>`,
      );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });

  test('correctly translate header part', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<article><p><span style="font-size:14px;">Our next ... experiences.</span></p>

  <p><a name="return"></a></p>

  <hr class="image-divider">
  <h3>Quick Navigation:</h3>`,
      );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });

  test.skip('correctly translate links with spaces', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<span>Please stop by the <a href="https://us.forums.blizzard.com">PTR Bug Report forum</a> to let us know.</span>`,
      );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });

  test('correctly translate hero name for Lt. Morales', () => {
    const htmlNode = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<span style="font-size:14px;">
      <strong>Lt.</strong> <strong>Morales：</strong> 
      </span>`,
      );
    const node = standardizeTree(htmlNode.childNodes[0]);
    expect(generateBbsCode(node)).toMatchSnapshot();
  });
});
