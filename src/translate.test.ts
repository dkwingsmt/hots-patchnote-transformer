import { translateChange, translatePhrase } from './translate';

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

  test('per-string fallback', () => {
    expect(
      translateChange('Spell power per random-things reduced from 1750 to 1662'),
    ).toBe('每random-things的法力强度从1750降低到1662');
  });

  test('unit', () => {
    expect(
      translateChange('Duration reduced from 2 to .5 second'),
    ).toBe('持续时间从2秒降低到0.5秒');
  });
});

describe('test translatePhrase', () => {
  describe('certain translations', () => {
    expect(
      translatePhrase('Heroes of the Storm Patch Notes – October 16, 2018'),
    ).toBe('《风暴英雄》更新说明 - 2018年10月16日');
  });
});
