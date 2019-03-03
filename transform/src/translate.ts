import _ from 'lodash';
import moment from 'moment';

import pluralize from 'pluralize';
import i18nDict from './external/i18n';
import { Node } from './const';
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

type SplitResult = [string[], (...v: string[]) => string] | null;

function splitBracket(origin: string): SplitResult {
  const bracketResult = /^(.*?)( *)\(([^)]*)\)( *)(.*?)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, space1, body2, space2, body3,
    ] = bracketResult;

    return [
      [body1, body2, body3],
      (tBody1: string, tBody2: string, tBody3: string) => `${tBody1}${space1}(${tBody2})${space2}${tBody3}`,
    ];
  }

  return null;
}

function splitSquareBracket(origin: string): SplitResult {
  const bracketResult = /^(.*?)( *)\[([^ )])\]( *)(.*?)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, space1, body2, space2, body3,
    ] = bracketResult;

    return [
      [body1, body2, body3],
      (tBody1: string, tBody2: string, tBody3: string) => `${tBody1}${space1}(${tBody2})${space2}${tBody3}`,
    ];
  }

  return null;
}

function splitColon(origin: string): SplitResult {
  const bracketResult = /^(.*?)( *: *)(.*)$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      body1, _mid, body2, // tslint:disable-line:no-unused
    ] = bracketResult;

    return [
      [body1, body2],
      (tBody1: string, tBody2: string) => `${tBody1}：${tBody2}`,
    ];
  }

  return null;
}

function splitDash(origin: string): SplitResult {
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
      (tBody1: string, tBody2: string) => `${tBody1}${space1 && ' '}-${space2 && ' '}${tBody2}`,
    ];
  }

  return null;
}

function splitXXXTalents(origin: string): SplitResult {
  const bracketResult = /^(.*?) TALENTS$/g.exec(origin);
  if (bracketResult) {
    const [
      _o, // tslint:disable-line:no-unused
      name,
    ] = bracketResult;

    return [
      [name],
      (tName: string) => `${tName}天赋`,
    ];
  }

  return null;
}

