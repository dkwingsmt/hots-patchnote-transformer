import _ from 'lodash';
import moment from 'moment';

import { Node } from './const';
import i18nDict from './i18n';
import { toI18nKey } from './utils';

function ifExist(flag: string, str: string | ((s: string) => string)): string {
  if (!flag) {
    return '';
  }
  if (typeof str === 'function') {
    return str(flag);
  }

  return str;
}

function splitBracket(origin: string) {
  const bracketResult = /^(.*?)( *)\(([^)]*)\)( *)(.*?)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, space1, body2, space2, body3,
    ] = bracketResult;

    return [
      [body1, body2, body3],
      ([tBody1, tBody2, tBody3]: [string, string, string]) => `${tBody1}${space1}(${tBody2})${space2}${tBody3}`,
    ];
  }

  return null;
}

function splitSquareBracket(origin: string) {
  const bracketResult = /^(.*?)( *)\[([^ )])\]( *)(.*?)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, space1, body2, space2, body3,
    ] = bracketResult;

    return [
      [body1, body2, body3],
      ([tBody1, tBody2, tBody3]: [string, string, string]) => `${tBody1}${space1}(${tBody2})${space2}${tBody3}`,
    ];
  }

  return null;
}

function splitColon(origin: string) {
  const bracketResult = /^(.*?)( *: *)(.*)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, mid, body2,
    ] = bracketResult;

    return [
      [body1, body2],
      ([tBody1, tBody2]: [string, string]) => `${tBody1}${mid}${tBody2}`,
    ];
  }

  return null;
}

function splitDash(origin: string) {
  const dashResult = /^(.*?)( *)[—–-]( *)(.*)$/g.exec(origin);

  if (dashResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, space1, space2, body2,
    ] = dashResult;
    if (!space1 && !space2) {
      return null;
    }

    return [
      [body1, body2],
      ([tBody1, tBody2]: [string, string]) => `${tBody1}${space1 && ' '}-${space2 && ' '}${tBody2}`,
    ];
  }

  return null;
}

function splitXXXTalents(origin: string) {
  const bracketResult = /^(.*?) TALENTS$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      name,
    ] = bracketResult;

    return [
      [name],
      ([tName]: [string]) => `${tName}天赋`,
    ];
  }

  return null;
}

function statItems(o: string) {
  const dict = {
    cooldown: '冷却时间',
    radius: '半径',
    health: '生命值',
    'base maximum health': '基础最大生命值',
    'maximum base health': '基础最大生命值',
    'base health': '基础生命值',
    'base health regeneration': '基础生命回复',
    'health bonus': '生命值加成',
    healing: '治疗量',
    heal: '治疗量',
    'heal amount': '治疗量',
    'bonus healing': '额外治疗量',
    damage: '伤害',
    'health gain': '生命加成',
    'armor granted': '护甲加成',
    'slow amount': '减速效果',
    slow: '减速效果',
    armor: '护甲',
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
    charges: '可储存次数',
    'cooldown reduction': '冷却时间减少量',
    'duration bonus per attack': '每次攻击增加的持续时间',
    'ghoul attack damage': '食尸鬼攻击速度',
    'ghoul health': '食尸鬼生命',
    'search arc': '搜寻弧度',
    'vision range': '视野范围',
    'stun duration': '昏迷持续时间',
    duration: '持续时间',
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
    'slow duration': '减速效果持续时间',
    miscellaneous: '综合',
    'damage reduction': '伤害减少量',
    'heal reduction': '治疗降低效果',
    'armor duration': '护甲持续时间',
    'bonus range': '范围加成',
    range: '范围',
    'life leech': '生命吸取比例',
    'bonus life leech': '生命吸取比例加成',
    'splash damage': '溅射伤害',
    'healing amount': '治疗量',
    'bonus swing damage': '伤害加成',
    'increased movement speed duration': '加速持续时间',
    'bonus shield amount': '护盾量加成',
    'cooldown reduction per basic attack': '每次普通攻击减少的冷却时间',
    'attack speed': '普通攻击速度',
    'attack damage': '普通攻击伤害',
    'bounce damage': '弹跳伤害',
    'root duration': '定身时间',
    'movement speed slow': '移动速度减速效果',
    'life steal amount': '生命吸取量',
  };

  return _.get(dict, _.trim(o.toLowerCase()).replace('the ', ''), _.trim(o));
}

