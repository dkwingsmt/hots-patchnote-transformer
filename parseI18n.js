import path from 'path';
import _ from 'lodash';
import { readFile, writeFile, readdirSync, statSync } from 'fs';
import Promise from 'bluebird';

const BASE_DIR = path.join(__dirname, '../casc/mods');
const GAME_STRINGS = 'LocalizedData/GameStrings.txt';

const FROM_DIR = path.join(BASE_DIR, 'enus.stormdata');
const TO_DIR = path.join(BASE_DIR, 'zhcn.stormdata');

function processText(buffer) {
  return buffer.toString().split('\n').map((line) => {
    const [key, bodyComment] = line.split('=', 2);
    if (!bodyComment) {
      return null;
    }
    const [body] = bodyComment.split('///');
    return [key, body];
  }).filter(v => v);
}

const getAllText = async (language) => {
  let dirs = [path.join(BASE_DIR, 'heroesdata.stormmod', `${language}.stormdata`, GAME_STRINGS)];
  const subBasedir = path.join(BASE_DIR, 'heromods');
  const subdirs = readdirSync(subBasedir).filter(subdir => subdir !== 'herointeractions.stormmod');
  dirs = dirs.concat(_.map(subdirs,
    (subdir) => path.join(subBasedir, subdir, `${language}.stormdata`, GAME_STRINGS)));
  const datas = Promise.map(dirs, (dir) => Promise.promisify(readFile)(dir))
  .then((buffers) => Array.concat(...buffers.map(buffer => processText(buffer))));
  return datas;
};

Promise.join(
  getAllText('enus'),
  getAllText('zhcn'),
  (fromArray, toArray) => {
    const toDict = _.fromPairs(toArray);
    const dict = {};
    _.forEach(fromArray, ([keyRaw, fromBody]) => {
      const key = keyRaw.replace(/[\u{FEFF}]/ug, '');
      if ([
        'Character/Description/',
        'Hero/Description/',
        'Button/Tooltip/',
        'Goal/',
        'VoiceLine/',
        'Behavior/',
        'Talent/',
        'Param/Expression/',
        'UserData/',
        'Button/Simple/',
        'Param/Value/',
        'Reward/',
        'Skin/Info',
        'Abil/',
        'Hero/Title/',
        'Video/',
        'VoiceOver/',
        'Unit/',
        'UI/',
        'ScoreValue/',
        'LoadingScreen/',
        'Hero/Info/',
        'Mount/Info/',
        'Effect/Name/',
        'Hero/AdditionalSearchText/',
        'Hero/AlternateNameSearchText',
        'Error/',
        'Button/SimpleDisplayText/',
        'Emoticon/',
        'Skin/AdditionalSearchText/',
        'Mount/AdditionalSearchText/',
        'EmoticonPack/Description/',
        'Banner/Description/',
        'CollectionCategory/',
      ].some((forbidden) => key.startsWith(forbidden)) && [
        'UI/MapLoadingScreen',
      ].every((allowedException) => !key.startsWith(allowedException))) {
        return;
      }
      const toBody = toDict[key];
      if (fromBody && toBody) {
        if (fromBody === toBody) {
          return;
        }
        const trimmedFromBody = _.trim(fromBody);
        if (!trimmedFromBody) {
          return;
        }
        if (['<lang rule', 'Heroes of the Storm'].includes(trimmedFromBody)) {
          return;
        }
        const postFromBody = JSON.stringify(trimmedFromBody.toLowerCase());
        const postToBody = _.trim(toBody);
        const dictValue = dict[postFromBody] || [];
        const duplicateItem = dictValue.find(([body]) => body === postToBody);
        if (duplicateItem) {
          duplicateItem.push(key);
        } else {
          dictValue.push([postToBody, key]);
        }
        dict[postFromBody] = dictValue;
        // if (dictValue.length !== 1) {
        //   console.log(postFromBody, dictValue);
        // }
      }
    });
    return dict;
  },
).then(
  (dict) => _.filter(_.toPairs(dict), 0),
).then((dictPair) =>
  _.join(
    ['export default {'].concat(
      _.sortBy(dictPair, 0)
      .map(([key, value]) =>
        `  ${key}: ${JSON.stringify(value)},`,
      ),
    ).concat(['}']),
    '\n',
  ),
).then((result) =>
  Promise.promisify(writeFile)('./i18n.js', result),
);
