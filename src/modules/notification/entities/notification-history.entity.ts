import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'notification-histories',
  synchronize: true,
})
export class NotificationHistoryEntity extends BaseEntity<NotificationHistoryEntity> {
  @Column({ type: 'varchar', length: 255, precision: 255, default: '' })
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: false, default: '' })
  another_user!: string;

  @Column({ type: 'varchar', length: 256, nullable: false, default: '' })
  title!: string;

  @Column({ type: 'varchar', length: 512, nullable: false, default: '' })
  body!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  time!: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: false, default: '' })
  type!: string;
}
