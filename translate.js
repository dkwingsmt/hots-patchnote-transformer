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

function translateToken(origin) {
  const queryResult = i18nDict[origin.toLowerCase()];
  if (queryResult) {
    return queryResult[0][0];
  }
  return origin;
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
