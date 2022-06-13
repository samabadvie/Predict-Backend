import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QUEUES } from '../queues';

@Injectable()
export class QueueProducer {
  constructor(
    @InjectQueue(QUEUES.PREDICT_UPDATES)
    public predictUpdatesQueue: Queue,

    @InjectQueue(QUEUES.UPDATES)
    public updatesQueue: Queue,

    @InjectQueue(QUEUES.WAITING_PREDICTIONS)
    public waitingPredictionsQueue: Queue,

    @InjectQueue(QUEUES.NEW_SCORE)
    public newScoreQueue: Queue,
  ) {}
}
