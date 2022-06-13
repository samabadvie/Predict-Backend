import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'Badges',
  synchronize: true,
})
export class BadgeEntity extends BaseEntity<BadgeEntity> {
  @Column({ type: 'varchar', length: 255, precision: 255, default: '' })
  name!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  level!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  count!: number;

  @Column({ type: 'varchar', length: 128, default: '' })
  icon!: string;
}
