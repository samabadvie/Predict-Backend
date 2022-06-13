import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QUEUES } from 'modules/predict/queues';

@Injectable()
export class QueueProducer {
  constructor(
    @InjectQueue(QUEUES.UPDATES)
    public updatesQueue: Queue,
  ) {}
}
