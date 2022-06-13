import { BaseEntity } from 'core/entities.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { StoreItemEntity } from './store-item.entity';

@Entity({
  name: 'Store-Buyers',
  synchronize: true,
})
export class StoreBuyersEntity extends BaseEntity<StoreBuyersEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  @ManyToOne(() => StoreItemEntity)
  item!: StoreItemEntity;
}
