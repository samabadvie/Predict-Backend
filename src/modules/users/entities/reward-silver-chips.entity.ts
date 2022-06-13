import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'reward_silver_chips',
  synchronize: true,
})
export class RewardSilverChipsEntity extends BaseEntity<RewardSilverChipsEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  silver_chips_amount!: number;

  @Column({ type: 'timestamp', nullable: true })
  time!: Date | null;
}