function statUnits(o: string) {
  const dict = {
    second: '秒',
    seconds: '秒',
    games: '场游戏',
    stacks: '层',
    'seconds.': '秒',
    'per second': '每秒',
    'per stack': '每层',
    range: '',
    '% max health': '最大生命值',
    '% maximum health': '最大生命值',
    '% of maximum health': '最大生命值',
  };

  return _.get(dict, _.trim(o.toLowerCase()), _.trim(o));
}

function buffAction(o: string) {
  const dict = [
    [['increase'], '增加'],
    [['decrease', 'reduce', 'lower'], '降低'],
  ];
  const found = dict.find(([froms]: [string[], string]) => froms.includes(o.toLowerCase()));
  if (found) {
    return found[1];
  }

  return o;
}

// tslint:disable-next-line:max-func-body-length
function translatePreset(origin: string): string {
  type Preset = [
    RegExp,
    string | ((r: RegExpMatchArray) => string)
  ];
  const regexps: Preset[] = [
    [/^Level (\d*)$/i, '$1级'],
    [/^Moved from level (\d*) to level (\d*).?$/i, '从$1级移到$2级'],
    [/^Moved from level (\d*).?$/i, '移自$1级'],
    [/^Moved to level (\d*).?$/i, '移至$1级'],
    [/^heroes of the storm (ptr )?patch notes$/gi, (r: RegExpMatchArray) => `《风暴英雄》${ifExist(r[1], '公开测试服')}更新说明`],
    [/^now (.*)$/i, (r: RegExpMatchArray) => `现在${translatePhrase(r[1])}`],
    [/^also (.*)$/i, (r: RegExpMatchArray) => `还会${translatePhrase(r[1])}`],
    [/^renamed to (.*)$/i, (r: RegExpMatchArray) => `重命名为${translatePhrase(r[1])}`],

    [/^(grants? ?)([+.0-9]+) ?(physical|spell)? armor$/gi,
      (r: RegExpMatchArray) =>
        `${ifExist(r[1], '给予')}${r[2]}` +
        `${ifExist(r[3], (s: string) => <string>_.get({ physical: '物理', spell: '法术' }, s.toLowerCase(), ''))}护甲`],
    [/^(.*?)'s prices will be reduced to ([\d,]+) Gold and \$([\d,.]+) USD.$/ig,
      (r: RegExpMatchArray) => `${translatePhrase(r[1])}的价格降低为${r[2]}金币或${r[3]}美元.`],
    [/^(.+) ha(s|ve) received updated visual effects$/gi,
      (r: RegExpMatchArray) => `${translatePhrase(r[1])}的视觉效果得到了改进`],
    [/^(.+) ha(s|ve) received updated visual effects to coincide with ([a-z]+ )talent changes$/gi,
      (r: RegExpMatchArray) => `${translatePhrase(r[1])}的视觉效果得到了更新，以符合天赋的更新`],
    [/^Available until (.+)$/gi,
      (r: RegExpMatchArray) => `限时出售至${translatePhrase(r[1])}`],
    [/^(january|february|march|april|may|june|july|august|september|october|november|december) (\d+), (\d+)$/gi,
      (r: RegExpMatchArray) => moment(r[0], 'MMM D, YYYY').format('YYYY年M月D日')],
    [/^neutral (.*)$/i, '中立的$1'],
    [/^captured (.*)$/i, '驯服的$1'],
    [/^available starting the week of ([^ ]+ [0-9]+) until ([^ ]+ [0-9]+).?$/i,
      (r: RegExpMatchArray) => `将从${moment(r[1], 'MMM D').format('M月D日')}当周开始上线，${moment(r[2], 'MMM D').format('M月D日')}截止。`],
  ];
  const validre = regexps.find(([re]: Preset) => !!re.exec(origin));
  if (validre) {
    const replaceTo = validre[1];
    if (typeof replaceTo === 'string') {
      return origin.replace(validre[0], replaceTo);
    }
    const matched = validre[0].exec(origin);
    if (!matched) {
      return origin;
    }

    return replaceTo(matched);
  }

  const presets: Record<string, string> = {
    passive: '被动',
    active: '主动',
    removed: '已移除',
    'new talent': '新天赋',
    talent: '天赋',
    trait: '特质',
    'new trait': '新特质',
    abilities: '技能',
    stats: '数据',
    talents: '天赋',
    'developer comment': '开发者评论',
    'developer comments': '开发者评论',
    'ptr note': '测试服注释',
    general: '综合',
    art: '美术',
    shop: '商店',
    'user interface': '界面',
    design: '设计',
    'bug fixes': '错误修正',
    'new hero': '新英雄',
    mounts: '坐骑',
    mount: '坐骑',
    'new mounts': '新坐骑',
    'returning mounts': '重新上架的坐骑',
    'removed mounts': '下架的坐骑',
    bundles: '新礼包',
    'new bundles': '新礼包',
    'returning bundles': '重新上架的礼包',
    'removed bundles': '下架的礼包',
    skins: '新皮肤',
    'new skins': '新皮肤',
    'returning skins': '重新上架的皮肤',
    'removed skins': '下架的皮肤',
    assassin: '刺杀型',
    'multi-class': '混合型',
    specialist: '专业型',
    support: '辅助型',
    warrior: '战斗型',
    warriors: '战斗型',
    quest: '任务',
    '!quest': '任务',
    reward: '奖励',
    '!reward': '奖励',
    rewards: '奖励',
    'indicates a quest talent.': '代表该天赋为任务天赋.',
    'italic text': '斜体字',
    'bold text': '粗体字',
    underlined: '下划线',
    'indicates a': '代表',
    'text indicates a': '字代表',
    new: '新',
    moved: '移动的',
    'talent.': '天赋',
    level: '等级',
    tier: '天赋层级',
    'design & gameplay': '设计与游戏性',
    battlegrounds: '战场',
    'in-game user interface': '游戏界面',
    'draft mode': '征召模式',
    sounds: '声音',
    sound: '声音',
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
    'additional functionality': '新增效果',
    'adjusted functionality': '调整效果',
    redesigned: '重新设计',
    'new ability': '新技能',
    'new active': '新主动激活效果',
    'heroes of the storm': '风暴英雄',
    'world of warcraft': '魔兽世界',
    'price reduction': '价格变动',
    'heroes brawl': '风暴乱斗',
    emojis: '表情',
    minions: '小兵',
    'try mode': '试用模式',
    mercenaries: '雇佣兵',
    defender: '防御者',
    laner: '推进者',
    forts: '堡垒',
    keeps: '要塞',
    'dot effects': '持续伤害效果',
    'basic attacks': '普通攻击',
    'quick cast': '快速施法',
    emoji: '表情',
    'loot chests': '战利品',
    collection: '收藏',
    hotkeys: '快捷键',
    'new announcer': '新播报员',
    'new announcers': '新播报员',
    'map rotation update': '地图轮换更新',
    'ranked battleground rotation update': '排名战场轮换更新',
    'ranked battleground rotation': '排名战场轮换',
    'added to rotation': '新增至轮替列表',
    'removed from rotation': '自轮替列表移除',
    'the full ranked battleground rotation is now as follows': '完整的排名对战战场轮替列表如下',
    'the ranked map rotation has been updated to include the following': '排位赛地图轮换已更新',
    'heroes of the storm ptr notes': '《风暴英雄》公开测试服补丁说明',
    'heroes & talents': '英雄与天赋',
    'target info panel': '目标信息面板',
    'new bundles and skin packs': '新的礼包和皮肤包',
    'the following new bundles will soon become available for a limited time': '以下新的礼包很快将限时上线',
    'fixed a number of typo and tooltip errors across several aspects of the game': '修复了游戏中多处拼写错误和提示文字错误',
    'orange text indicates a difference between the ptr and live patch notes.': '橙色文字表示公开测试服与正式服日志之间的区别',
    note: '注',
  };

  let result = origin;
  _.map(presets, (_toS: string, fromS: string) => {
    if (_.trim(origin.toLowerCase()) === fromS) {
      result = presets[fromS];

      return false;
    }

    return null;
  });

  return result;
}

