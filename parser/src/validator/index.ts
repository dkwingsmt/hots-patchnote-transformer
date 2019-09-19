import _ from 'lodash';
import Bluebird from 'bluebird';
import { readJson, writeFile, ensureDir } from 'fs-extra';
import Ajv from 'ajv';
import { compile as compileJsonToTs } from 'json-schema-to-typescript';
import yargs from 'yargs';
import path from 'path';

interface SchemaWithMain {
  Main: { title: string },
}

function validateSchema(rawSchemaObject: Object): SchemaWithMain {
  if (typeof _.get(rawSchemaObject, 'Main.title') !== 'string') {
    throw Error('Path "Main.title" in the schema is not a string.');
  }
  return rawSchemaObject as SchemaWithMain;
}

function validateData(dataObject: Object, schemaObject: SchemaWithMain) {
  const ajv = Ajv({ verbose: true });
  ajv.compile({
    ...schemaObject.Main,
    '$id': 'Main',
    definitions: _.omit(schemaObject, 'Main'),
  });
  if (!ajv.validate('Main', dataObject)) {
    throw Error('Data does not meet schema. Reasons:\n' + JSON.stringify(ajv.errors, null, 2));
  }
}

async function generateOutput(dataObject: Object, schemaObject: SchemaWithMain): Promise<string> {
  const mainTypeName = schemaObject.Main.title;
  const typeInfo = await compileJsonToTs({
    ...schemaObject.Main,
    definitions: _.omit(schemaObject, 'Main'),
  }, mainTypeName);

  return `${typeInfo}
const data: ${mainTypeName} = ${JSON.stringify(dataObject, null, 2)};

export default data;
`;
}

interface Options {
  dataPath: string;
  schemaPath: string;
  outputPath: string;
}

// Schema format:
// {
//   "Main": <main schema>,
//   "<key>": <subschema>
// }
// To refer, use "#/definitions/<key>".
// Subschema doesn't need id, but needs title.
async function generateTypedData(options: Options) {
  const readSchemaTask = readJson(options.schemaPath);
  const readDataTask = readJson(options.dataPath);
  const rawSchemaObject = await readSchemaTask;
  const schemaObject: SchemaWithMain = validateSchema(rawSchemaObject);

  const dataObject = await readDataTask;
  validateData(dataObject , schemaObject);
  const output = await generateOutput(dataObject, schemaObject);
  return writeFile(options.outputPath, output, { encoding: 'utf8' });
}

async function main() {
  const argv = yargs
    .usage('Usage: $0 [options]')
    .options('output', {
      alias: 'o',
      demandOption: true,
      type: 'string',
      nargs: 1,
      describe: 'Directory to store the resulting files',
    })
    .options('data', {
      alias: 'd',
      demandOption: true,
      type: 'string',
      nargs: 1,
      describe: 'Directory that contains data files',
    })
    .options('schema', {
      alias: 's',
      demandOption: true,
      type: 'string',
      nargs: 1,
      describe: 'Directory that contains JSON schema',
    })
    .options('name', {
      alias: 'n',
      type: 'array',
      describe: 'The name of schema files and data files that will be processed',
      default: ['herodata'],
    })
    .options('build', {
      alias: 'b',
      type: 'number',
      demandOption: true,
      describe: 'The build number',
    })
    .argv;

  const dataDir = path.resolve(argv.data);
  const schemaDir = path.resolve(argv.schema);
  const outputDir = path.resolve(argv.output);
  await ensureDir(outputDir);
  const build = argv.build;

  await Bluebird.map(argv.name, (name: string) => {
    const schemaPath = path.join(schemaDir, `${name}.json`);
    return Bluebird.map(['enus', 'zhcn'], (language: string) => {
      const dataPath = path.join(dataDir, `${name}_${build}_${language}.json`);
      const outputPath = path.join(outputDir, `${name}_${language}.ts`);
      return generateTypedData({
        dataPath: dataPath,
        schemaPath: schemaPath,
        outputPath: outputPath,
      });
    });
  }).catch((err: Error) => console.error(err));
}

main();