function strEq(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
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

    [/^heroes of the storm (ptr )?(balance )?(live )?(hotfix )?(patch )?notes$/gi, (r: RegExpMatchArray) =>
      `《风暴英雄》${ifExist(r[1], '公开测试服')}${ifExist(r[2], '平衡')}${ifExist(r[3], '正式服')}${ifExist(r[4], '在线修正')}更新说明`],
    [/^orange text indicates a (:?difference|change) between (the )?ptr and live (patch )? notes.$/gi, (r: RegExpMatchArray) =>
      '橙色文字表示公开测试服与正式服日志之间的区别'],

    [/^now (.*)$/i, (r: RegExpMatchArray) => `现在${translatePhrase(r[1])}`],
    [/^also (.*)$/i, (r: RegExpMatchArray) => `还会${translatePhrase(r[1])}`],
    [/^renamed to (.*)$/i, (r: RegExpMatchArray) => `重命名为${translatePhrase(r[1])}`],
    [/^(unranked|ranked|) battleground rotation$/i,
      (r: RegExpMatchArray) => `${strEq(r[1], 'unranked') ? '非排名模式' : strEq(r[1], 'ranked') ? '排名模式' : ''}战场轮换`],
    [/^the battleground rotation for all (unranked|ranked) modes has been adjusted to the following$/i,
      (r: RegExpMatchArray) => `所有${strEq(r[1], 'unranked') ? '非排名模式' : strEq(r[1], 'ranked') ? '排名模式' : ''}的战场轮换的地图池已调整为如下`],

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

    [/^for ([\d.]+) seconds?$/i, 
      (r: RegExpMatchArray) => `，持续${r[1]}秒`],
  ];

  // Find the first `preset` that whose `preset`[0] matches `origin`,
  // then use `preset`[1] to replace it
  const replacedStr = _.reduce<Preset, string | undefined>(
    regexps,
    (prev: string | undefined, [re, replaceTo]: Preset) => {
      if (prev != null) {
        return prev;
      }

      const matchResult = re.exec(origin);
      if (!matchResult) {
        return undefined;
      }

      if (typeof replaceTo === 'function') {
        return replaceTo(matchResult);
      }

      return origin.replace(re, replaceTo);
    },
    undefined,
  );

  if (replacedStr != null) {
    return replacedStr;
  }

  const presets: Record<string, string> = {
    'dragon shire': '巨龙镇',
    'tomb of the spider queen': '蛛后墓',
    'cursed hollow': '诅咒谷',
    'garden of terror': '恐魔园',
    'blackheart\'s bay': '黑心湾',
    'sky temple': '天空殿',
    'haunted mine': '鬼灵矿',
    'towers of doom': '末日塔',
    'infernal shrines': '炼狱圣坛',
    'battlefield of eternity': '永恒战场',
    'braxis holdout': '布拉克希斯禁区',
    'warhead junction': '弹头枢纽站',
    'hanamura temple': '花村寺',
    'volskaya foundry': '沃斯卡娅铸造厂',
    'alterac pass': '奥特兰克战道',

    heroes: '英雄',
    general: '综合',
    'quick navigation': '目录',
    'bug fixes': '错误修正',
    'new hero': '新英雄',
    return: '',

    miscellaneous: '综合',
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
    art: '美术',
    shop: '商店',
    'user interface': '界面',
    design: '设计',
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
    'new portraits, sprays, and emojis': '新头像、新喷漆和新表情',
    'returning skins': '重新上架的皮肤',
    'removed skins': '下架的皮肤',
    'new mount': '新坐骑',
    assassin: '刺杀型',
    'multi-class': '混合型',
    specialist: '专业型',
    support: '辅助型',
    warrior: '战斗型',
    warriors: '战斗型',
    minions: '小兵',
    mercenaries: '雇佣兵',
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
    'try mode': '试用模式',
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
    'heroes & talents': '英雄与天赋',
    'target info panel': '目标信息面板',
    'new bundles and skin packs': '新的礼包和皮肤包',
    'the following new bundles will soon become available for a limited time': '以下新的礼包很快将限时上线',
    'fixed a number of typo and tooltip errors across several aspects of the game': '修复了游戏中多处拼写错误和提示文字错误',
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
  const cutPercentage = cutPrefix(str, '%');
  const percentage = cutPercentage !== str;

  const matchPer = /^(.*?) ?(?:per (.*))?$/i.exec(_.trim(cutPercentage));
  const unit = matchPer ? _.trim(matchPer[1]) : '';
  const per = matchPer ? _.trim(matchPer[2]) : '';

  return {
    unit,
    percentage,
    per,
  };
}

function parsePerFromProperty(str: string): [string, string] {
  const matchPer = /(.*) per (.*)/i.exec(str);
  if (matchPer) {
    return [_.trim(matchPer[1]), _.trim(matchPer[2])];
  }

  return [_.trim(str), ''];
}

function standardizeNum(numStr: string): string {
  if (!numStr) {
    return '';
  }

  let result = numStr
    .replace(',', '');
  if (numStr.startsWith('.')) {
    result = `0${numStr}`;
  }

  return result;
}

function cutPrefix(origin: string, prefixes: string | string[]): string {
  const prefixesArr = typeof prefixes === 'string' ? [prefixes] : prefixes;
  for (const prefix of prefixesArr) {
    if (origin.startsWith(prefix)) {
      return origin.slice(prefix.length);
    }
  }

  return origin;
}

function cutSuffix(origin: string, suffixes: string | string[]): string {
  const suffixesArr = typeof suffixes === 'string' ? [suffixes] : suffixes;
  for (const suffix of suffixesArr) {
    if (origin.endsWith(suffix)) {
      return origin.slice(0, origin.length - suffix.length);
    }
  }

  return origin;
}

