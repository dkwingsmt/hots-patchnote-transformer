import _ from 'lodash';
import moment from 'moment';
import i18nDict from './i18n';

function ifExist(flag, str) {
  if (!flag) {
    return '';
  }
  if (typeof str === 'function') {
    return str(flag);
  }
  return str;
}

function splitBracket(origin) {
  const bracketResult = /^(.*?)( *)\(([^)]*)\)( *)(.*?)$/g.exec(origin);
  if (bracketResult) {
    const [o, body1, space1, body2, space2, body3] = bracketResult;
    return [
      [body1, body2, body3],
      ([tBody1, tBody2, tBody3]) => `${tBody1}${space1}(${tBody2})${space2}${tBody3}`,
    ];
  }
  return null;
}

function splitColon(origin) {
  const bracketResult = /^(.*?)( *: *)(.*)$/g.exec(origin);
  if (bracketResult) {
    const [o, body1, mid, body2] = bracketResult;
    return [
      [body1, body2],
      ([tBody1, tBody2]) => `${tBody1}${mid}${tBody2}`,
    ];
  }
  return null;
}

function splitDash(origin) {
  const bracketResult = /^(.*?)( +[—–-] +)(.*)$/g.exec(origin);

  if (bracketResult) {
    const [o, body1, mid, body2] = bracketResult;
    return [
      [body1, body2],
      ([tBody1, tBody2]) => `${tBody1}${mid}${tBody2}`,
    ];
  }
  return null;
}

function splitXXXTalents(origin) {
  const bracketResult = /^(.*?) TALENTS$/g.exec(origin);
  if (bracketResult) {
    const [o, name] = bracketResult;
    return [
      [name],
      ([tName]) => `${tName}天赋`,
    ];
  }
  return null;
}

function statItems(o) {
  const dict = {
    'cooldown': '冷却时间',
    'radius': '半径',
    'health': '生命值',
    'base maximum health': '基础最大生命值',
    'maximum base health': '基础最大生命值',
    'base health': '基础生命值',
    'base health regeneration': '基础生命回复',
    'health bonus': '生命值加成',
    'healing': '治疗量',
    'heal': '治疗量',
    'heal amount': '治疗量',
    'bonus healing': '额外治疗量',
    'damage': '伤害',
    'health gain': '生命加成',
    'armor granted': '护甲加成',
    'slow amount': '减速效果',
    'slow': '减速效果',
    'armor': '护甲',
    'spell armor': '法术护甲',
    'physical armor': '物理护甲',
    'shield amount': '护盾量',
    'health regeneration': '生命恢复速度',
    'health regen': '生命恢复速度',
    'basic attack damage': '普攻伤害',
    'mana cost': '法力消耗',
    'energy cost': '能量消耗',
    'teleport range': '传送距离',
    'explosion radius': '爆炸范围',
    'movement speed': '移动速度',
    'cast range': '施放距离',
    'charges': '可储存次数',
    'cooldown reduction': '冷却时间减少量',
    'duration bonus per attack': '每次攻击增加的持续时间',
    'ghoul attack damage': '食尸鬼攻击速度',
    'ghoul health': '食尸鬼生命',
    'search arc': '搜寻弧度',
    'vision range': '视野范围',
    'stun duration': '昏迷持续时间',
    'duration': '持续时间',
    'damage over time': '持续伤害',
    'impact damage': '直接伤害',
    'armor bonus': '护甲加成',
    'silence duration': '沉默持续时间',
    'maximum dash range': '最大冲刺距离',
    'full charge up duration': '最大蓄力时间',
    'maximum charge count': '最大储存层数',
    'damage per second': '每秒伤害',
    'basic attack range': '普通攻击范围',
    'basic attack slow': '普通攻击减速效果',
    'window between casts': '每次施法之间的最大时间间隔',
    'bonus health': '生命值加成',
    'sight radius bonus': '视野范围加成',
    'movement speed bonus': '移动速度加成',
    'base health regen': '基础生命回复',
    'healing bonus': '治疗量加成',
    'damage threshold': '伤害阈值',
    'bonus damage': '伤害加成',
    'damage bonus': '伤害加成',
    'vision bonus': '视野加成',
    'armor duration': '护甲持续时间',
    'range': '范围',
    'life leech': '生命吸取比例',
    'bonus life leech': '生命吸取比例加成',
    'splash damage': '溅射伤害',
    'healing amount': '治疗量',
    'bonus swing damage': '伤害加成',
    'increased movement speed duration': '加速持续时间',
    'bonus shield amount': '护盾量加成',
  };
  return _.get(dict, _.trim(o.toLowerCase()).replace('the ', ''), _.trim(o));
}

