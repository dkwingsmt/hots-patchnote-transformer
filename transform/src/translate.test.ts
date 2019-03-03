import { translateChangeFromTo, translateChangeBy, translatePhrase } from './translate';

describe('test translateChangeFromTo', () => {
  test('base', () => {
    expect(
      translateChangeFromTo('Health reduced from 1750 to 1662'),
    ).toBe('生命值从1750降低到1662');
  });

  test('property prefixes and suffixes', () => {
    expect(
      translateChangeFromTo('Base max health regen reduced from 1750 to 1662'),
    ).toBe('基础最大生命值回复速度从1750降低到1662');
    expect(
      translateChangeFromTo('Blind duration bonus increased from .5 to .75 seconds'),
    ).toBe('致盲持续时间加成从0.5秒增加到0.75秒');
  });

  test('per-string', () => {
    expect(
      translateChangeFromTo('Damage bonus reduced from 5 to 4 per stack'),
    ).toBe('每层的伤害加成从5降低到4');
  });

  test('per-string fallback', () => {
    expect(
      translateChangeFromTo('Spell power per random-things reduced from 1750 to 1662'),
    ).toBe('每random-things的法力强度从1750降低到1662');
  });

  test('unit', () => {
    expect(
      translateChangeFromTo('Duration reduced from 2 to .5 second'),
    ).toBe('持续时间从2秒降低到0.5秒');
  });

  test('percentage', () => {
    expect(
      translateChangeFromTo('Damage increased from 1% to 1.25%'),
    ).toBe('伤害从1%增加到1.25%');
    expect(
      translateChangeFromTo('Healing increased from 10% to 15% maximum Health'),
    ).toBe('治疗量从最大生命值的10%增加到15%');
  });

  test('change up', () => {
    expect(
      translateChangeFromTo('Duration changed from 2 to 2.5 second'),
    ).toBe('持续时间从2秒增加到2.5秒');
  });

  test('change down', () => {
    expect(
      translateChangeFromTo('Duration changed from 2 to .5 second'),
    ).toBe('持续时间从2秒降低到0.5秒');
  });

  test('change down (percentage)', () => {
    expect(
      translateChangeFromTo('Effect changed from 2% to .5%'),
    ).toBe('effect从2%降低到0.5%');
  });
});

describe('test translateChangeBy', () => {
  test('percentage', () => {
    expect(
      translateChangeBy('Increase damage by 20%'),
    ).toBe('伤害增加20%');
  });

  test('percentage (2nd form)', () => {
    expect(
      translateChangeBy('Damage increased by 20%'),
    ).toBe('伤害增加20%');
  });

  test('require start of text', () => {
    expect(
      translateChangeBy('Hitting an enemy Hero increases Lunara\'s Movement Speed by 15% for 3 seconds'),
    ).toBe(null);
  });

  test('approx', () => {
    expect(
      translateChangeBy('Basic Attack speed reduced by ~12%'),
    ).toBe('普通攻击速度降低约12%');
  });
});

describe('test translatePhrase', () => {
  describe('certain translations', () => {
    expect(
      translatePhrase('Heroes of the Storm Patch Notes – October 16, 2018'),
    ).toBe('《风暴英雄》更新说明 - 2018年10月16日');
  });
});
