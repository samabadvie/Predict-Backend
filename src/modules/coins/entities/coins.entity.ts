import { BaseEntity } from 'core/entities.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'Coins',
  synchronize: true,
})
export class CoinsEntity extends BaseEntity<CoinsEntity> {
  @Column({ type: 'varchar', length: 32, default: '' })
  name!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  symbol!: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  icon!: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  messariID!: string;
}
