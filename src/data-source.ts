import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Load .env file manually for CLI usage
import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

// Explicitly import entities for CLI
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { Application } from './database/entities/application.entity';

const useSsl: boolean = process.env.DATABASE_URL?.includes('sslmode=require') ?? false;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Use explicit imports instead
  entities: [User, Role, Application],
  migrations: [__dirname + '/database/migrations/*{.ts,.js}'], // Adjusted path
  migrationsTableName: 'migrations',
  synchronize: false, // Set back to false for production safety
  ssl: useSsl ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 