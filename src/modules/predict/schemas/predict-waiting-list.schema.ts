export class PredictWaitingListSchema {
  id!: number;

  symbol!: string;

  start_time!: Date | null;

  end_time!: string;

  price!: string;

  point!: number;

  direction!: string;

  messariID?: string;
}

export class WaitingListSchema {
  count!: number;

  predicts!: PredictWaitingListSchema[];
}