interface IParsedUnit {
  percentage: boolean;
  unit: string;
  per: string;
}

function parseUnit(str: string): IParsedUnit {
  const matchPer = /(% )?(.*?)(?: per (.*))?/i.exec(str);
  const percentage: boolean = !!(matchPer && _.trim(matchPer[1]));
  const unit = matchPer ? _.trim(matchPer[2]) : '';
  const per = matchPer ? _.trim(matchPer[3]) : '';

  return {
    unit,
    percentage,
    per,
  };
}

function parsePerFromProperty(str: string): [string, string] {
  const matchPer = /(.*) per (.*?)/ig.exec(str);
  if (matchPer) {
    return [_.trim(matchPer[1]), _.trim(matchPer[2])];
  }

  return [_.trim(str), ''];
}

function standardizeNum(numStr: string): string {
  if (!numStr) {
    return '';
  }

  if (numStr.startsWith('.')) {
    return `0${numStr}`;
  }

  return numStr;
}

function translateProperty(origin: string): string {
  if (!origin) {
    return '';
  }

  const dict: Record<string, string> = {
    health: '生命值',
  };

  return dict[origin] || origin || '';
}

function translateUnit(origin: string): string {
  if (!origin) {
    return '';
  }

  const dict: Record<string, string> = {
    seconds: '秒',
  };

  return dict[origin] || origin || '';
}

