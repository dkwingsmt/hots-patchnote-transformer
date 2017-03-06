import path from 'path';
import _ from 'lodash';
import { readFile, writeFile } from 'fs';
import Promise from 'bluebird';

const BASE_DIR = path.join(__dirname, '../mods/heroesdata.stormmod');

const FROM_DIR = path.join(BASE_DIR, 'enus.stormdata');
const TO_DIR = path.join(BASE_DIR, 'zhcn.stormdata');

function processText(text) {
  return text.split('\n').map((line) => {
    const [key, bodyComment] = line.split('=', 2);
    if (!bodyComment) {
      return null;
    }
    const [body] = bodyComment.split('///');
    return [key, body];
  }).filter(v => v);
}

Promise.join(
  Promise.promisify(readFile)(path.join(FROM_DIR, 'LocalizedData/GameStrings.txt')),
  Promise.promisify(readFile)(path.join(TO_DIR, 'LocalizedData/GameStrings.txt')),
  (fromBuffer, toBuffer) => {
    const fromArray = processText(fromBuffer.toString());
    const toDict = _.fromPairs(processText(toBuffer.toString()));
    const dict = {};
    _.forEach(fromArray, ([key, fromBody]) => {
      if ([
        // 'Description',
        // 'Tooltip',
        // 'Expression',
        // 'Param/Value/',
        'Skin/',
        'Reward/',
        // 'Abil/',
        // 'Hero/Title/',
        // 'Video/',
        // 'VoiceOver/',
        // 'Unit/',
        // 'UI/',
        // 'ScoreValue/',
        'LoadingScreen/',
        // 'Hero/Info/',
        'Mount/Info/',
        // 'Effect/Name/',
        // 'Hero/AdditionalSearchText/',
        // 'Hero/AlternateNameSearchText',
        // 'Error/',
        // 'Button/SimpleDisplayText/',
      ].some((forbidden) => key.startsWith(forbidden))) {
        return;
      }
      const toBody = toDict[key];
      if (fromBody && toBody) {
        if (fromBody === toBody) {
          return;
        }
        const postFromBody = JSON.stringify(_.trim(fromBody).toLowerCase());
        const postToBody = _.trim(toBody);
        const dictValue = dict[postFromBody] || [];
        const duplicateItem = dictValue.find(([body]) => body === postToBody);
        if (duplicateItem) {
          duplicateItem.push(key);
        } else {
          dictValue.push([postToBody, key]);
        }
        dict[postFromBody] = dictValue;
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
