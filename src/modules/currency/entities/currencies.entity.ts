import { BaseEntity } from 'core/entities.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'Currencies',
  synchronize: true,
})
export class CurrencyEntity extends BaseEntity<CurrencyEntity> {
  @Column({ type: 'varchar', length: 32, default: '' })
  label!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  value!: string;

  @Column({ type: 'varchar', length: 128, default: '' })
  icon!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
