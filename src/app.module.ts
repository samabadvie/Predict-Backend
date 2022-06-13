/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configService } from 'core/config.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { Holder } from './core/decorators';
import { getConnection } from 'typeorm';
import { ConnectionsEnum } from './core/connections.enum';
import { EmailModule } from './modules/email/email.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CurrencyModule } from 'modules/currency/currency.module';
import { AvatarsModule } from './modules/avatars/avatars.module';
import { CoinModule } from 'modules/coins/coins.module';
import { WebsocketModule } from 'modules/websocket/websocket.module';
import { PredictModule } from 'modules/predict/predict.module';
import { AdminsModule } from 'modules/admins/admins.module';
import { UserLevelsModule } from 'modules/user-level/user-levels.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketChartModule } from 'modules/market-chart/market-chart.module';
import { BullModule } from '@nestjs/bull';
import { BadgesModule } from 'modules/badges/badges.module';
import { AccessRequestModule } from 'modules/access-request/access-request.module';
import { StoreModule } from 'modules/store/store.module';
import { NotificationModule } from 'modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    AuthModule,
    UsersModule,
    EmailModule,
    CurrencyModule,
    AvatarsModule,
    CoinModule,
    WebsocketModule,
    PredictModule,
    AdminsModule,
    UserLevelsModule,
    MarketChartModule,
    BadgesModule,
    AccessRequestModule,
    StoreModule,
    NotificationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'assets'),
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot(configService.getRedisQueueConfig()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    Holder.setConnections({
      mysql: getConnection(ConnectionsEnum.MYSQL),
    });
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/api');
  }
}
