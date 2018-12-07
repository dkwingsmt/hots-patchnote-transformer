import { collapsedConcat } from './utils';

describe('test collapsedConcat', () => {
  test('test', () => {
    expect(
      collapsedConcat('\n1\n', '2\n', '\n\n3\n'),
    ).toBe(
      '\n1\n2\n\n3\n',
    );
  });
});
