import { EnvConfiguration } from '../../../../app-configuration/environment/env-configuration';
import { DataSource, DataSourceOptions } from 'typeorm';

const envVariables: EnvConfiguration = new EnvConfiguration();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: envVariables.POSTGRES_REMOTE_HOST,
  port: Number(envVariables.POSTGRES_REMOTE_PORT),
  username: envVariables.POSTGRES_REMOTE_USERNAME,
  password: envVariables.POSTGRES_REMOTE_PASSWORD,
  database: 'incubator',
  synchronize: false,
  logging: true,
  ssl: true,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
};

const dataSource: DataSource = new DataSource(dataSourceOptions);

export default dataSource;
