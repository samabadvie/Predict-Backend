import { BaseEntity } from 'core/entities.entity';
import { UserEntity } from 'modules/users/entities/user.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({
  name: 'User-levels',
  synchronize: true,
})
export class UserLevelEntity extends BaseEntity<UserLevelEntity> {
  @Column({ type: 'varchar', length: 255, precision: 255, default: '' })
  name!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  max_point!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  total_wins_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  btc_win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  eth_win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  altcoins_win_streaks_level!: number;

  @Column({ type: 'bigint', nullable: false, default: 0 })
  points!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  min_badges!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  num_of_gold_chips!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  num_of_followers!: number;

  @Column({ type: 'varchar', length: 128, default: '' })
  icon!: string;

  @Column({ type: 'bool', nullable: false, default: false })
  allow_cancel_predict!: boolean;

  @Column({ type: 'bool', nullable: false, default: false })
  access_request_enable!: boolean;

  @OneToMany(() => UserEntity, (user) => user.user_level)
  users!: UserEntity[];
}