// tslint:disable-next-line:max-func-body-length
function translateProperty(origin: string): string {
  if (!origin) {
    return '';
  }

  let tryingCutting = origin.toLowerCase();
  const afterPrefixes: string[] = [];
  let prefixMinMax: string = '';
  const afterSuffixes: string[] = [];
  let suffixAmount: string = '';
  while (true) {
    let beforeCutting = tryingCutting;

    tryingCutting = cutPrefix(tryingCutting, ['max ', 'maximum ']);
    if (tryingCutting !== beforeCutting) {
      prefixMinMax = '最大';
      continue;
    }

    tryingCutting = cutPrefix(tryingCutting, ['min ', 'minimum ']);
    if (tryingCutting !== beforeCutting) {
      prefixMinMax = '最小';
      continue;
    }

    tryingCutting = cutPrefix(tryingCutting, 'base ');
    if (tryingCutting !== beforeCutting) {
      afterPrefixes.push('基础');
      continue;
    }

    tryingCutting = cutPrefix(tryingCutting, 'bonus ');
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('加成');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, [' bonus', ' gain', ' granted']);
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('加成');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' refund');
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('返还');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, [' regen', ' regeneration']);
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('回复速度');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' duration');
    if (tryingCutting !== beforeCutting) {
      beforeCutting = tryingCutting;

      tryingCutting = cutSuffix(tryingCutting, ' reduction');
      if (tryingCutting !== beforeCutting) {
        afterSuffixes.push('降低效果持续时间');
        continue;
      }

      afterSuffixes.push('持续时间');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' restoration');
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('回复');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' reduction');
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('降低量');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' increase');
    if (tryingCutting !== beforeCutting) {
      afterSuffixes.push('增加量');
      continue;
    }

    tryingCutting = cutSuffix(tryingCutting, ' amount');
    if (tryingCutting !== beforeCutting) {
      suffixAmount += '量';
      continue;
    }

    break;
  }

  const rootDict: Record<string, string> = {
    health: '生命值',
    mana: '法力',
    'mana cost': '法力消耗',
    'energy cost': '能量消耗',
    cooldown: '冷却时间',
    'cast time': '施法时间',
    radius: '半径',
    range: '范围',
    healing: '治疗量',
    heal: '治疗量',
    damage: '伤害',
    armor: '护甲',
    shield: '护盾',
    'spell armor': '法术护甲',
    'physical armor': '物理护甲',
    vision: '视野',
    'vision range': '视野范围',
    'sight radius': '视野范围',
    charges: '可储存次数',
    stacks: '层数',
    'movement speed': '移动速度',
    'spell power': '法力强度',

    'basic attack': '普通攻击',
    'attack speed': '普通攻击速度',
    'basic attack speed': '普通攻击速度',
    'attack damage': '普通攻击伤害',
    'basic attack damage': '普通攻击伤害',
    'basic attack range': '普通攻击范围',

    'movement speed slow': '减速效果',
    'increased movement speed': '加速效果',
    slow: '减速效果',
    root: '定身',
    silence: '沉默',
    stun: '昏迷',
    blind: '致盲',

    'cast range': '施放距离',
    'full charge up': '最大蓄力',
    'life leech': '生命吸取',
    'search arc': '搜寻弧度',

    duration: '持续时间',
    'spell damage': '法术伤害',
    'physical damage': '物理伤害',
    'damage over time': '持续伤害',
    'splash damage': '溅射伤害',
    'impact damage': '直接伤害',
    'window between casts': '每次施法之间的最大时间间隔',
    'damage threshold': '伤害阈值',
    'dash range': '冲刺距离',
    'charge count': '储存层数',
    'explosion radius': '爆炸范围',
    'teleport range': '传送距离',
  };

  const afterRoot = rootDict[tryingCutting] || tryingCutting;
  if (afterRoot.endsWith('量')) {
    suffixAmount = '';
  }

  return _.join(
    [_.join(afterPrefixes, ''), prefixMinMax,
      afterRoot,
      suffixAmount, _.join(_.reverse(afterSuffixes), '')],
    '',
  );
}

function translateUnit(origin: string): [string, string] {
  if (!origin) {
    return ['', ''];
  }

  const plural = pluralize(origin);
  const dict: Record<string, [string, string]> = {
    seconds: ['', '秒'],
    'maximum healths': ['最大生命值的', ''],
  };

  return dict[plural.toLowerCase()] || ['', origin];
}

function translatePer(origin: string): [string, string] {
  if (!origin) {
    return ['', ''];
  }

  const plural = pluralize(origin);
  const dict: Record<string, [string, string]> = {
    'basic attacks': ['每次普通攻击的', ''],
    stacks: ['每层的', ''],
    seconds: ['', '每秒'],
    ticks: ['', '每跳'],
  };

  return dict[plural.toLowerCase()] || [`每${origin || ''}的`, ''];
}

