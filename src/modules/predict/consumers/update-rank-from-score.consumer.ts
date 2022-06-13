import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUES } from '../queues';
import { ScoreService } from '../services/scores.service';

@Processor(QUEUES.NEW_SCORE)
export class UpdateRankFromScoreConsumer {
  constructor(private readonly scoreService: ScoreService) {}

  @Process('newScoreJob')
  async waitings(job: Job<string>): Promise<void> {
    if (job.data === 'updateRank') {
      await this.scoreService.updateRankFromScores();
    }
  }
}
