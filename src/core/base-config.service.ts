// import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { get, set } from 'lodash';
import { join } from 'path';
import { existsSync } from 'fs';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

config();

export class BaseConfig {
  private readonly baseDir: string;

  constructor(private readonly env: { [k: string]: string | undefined }) {
    let current = __dirname;
    while (!existsSync(join(current, 'node_modules'))) {
      current = join(current, '../');
    }
    this.baseDir = current;
  }

  public getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value || '';
  }

  protected asInt(v: string): number {
    return +v;
  }

  protected asBool(v: string): boolean {
    return ['t', 'true', '1'].includes(v.toLowerCase());
  }

  protected asUrl(
    raw: string,
    convertor?: { [key: string]: (v: string) => number | boolean | string },
  ): { host: string; port: string; protocol: string; options: Record<string, unknown> } {
    const url = new URL(raw);
    const opt = {};
    url.searchParams.forEach((v, k) => set(opt, k, v));
    if (convertor) {
      Object.keys(convertor).forEach((k) => {
        const v = get(opt, k);
        if (v != null) {
          set(opt, k, convertor[k](v));
        }
      });
    }
    return {
      host: url.hostname,
      port: url.port,
      protocol: url.protocol,
      options: opt,
    };
  }

  public ensureValues(keys: string[]): this {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  getHostAndPort(): { host: string; port?: string } {
    try {
      return {
        host: this.getValue('HOST'),
        port: this.getValue('PORT'),
      };
    } catch (e) {
      return {
        host: '0.0.0.0',
      };
    }
  }

  public getDatabaseSynchronize(): boolean {
    try {
      return this.asBool(this.getValue('SYNCHRONIZE', true));
    } catch (e) {
      return true;
    }
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      name: 'mysql',
      type: 'mysql',
      url: this.getValue(`MYSQL_DATABASE_URL`),
      entities: [__dirname + `/../**/*.entity{.ts,.js}`],
      // ssl: 'true',
      retryAttempts: 10,
      retryDelay: 3000,
      synchronize: this.getDatabaseSynchronize(),
    };
  }

  public getMailerConfig(): { apiKey: string; domain: string; from: string; host?: string } /*MailerOptions*/ {
    const defaults = {
      from: this.getValue('MAIL_FROM'),
      host: 'api.eu.mailgun.net',
    };
    return {
      apiKey: this.getValue('MAILGUN_API_KEY'),
      domain: this.getValue('MAILGUN_DOMAIN'),
      ...defaults,
    };
  }

  public getHTTPAddress(): string {
    return this.getValue('PORT');
  }

  public pathFromBase(...parts: string[]): string {
    return join(this.baseDir, ...parts);
  }
}
