import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'notification-assets',
  synchronize: true,
})
export class NotificationAssetEntity extends BaseEntity<NotificationAssetEntity> {
  @Column({ type: 'varchar', length: 64, nullable: false, default: '' })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  type!: string;

  @Column({ type: 'varchar', length: 500, nullable: false, default: '' })
  icon!: string;
}
