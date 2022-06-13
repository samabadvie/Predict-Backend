import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'Store-Items',
  synchronize: true,
})
export class StoreItemEntity extends BaseEntity<StoreItemEntity> {
  //Silver Box, Silver Pack, Gold Pack
  @Column({ type: 'varchar', length: 64, default: '' })
  type!: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  icon!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  value!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  price!: number;

  @Column({ type: 'varchar', length: 16, default: '' })
  price_unit!: string;
}
