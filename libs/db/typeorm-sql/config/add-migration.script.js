const yargs = require('yargs');
const { exec } = require('child_process');

const argv = yargs.argv;

const newMigrationName = argv._[0];

if (!newMigrationName) {
  throw new Error('Insert new migration name');
}

const typeormConfigPath = `${__dirname}/ormconfig.ts`;
const migrationsFolderPath = `${__dirname}/migrations`;

const command = `yarn typeorm-ts-node-esm migration:generate -d ${typeormConfigPath} ${migrationsFolderPath}/${newMigrationName}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});
