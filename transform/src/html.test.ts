import * as parse5 from 'parse5';

import { standardizeTree } from './html';

describe('test standardizeTree()', () => {
  test('result must match', () => {
    const node = <parse5.DefaultTreeDocumentFragment>parse5.parseFragment(
      `<b style="1" disabled=1> <i /> 123 <em><u>hey</u></em></b>`,
    );
    expect(standardizeTree(node.childNodes[0])).toMatchSnapshot();
  });
});
