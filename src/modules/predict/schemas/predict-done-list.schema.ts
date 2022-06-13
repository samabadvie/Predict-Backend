export class PredictDoneListSchema {
  id!: number;

  symbol!: string;

  time!: string | undefined;

  point!: number;

  status!: string;

  direction!: string;

  start_value!: string;

  end_value!: string;

  time_type!: string;
}
