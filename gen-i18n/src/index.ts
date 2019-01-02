import { DH_NOT_SUITABLE_GENERATOR } from 'constants';
import fs, { writeJson } from 'fs-extra';
import _ from 'lodash';
import yargs from 'yargs';

interface IArg {
  from: string;
  to: string;
  out: string;
}

type DictValue = [string, string[]][];
type Dict= Record<string, DictValue>;

function insertEntry(prevDict: Dict, key: string, from: string, to: string): Dict {
  const prevDictValue = prevDict[key] || [];
  const foundIdx = _.findIndex(
    prevDictValue,
    (entry: [string, string[]]) => {
      return entry[0] === to;
    },
  );
  let nextDictValue: DictValue;
  if (foundIdx === -1) {
    nextDictValue = [
      ...prevDictValue,
      [to, [key]],
    ];
  } else {
    nextDictValue = [...prevDictValue];
    nextDictValue.splice(
      foundIdx,
      1,
      [
        to,
        [...nextDictValue[foundIdx][1], key],
      ],
    );
  }

  return {
    ...prevDict,
    [from]: nextDictValue,
  };
}

function parseGamestring(txt: string): Record<string, string> {
  return _.fromPairs(
    txt.split('\n')
      .map(_.trim)
      .filter(Boolean)
      .map((line: string): [string, string] => {
        const [k, v] = line.split('=', 2);

        return [_.trim(k), _.trim(_.toLower(v))];
      })
      .filter(([k, v]: [string, string]) => {
        return k && v;
      }),
  );
}

function validKey(key: string): boolean {
  return !_.some(
    [
      'tooltip/',
      'unit/role',
      'unit/type',
      'unit/difficulty',
      'award/',
      'unit/description',
    ],
    (prefix: string) => {
      return key.startsWith(prefix);
    },
  );
}

function formatContent(dict: Dict): string {
  return _(dict)
    .toPairs()
    .sortBy()
    .map(([k, v]: [string, [string, string[]]]) => {
      return `  "${k}": ${JSON.stringify(v)}`;
    })
    .join(',\n');
}

async function main({ from, to, out }: IArg) {
  const readFromFile = fs.readFile(from, 'utf8');
  const readToFile = fs.readFile(to, 'utf8');
  const fromJson = parseGamestring(await readFromFile);
  const toJson = parseGamestring(await readToFile);

  const startDict: Record<string, DictValue> = {};
  const result = _.reduce(
    toJson,
    (prevDict: Record<string, DictValue>, curToV: string, curKey: string) => {
      if (!validKey(curKey)) {
        return prevDict;
      }
      if (!_.has(fromJson, curKey)) {
        console.warn(`Key ${curKey} is found in toFile but absent in fromFile.`);
      }
      const curFromV = fromJson[curKey];

      return insertEntry(prevDict, curKey, curFromV, curToV);
    },
    startDict,
  );

  const content = `// tslint:disable
const i18nDict: Record<string, [string, string[]][]> = {
${formatContent(result)}
};

export default i18nDict;
`;

  return fs.writeFile(
    out,
    content,
  );
}

const argv = <IArg><unknown>(yargs
  .option(
    'from',
    {
      demandOption: true,
      describe: 'path to the gamestring file of the language to translate from',
      type: 'string',
    },
  )
  .option(
    'to',
    {
      demandOption: true,
      describe: 'path to the gamestring file of the language to translate to',
      type: 'string',
    },
  )
  .option(
    'out',
    {
      demandOption: true,
      describe: 'path to the output i18n.ts',
      type: 'string',
    },
  ).argv);

main(argv)
  .catch((e: Error) => {
    console.error(e);
  });
