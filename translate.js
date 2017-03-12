import _ from 'lodash';
import i18nDict from './i18n';

function splitBracket(origin) {
  const bracketResult = /^(.*?)( *)\(([^)]*)\)$/g.exec(origin);
  if (bracketResult) {
    const [o, body1, space, body2] = bracketResult;
    return [
      [body1, body2],
      ([tBody1, tBody2]) => `${tBody1}${space}(${tBody2})`,
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

function statItems(o) {
  const dict = {
    'cooldown': '冷却时间',
    'radius': '半径',
    'health': '生命值',
    'basic maximum health': '基础最大生命值',
    'maximum base health': '基础最大生命值',
    'healing': '治疗量',
    'heal': '治疗量',
    'heal amount': '治疗量',
    'bonus healing': '额外治疗量',
    'damage': '伤害',
    'health gain': '生命加成',
    'armor granted': '护甲加成',
    'slow amount': '减速量',
    'slow': '减速量',
    'armor': '护甲',
    'spell armor': '法术护甲',
    'physical armor': '物理护甲',
    'shield amount': '护盾量',
    'health regeneration': '生命恢复速度',
    'health regen': '生命恢复速度',
    'basic attack damage': '普攻伤害',
    'mana cost': '法力消耗',
    'cast range': '施放距离',
    'charges': '可储存次数',
    'cooldown reduction': '冷却时间减少量',
    'duration bonus per attack': '每次攻击增加的持续时间',
    'ghoul attack damage': '食尸鬼攻击速度',
    'ghoul health': '食尸鬼生命',
  };
  return _.get(dict, _.trim(o.replace('the ', '').toLowerCase()), _.trim(o));
}

function statUnits(o) {
  const dict = {
    'seconds': '秒',
    'seconds.': '秒',
  };
  return _.get(dict, _.trim(o.toLowerCase()), _.trim(o));
}

function translatePreset(origin) {
  const regexps = [
    [/^Level (\d*)$/i, '$1级'],
    [/^Moved to Level (\d*)$/i, '移到$1级'],
    [/^(.*) (reduced|lowered|decreased) from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/g,
      (r) => `${statItems(r[1])}从${r[3]}${statUnits(r[4])}降低到${r[5]}${statUnits(r[6])}`],
    [/^(Decrease|Lowere|Reduce)d? (.*) from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/g,
      (r) => `${statItems(r[2])}从${r[3]}${statUnits(r[4])}降低到${r[5]}${statUnits(r[6])}`],
    [/^(.*) (increased) from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/g,
      (r) => `${statItems(r[1])}从${r[3]}${statUnits(r[4])}增加到${r[5]}${statUnits(r[6])}`],
    [/^(Increase) (.*) from ([\d.]*) ?([^ ]*) to ([\d.]*)(.*)$/g,
      (r) => `${statItems(r[2])}从${r[3]}${statUnits(r[4])}增加到${r[5]}${statUnits(r[6])}`],
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
    'abilities': '技能',
    'stats': '数据',
    'talents': '天赋',
    'new functionality': '新机制',
    'developer comment': '开发者评论',
    'general': '概述',
    'art': '美工',
    'shop': '商店',
    'user interface': '界面',
    'design': '设计',
    'bug fixes': '修正',
    'new hero': '新英雄',
    'mounts': '坐骑',
    'new mounts': '新坐骑',
    'returning mounts': '坐骑重新上架',
    'removed mounts': '坐骑移除',
    'bundles': '新礼包',
    'new bundles': '新礼包',
    'returning bundles': '礼包重新上架',
    'removed bundles': '礼包移除',
    'skins': '新皮肤',
    'new skins': '新皮肤',
    'returning skins': '皮肤重新上架',
    'removed skins': '皮肤移除',
    'assassin': '刺杀型',
    'multi-class': '混合型',
    'specialist': '专业型',
    'warrior': '战斗型',
    'quest': '任务',
    '!quest': '任务',
    'reward': '奖励',
    '!reward': '奖励',
    'indicates a questing talent.': '表示任务天赋。',
    'italic text': '斜体字',
    'bold text': '粗体字',
    'indicates a': '表示',
    'new': '新',
    'moved': '移动了的',
    'talent.': '天赋',
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
  let validSplit;
  _.forEach([splitBracket, splitColon], splitMethod => {
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
