import { translateChange } from './translate';

describe('test translateChange', () => {
  test('base', () => {
    expect(
      translateChange('Health reduced from 1750 to 1662'),
    ).toBe('生命值从1750降低到1662');
  });
});
