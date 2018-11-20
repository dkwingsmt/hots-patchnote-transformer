import { translateChange } from './translate';

describe('test translateChange', () => {
  test('base', () => {
    expect(
      translateChange('Health reduced from 1750 to 1662'),
    ).toBe('生命值从1750降低到1662');
  });

  test('property prefixes and suffixes', () => {
    expect(
      translateChange('Base max health regen reduced from 1750 to 1662'),
    ).toBe('基础最大生命值回复速度从1750降低到1662');
  });
});
