import { BaseEntity } from 'core/entities.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'notifications',
  synchronize: true,
})
export class NotificationEntity extends BaseEntity<NotificationEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  @Column({ type: 'boolean', nullable: false, default: true })
  prediction_result!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  access_request!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  followed_by_user!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  league_upgrade!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  progress_upgrade!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  badge_received!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  chip_reception!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  app_push_notification!: boolean;

  @OneToOne(() => UserEntity, (user) => user.notification)
  user!: UserEntity;
}
