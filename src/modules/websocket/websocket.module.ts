import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MessariGateway } from './gateways/prices/gateways';
import { PredictUpdatesGateway } from './gateways/updates/predict-updates.gateway';
import { UpdatesGateway } from './gateways/updates/updates.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'predictUpdates',
      defaultJobOptions: {
        removeOnFail: true,
        removeOnComplete: true,
      },
    }),
    BullModule.registerQueue({
      name: 'updates',
      defaultJobOptions: {
        removeOnFail: true,
        removeOnComplete: true,
      },
    }),
  ],
  providers: [MessariGateway, PredictUpdatesGateway, UpdatesGateway],
  exports: [PredictUpdatesGateway, UpdatesGateway],
})
export class WebsocketModule {}