export function translateChangeFromTo(origin: string): string | null {
  const matches = /(.*? )(?:(reduce|lower|decrease|increase|change)(?:s|e?d|) )?from ([\d.,]+)(%?(?: [^.,]+?)?) to ([\d.,]+)(%?(?: [^.,]+)?)/ig
    .exec(origin);
  if (!matches) {
    return null;
  }
  const property = _.trim(matches[1] || '').toLowerCase();
  const specifiedTrend = (matches[2] || '').toLowerCase();
  const fromNumStr = matches[3];
  const fromUnit = matches[4] || '';
  const toNumStr = matches[5];
  const toUnit = matches[6] || '';

  const trendUp = (specifiedTrend && !['change'].includes(matches[2])) ?
    ['increase'].includes(specifiedTrend) :
    parseFloat(standardizeNum(toNumStr)) > parseFloat(standardizeNum(fromNumStr));
  const fromUnitParsed = parseUnit(fromUnit);
  const toUnitParsed = parseUnit(toUnit);
  const [bareProperty, perFromProperty] = parsePerFromProperty(property);

  const perStr = perFromProperty || fromUnitParsed.per || toUnitParsed.per;
  const percentage = fromUnitParsed.percentage || toUnitParsed.percentage;

  const afterProperty = translateProperty(bareProperty);
  const afterTrend = trendUp ? '增加' : '降低';
  const afterFromNum = standardizeNum(fromNumStr) + (percentage ? '%' : '');
  const afterToNum = standardizeNum(toNumStr) + (percentage ? '%' : '');
  const [afterUnitFront, afterUnitBack] = translateUnit(fromUnitParsed.unit || toUnitParsed.unit);
  const [afterPerAtStart, afterPerAtNum] = translatePer(perStr);

  // tslint:disable-next-line:max-line-length
  return `${afterPerAtStart}${afterProperty}从${afterUnitFront}${afterPerAtNum}${afterFromNum}${afterUnitBack}${afterTrend}到${afterToNum}${afterUnitBack}`;
}

export function translateChangeBy(origin: string): string | null {
  const matches = /^(reduce|lower|decrease|increase)(?:s|e?d|) (.*) by ([\d.,]+)(%?(?: [^.,]+?)?)$/i
    .exec(origin);
  if (!matches) {
    return null;
  }
  const specifiedTrend = (matches[1] || '').toLowerCase();
  const property = _.trim(matches[2] || '').toLowerCase();
  const byNumStr = matches[3];
  const byUnit = matches[4] || '';

  const trendUp = ['increase'].includes(specifiedTrend);
  const byUnitParsed = parseUnit(byUnit);
  const [bareProperty, perFromProperty] = parsePerFromProperty(property);

  const perStr = perFromProperty || byUnitParsed.per;
  const percentage = byUnitParsed.percentage;

  const afterProperty = translateProperty(bareProperty);
  const afterTrend = trendUp ? '增加' : '降低';
  const afterByNum = standardizeNum(byNumStr) + (percentage ? '%' : '');
  const [afterUnitFront, afterUnitBack] = translateUnit(byUnitParsed.unit);
  const [afterPerAtStart, afterPerAtNum] = translatePer(perStr);

  // tslint:disable-next-line:max-line-length
  return `${afterPerAtStart}${afterProperty}${afterTrend}${afterUnitFront}${afterPerAtNum}${afterByNum}${afterUnitBack}`;
}


function translateToken(origin: string) {
  const queryResult = i18nDict[toI18nKey(origin)];
  if (queryResult) {
    return queryResult[0][0];
  }

  const tryChangeFromTo = translateChangeFromTo(origin);
  if (tryChangeFromTo) {
    return tryChangeFromTo;
  }

  const tryChangeBy = translateChangeBy(origin);
  if (tryChangeBy) {
    return tryChangeBy;
  }

  return translatePreset(origin);
}

export function translatePhrase(origin: string): string {
  if (!origin) {
    return '';
  }
  if (
    // tslint:disable-next-line:no-http-string
    origin.startsWith('http://') ||
    origin.startsWith('https://')
  ) {
    return origin;
  }

  let validSplit: [string[], (...v: string[]) => string] | undefined;
  _.forEach(
    [splitBracket, splitSquareBracket, splitColon, splitXXXTalents, splitDash],
    (splitMethod: (s: string) => SplitResult) => {
      const splitResult = splitMethod(origin);
      if (splitResult) {
        validSplit = splitResult;

        return false;
      }
    },
  );
  if (validSplit) {
    const [originTokens, recoverFunc] = validSplit;

    return recoverFunc(...originTokens.map(translatePhrase));
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
    .replace(String.fromCharCode(160), ' ')
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