function statUnits(o) {
  const dict = {
    'second': '秒',
    'seconds': '秒',
    'games': '场游戏',
    'stacks': '层',
    'seconds.': '秒',
    'per second': '每秒',
    'per stack': '每层',
    'range': '',
    '% max health': '最大生命值',
    '% maximum health': '最大生命值',
    '% of maximum health': '最大生命值',
  };
  return _.get(dict, _.trim(o.toLowerCase()), _.trim(o));
}

function buffAction(o) {
  const dict = [
    [['increase'], '增加'],
    [['decrease', 'reduce', 'lower'], '降低'],
  ];
  const found = dict.find(([froms]) => froms.includes(o.toLowerCase()));
  if (found) {
    return found[1];
  }
  return o;
}

function translatePreset(origin) {
  const regexps = [
    [/^Level (\d*)$/i, '$1级'],
    [/^Moved to Level (\d*)$/i, '移到$1级'],
    [/^heroes of the storm (ptr )?patch notes$/gi, (r) => `《风暴英雄》${ifExist(r[1], '公开测试服')}更新说明`],
    [/^now (.*)$/i, (r) => `现在${translatePhrase(r[1])}`],
    [/^also (.*)$/i, (r) => `还会${translatePhrase(r[1])}`],
    [/^renamed to (.*)$/i, (r) => `重命名为${translatePhrase(r[1])}`],
    [/^(.*) (reduce|lower|decrease|increase)s?(?:e?d)? from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/ig,
      (r) => `${statItems(r[1])}从${r[3]}${statUnits(r[4])}${buffAction(r[2])}到${r[5]}${statUnits(r[6])}`],
    [/^(reduce|lower|decrease|increase)s?(?:e?d)? (.*) from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/ig,
      (r) => `${statItems(r[2])}从${r[3]}${statUnits(r[4])}${buffAction(r[1])}到${r[5]}${statUnits(r[6])}`],
    [/^(lower|decrease|increase)s?(?:e?d)? (?:the )?(.*?)(?: of (.+))? by (an additional )?([\d.]+)(.*)$/ig,
      (r) => `将${translatePhrase(r[3])}${ifExist(r[3], '的')}${statItems(r[2])}${ifExist(r[4], '额外')}${buffAction(r[1])}${r[5]}${statUnits(r[6])}`],
    [/^(?:the )?(.*?)(?: of (.+))? (lower|decrease|increase)s?(?:e?d)? by (an additional )?([\d.]+)(.*)$/ig,
      (r) => `${translatePhrase(r[2])}${ifExist(r[2], '的')}${statItems(r[1])}${ifExist(r[4], '额外')}${buffAction(r[3])}了${r[5]}${statUnits(r[6])}`],
    [/^(grants? ?)([+.0-9]+) ?(physical|spell)? armor$/gi,
      (r) => `${ifExist(r[1], '给予')}${r[2]}${ifExist(r[3], s => ({ physical: '物理', spell: '法术' })[s.toLowerCase()])}护甲`],
    [/^(.*)'s prices will be reduced to ([\d,]+) Gold and \$([\d,.]+) USD.$/ig,
      (r) => `${translatePhrase(r[1])}的价格降低为${r[2]}金币或${r[3]}美元.`],
    [/^(.+) has received updated visual effects$/gi,
      (r) => `${translatePhrase(r[1])}的视觉效果得到了改进`],
    [/^Available until (.+)$/gi,
      (r) => `限时出售至${translatePhrase(r[1])}`],
    [/^(january|february|march|april|may|june|july|august|september|october|november|december) (\d+), (\d+)$/gi,
      (r) => moment(r[0], 'MMM, D, YYYY').format('YYYY年M月D日')],
  ];
  let result = origin;
  const validre = regexps.find(([re]) => re.exec(origin));
  if (validre) {
    if (typeof validre[1] === 'string') {
      return origin.replace(validre[0], validre[1]);
    }
    validre[0].exec(origin);
    return validre[1](validre[0].exec(origin));
  }

  const presets = {
    'passive': '被动',
    'active': '主动',
    'removed': '已移除',
    'new talent': '新天赋',
    'talent': '天赋',
    'trait': '特质',
    'new trait': '新特质',
    'abilities': '技能',
    'stats': '数据',
    'talents': '天赋',
    'developer comment': '设计师观点',
    'developer comments': '设计师观点',
    'ptr note': '测试服注释',
    'general': '综合',
    'art': '美术',
    'shop': '商店',
    'user interface': '界面',
    'design': '设计',
    'bug fixes': '修正',
    'new hero': '新英雄',
    'mounts': '坐骑',
    'mount': '坐骑',
    'new mounts': '新坐骑',
    'returning mounts': '重新上架的坐骑',
    'removed mounts': '下架的坐骑',
    'bundles': '新礼包',
    'new bundles': '新礼包',
    'returning bundles': '重新上架的礼包',
    'removed bundles': '下架的礼包',
    'skins': '新皮肤',
    'new skins': '新皮肤',
    'returning skins': '重新上架的皮肤',
    'removed skins': '下架的皮肤',
    'assassin': '刺杀型',
    'multi-class': '混合型',
    'specialist': '专业型',
    'support': '辅助型',
    'warrior': '战斗型',
    'quest': '任务',
    '!quest': '任务',
    'reward': '奖励',
    '!reward': '奖励',
    'rewards': '奖励',
    'indicates a questing talent.': '代表该天赋为任务天赋.',
    'italic text': '斜体字',
    'bold text': '粗体字',
    'indicates a': '代表',
    'new': '新',
    'moved': '移动的',
    'talent.': '天赋',
    'level': '等级',
    'tier': '天赋层级',
    'design & gameplay': '设计与游戏性',
    'battlegrounds': '战场',
    'in-game user interface': '游戏界面',
    'sounds': '声音',
    'sound': '声音',
    'heroes, abilities, and talents': '英雄、技能和天赋',
    'basic abilities': '基本技能',
    'heroic abilities': '终极技能',
    'return to top': '',
    'heroes of the storm balance update': '《风暴英雄》平衡更新说明',
    'the following heroes, abilities, and talents have received updated visual effects':
      '以下英雄、技能和天赋获得了视觉效果更新',
    'the following heroes have received updated icon art to coincide with their reworks':
      '以下英雄的技能图标和视觉效果已经更新，与他的新设计保持一致',
    'has received updated icon art and visual effects that coincide with his rework.':
      '的技能图标和视觉效果已经更新，与他的新设计保持一致',
    'has been added to the in-game shop': '已被添加到游戏商城',
    'moved to': '移到了',
    'new functionality': '新效果',
    'removed functionality': '移除效果',
    'added functionality': '新增效果',
    'redesigned': '重新设计',
    'new ability': '新技能',
    'new active': '新主动激活效果',
    'heroes of the storm': '风暴英雄',
    'world of warcraft': '魔兽世界',
    'price reduction': '价格变动',
    'heroes brawl': '风暴乱斗',
  };
  _.map(presets, (to, from) => {
    if (_.trim(origin.toLowerCase()) === from) {
      result = presets[from];
      return false;
    }
    return null;
  });
  return result;
}

function translateToken(origin) {
  const queryResult = i18nDict[origin.toLowerCase()];
  if (queryResult) {
    return queryResult[0][0];
  }
  return translatePreset(origin);
}

function translatePhrase(origin) {
  if (!origin) {
    return '';
  }
  let validSplit;
  _.forEach([splitBracket, splitColon, splitXXXTalents, splitDash], splitMethod => {
    const splitResult = splitMethod(origin);
    if (splitResult) {
      validSplit = splitResult;
      return false;
    }
  });
  if (validSplit) {
    const [originTokens, recoverFunc] = validSplit;
    return recoverFunc(originTokens.map(translatePhrase));
  }
  return translateToken(origin);
}

export function translate(origin) {
  return translatePhrase(origin);
}
