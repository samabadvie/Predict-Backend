import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'predicts',
  synchronize: true,
})
export class PredictEntity extends BaseEntity<PredictEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  @Column({ type: 'varchar', length: 32, default: '' })
  symbol!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  time!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  point!: number;

  //Up or Down
  @Column({ type: 'varchar', length: 16, default: '' })
  direction!: string;

  @Column({ type: 'timestamp', nullable: true })
  start_time!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_time!: Date | null;

  @Column({ type: 'varchar', length: 32, nullable: false, default: '' })
  start_value!: string;

  @Column({ type: 'varchar', length: 32, nullable: false, default: '' })
  end_value!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  status!: string;
}
