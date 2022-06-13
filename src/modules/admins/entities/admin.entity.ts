import { Exclude } from 'class-transformer';
import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'Admins',
  synchronize: true,
})
export class AdminEntity extends BaseEntity<AdminEntity> {
  @Column({ type: 'varchar', length: 255, precision: 255, default: '' })
  username!: string;

  @Exclude()
  @Column({ name: 'password', type: 'varchar', length: 255, precision: 255, nullable: true })
  password_hash!: string | null;

  @Column({ name: 'is_admin', type: 'boolean', nullable: false, default: true })
  is_admin!: boolean;
}