function translatePer(origin: string): string {
  if (!origin) {
    return '';
  }

  return origin || '';
}

export function translateChange(origin: string): string | null {
  const matches = /(.*? )?(?:(reduce|lower|decrease|increase)(?:s|e?d|) )?(.*? )?from ([\d.,]+)(%? [^.,]*?)? to ([\d.,]+)(%? [^.,]*)?/ig
    .exec(origin);
  if (!matches) {
    return null;
  }
  const property = _.trim((matches[1] || '') + (matches[3] || '')).toLowerCase();
  const specifiedTrend = matches[2].toLowerCase();
  const fromNumStr = matches[4];
  const fromUnit = matches[5] || '';
  const toNumStr = matches[6];
  const toUnit = matches[7] || '';

  const trendUp = specifiedTrend ?
    ['increase'].includes(specifiedTrend) :
    _.trim(toNumStr, '%') > _.trim(fromNumStr, '%');
  const fromUnitParsed = parseUnit(fromUnit);
  const toUnitParsed = parseUnit(toUnit);
  const [bareProperty, perFromProperty] = parsePerFromProperty(property);

  const perStr = perFromProperty || fromUnitParsed.per || toUnitParsed.per;
  const percentage = fromUnitParsed.percentage || toUnitParsed.percentage;

  const afterProperty = translateProperty(bareProperty);
  const afterTrend = trendUp ? '增加' : '降低';
  const afterFromNum = standardizeNum(fromNumStr) + (percentage ? '%' : '');
  const afterToNum = standardizeNum(toNumStr) + (percentage ? '%' : '');
  const afterUnit = translateUnit(fromUnitParsed.unit || toUnitParsed.unit);
  const afterPer = translatePer(perStr);

  return `${afterPer}${afterProperty}从${afterFromNum}${afterUnit}${afterTrend}到${afterToNum}${afterUnit}`;
}

function translateToken(origin: string) {
  const queryResult = i18nDict[toI18nKey(origin)];
  if (queryResult) {
    return queryResult[0][0];
  }

  return translatePreset(origin);
}

function translatePhrase(origin: string): string {
  if (!origin) {
    return '';
  }
  let validSplit: [string[], (v: string[]) => string] | undefined;
  _.forEach(
    [splitBracket, splitSquareBracket, splitColon, splitXXXTalents, splitDash],
    (splitMethod: (s: string) => [string[], (v: string[]) => string]) => {
      const splitResult = splitMethod(origin);
      if (splitResult) {
        validSplit = splitResult;

        return false;
      }
    },
  );
  if (validSplit) {
    const [originTokens, recoverFunc] = validSplit;

    return recoverFunc(originTokens.map(translatePhrase));
  }

  return translateToken(origin);
}

export function translateTree(node: Node): Node {
  if (node.kind === 'text') {

    const replaced = node.text
    .replace('’', '\'')
    .replace(' ', ' ')
    .replace('ú', 'u')
    .replace(String.fromCharCode(10), ' ')
    .replace(String.fromCharCode(8203), ' ');

    const result = _.trim(replaced);

    return {
      ...node,
      text: translatePhrase(result),
    };
  }

  return {
    ...node,
    children: node.children.map(translateTree),
  };
}
