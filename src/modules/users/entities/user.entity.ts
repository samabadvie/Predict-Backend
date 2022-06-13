import { Exclude } from 'class-transformer';
import { BaseEntity } from 'core/entities.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { configService } from 'core/config.service';
import shortid from 'shortid';
import { UserLevelEntity } from 'modules/user-level/entities/user-levels.entity';
import { NotificationEntity } from './notification.entity';
import { PointEntity } from 'modules/predict/entities/points.entity';

@Entity({
  name: 'Users',
  synchronize: true,
})
export class UserEntity extends BaseEntity<UserEntity> {
  @Column({ type: 'varchar', length: 255, precision: 255, default: '' })
  username!: string;

  @Column({ type: 'varchar', length: 256, nullable: false, default: '' })
  fcm_token!: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255, precision: 255, nullable: true })
  password_hash!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: false, default: 'USD' })
  prefer_currency!: string;

  @Column({ type: 'varchar', length: 32, nullable: false, default: 'BTC' })
  default_coin!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  picture!: string | null;

  @Column({ type: 'varchar', length: 255, precision: 255, nullable: false, default: '' })
  email!: string;

  @Column({ type: 'boolean', default: false })
  email_verified!: boolean;

  @Column({ type: 'int', nullable: false, default: configService.getDefaultPoints() })
  points!: number;

  @Column({ type: 'int', nullable: false, default: configService.getDefaultPoints() })
  available_points!: number;

  @Column({ type: 'varchar', length: 32, nullable: false, default: '0' })
  score!: string;

  @Column({ type: 'int', nullable: false, default: 10 })
  silver_chips!: number;

  @Column({ type: 'int', nullable: false, default: 60 })
  silver_chips_max!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  golden_chips!: number;

  @Column('varchar', { length: 10, default: () => `'${shortid.generate()}'` })
  referral_code!: string;

  @Column({ type: 'int', nullable: true })
  refer_by!: number;

  @ManyToMany(() => UserEntity, (user) => user.followers, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  followers!: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.following, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  following!: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.blocks, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  blocks!: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.blocks_by, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  blocks_by!: UserEntity[];

  @Column({ type: 'bigint', nullable: false, default: 0 })
  playing_time!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  total_predicts!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  point_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  total_wins_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  total_wins!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  win_streaks!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  btc_win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  btc_win_streaks!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  eth_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  eth_win_streaks!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  altcoins_win_streaks_level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  altcoins_win_streaks!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  badges_count!: number;

  //TODO: userLevel if deleted add onDelete
  @ManyToOne(() => UserLevelEntity, (userLevel) => userLevel.users)
  user_level!: UserLevelEntity;

  @OneToOne(() => NotificationEntity, (notification) => notification.user)
  @JoinColumn()
  notification!: NotificationEntity;

  @ManyToMany(() => UserEntity, (user) => user.allowed, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  allowed!: UserEntity[];

  @ManyToMany(() => UserEntity, (user) => user.allowed_by, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinTable()
  allowed_by!: UserEntity[];

  @OneToMany(() => PointEntity, (point) => point.user)
  receive_points!: PointEntity[];

  @Column({ type: 'int', nullable: false, default: 0 })
  max_win_streaks!: number;
}
