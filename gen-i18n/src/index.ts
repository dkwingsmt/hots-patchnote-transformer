import { writeFile, readJSON, readdir } from 'fs-extra';
import { dirname } from 'path';
import _ from 'lodash';
import yargs from 'yargs';

import mapDict from './predefined/map.json';
import rolesDict from './predefined/roles.json';
import heroesEn, { Hero, Ability, Talent } from './external-data/herodata_enus';
import heroesZh from './external-data/herodata_zhcn';
import skinsEn from './external-data/heroskindata_enus';
import skinsZh from './external-data/heroskindata_zhcn';
import mountsEn from './external-data/mountdata_enus';
import mountsZh from './external-data/mountdata_zhcn';

interface IArg {
  to: string;
  out: string;
}

type Dict = Record<string, string>;

function sanitizeKey(k: string): string {
  return _.lowerCase(k).replace(/[’.'!?]/g, '');
}

function formatContent(dict: Dict): string {
  return _(dict)
    .toPairs()
    .map(([k, v]: [string, string]) => {
      return [sanitizeKey(k), v];
    })
    .sortBy()
    .map(([k, v]: [string, string]) => {
      return `  "${k}": "${v}"`;
    })
    .join(',\n');
}

function buildDictFromPredefined(): Dict {
  return _.merge({}, mapDict, rolesDict);
}

function omitEmpty<T>(a: Array<T | undefined>): Array<T> {
  return _.filter(a, (v: T | undefined) => v != null) as Array<T>;
}

function indexWith<T extends Record<string, any>, K extends keyof T>(
  a: Array<T>,
  k: K,
): Record<string, T> {
  return _.zipObject(_.map(a, k), a);
}

function compareObject<T extends Record<string, any>>(
  a: T,
  b: T,
  pathPrefix: string,
  op: (va: T[keyof T], vb: T[keyof T], k: string, path: string) => boolean | void,
) {
  _.forEach(a, (va, k) => {
    if (va == null)
      return;
    const vb: T[keyof T] = b[k];
    const path = `${pathPrefix}/${k}`;
    if (vb == null) {
      console.error(`Unable to find key ${path}`);
      return;
    }
    return op(va, vb, k, path);
  });
}

function mergeMany<V>(records: Record<string, V>[]): Record<string, V> {
  return _.merge({}, ...records);
}

function indexAbilities(
  abilities: (Ability | undefined)[] | undefined,
): Record<string, Ability> {
  if (abilities == null)
    return {};
  return indexWith(omitEmpty(abilities), 'nameId');
}

function collectAbilities(
  abilities: Record<string, Ability[] | undefined> | undefined,
): Record<string, Ability> {
  if (abilities == null)
    return {};
  return indexAbilities(_.flatten(_.values(abilities)));
}

function collectSubabilities(
  subabilities: Hero['subAbilities'],
): Record<string, Ability> {
  if (subabilities == null)
    return {};
  const abilListMapMapList = subabilities;
  const abilities = _.flatMap(
    abilListMapMapList,
    (abilListMapMap) => _.flatMap(
      abilListMapMap,
      (abilListMap) => _.flatMap(abilListMap),
    ),
  );
  return indexAbilities(abilities);
}

function collectHeroUnitAbilities(
  heroUnits: Hero['heroUnits'],
): Record<string, Ability> {
  if (heroUnits == null)
    return {};
  const units = _.flatten(_.map(heroUnits, (units) => _.values(units)));
  const abilities = _.map(units, (unit) => collectAbilities(unit.abilities));
  const subabilities = _.map(units, (unit) => collectSubabilities(unit.subAbilities));
  return mergeMany(abilities.concat(subabilities));
}

function collectTalents(
  talents: Record<string, Talent[]>,
): Record<string, Ability> {
  return indexWith(omitEmpty(_.flatten(_.values(talents))), 'nameId');
}

function buildDictFromHeroes(): Dict {
  const entries: [string, string][] = [];
  compareObject(heroesEn, heroesZh, '',
    (heroEn, heroZh, keyHero, pathHero) => {
      entries.push([heroEn.name, heroZh.name]);
      const abilitiesEn = _.merge(
        {},
        collectAbilities(heroEn.abilities),
        collectSubabilities(heroEn.subAbilities),
        collectHeroUnitAbilities(heroEn.heroUnits),
      );
      const abilitiesZh = _.merge(
        {},
        collectAbilities(heroZh.abilities),
        collectSubabilities(heroZh.subAbilities),
        collectHeroUnitAbilities(heroZh.heroUnits),
      );

      compareObject(abilitiesEn, abilitiesZh, pathHero,
        (abilityEn, abilityZh, keyAbility, pathAbility) => {
          entries.push([abilityEn.name, abilityZh.name]);
        },
      );

      compareObject(collectTalents(heroEn.talents), collectTalents(heroZh.talents), pathHero,
        (talentEn, talentZh, keyTalent, pathTalent) => {
          entries.push([talentEn.name, talentZh.name]);
        },
      );
      return true;
    },
  );
  const [keys, values] = _.unzip(entries);
  return _.zipObject(keys, values);
}

function buildDictFromSkins(): Dict {
  const entries: [string, string][] = [];
  compareObject(skinsEn, skinsZh, '',
    (skinEn, skinZh, keySkin, pathSkin) => {
      if (skinEn.name != null && skinZh.name != null) {
        entries.push([skinEn.name, skinZh.name]);
      }
    }
  )
  const [keys, values] = _.unzip(entries);
  return _.zipObject(keys, values);
}

function buildDictFromMounts(): Dict {
  const entries: [string, string][] = [];
  compareObject(mountsEn, mountsZh, '',
    (mountEn, mountZh, keySkin, pathSkin) => {
      if (mountEn.name != null && mountZh.name != null) {
        entries.push([mountEn.name, mountZh.name]);
      }
    }
  )
  const [keys, values] = _.unzip(entries);
  return _.zipObject(keys, values);
}

function buildDict(): Dict {
  return mergeMany([
    buildDictFromPredefined(),
    buildDictFromHeroes(),
    buildDictFromSkins(),
    buildDictFromMounts(),
  ]);
}

async function main({ to, out }: IArg) {
  const dict = await buildDict();

  const content = `// tslint:disable
const i18nDict: Record<string, string> = {
${formatContent(dict)}
};

export default i18nDict;
`;

  return writeFile(
    out,
    content,
  );
}

const argv = <IArg><unknown>(yargs
  .option('out', {
    alias: 'o',
    demandOption: true,
    describe: 'Path to the output i18n typescript file',
    type: 'string',
  }).argv);

main(argv)
  .catch((e: Error) => {
    console.error(e);
  });
