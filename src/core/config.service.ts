import { BaseConfig } from 'core/base-config.service';
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import Bull from 'bull';

class Config extends BaseConfig {
  public getSwaggerEnabled(): boolean {
    try {
      return this.asBool(this.getValue('ENABLE_SWAGGER'));
    } catch (e) {
      return false;
    }
  }

  public getIsTesting(): boolean {
    try {
      return this.getValue('ENV', true) == 'testing';
    } catch (e) {
      return false;
    }
  }

  public getJwtSecret(): string {
    return this.getValue('JWT_SECRET');
  }

  public getEncryptionKey(): string {
    return this.getValue('ENCRYPTION_KEY');
  }

  public getJwtExpire(): number {
    return this.asInt(this.getValue('JWT_EXPIRE_SEC'));
  }

  public getAppBaseUrl(): string {
    return this.getValue('APP_URL');
  }

  public getDefaultPoints(): number {
    return this.asInt(this.getValue('DEFAULT_USER_POINTS'));
  }

  public getAPIKey(): string {
    return this.getValue('API_KEY');
  }

  public getMessariAPIKey(): string {
    return this.getValue('MESSARI_API_KEY');
  }

  public getFCMServerKey(): string {
    return this.getValue('FCM_SERVER_KEY');
  }

  public getExtraModels(): SwaggerDocumentOptions {
    return {
      extraModels: [
        //TODO: add entities for swagger
      ],
    };
  }

  public getRedisQueueConfig(): Bull.QueueOptions {
    return {
      redis: {
        username: this.getValue('REDIS_USERNAME'),
        password: this.getValue('REDIS_PASSWORD'),
        tls: {
          host: this.getValue('REDIS_HOST'),
          port: +this.getValue('REDIS_PORT')!,
        },
      },
    };
  }
}

const configService = new Config(process.env);

type ConfigService = typeof configService;

export { configService, ConfigService };
