import { BaseEntity } from 'core/entities.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'Avatars',
  synchronize: true,
})
export class AvatarEntity extends BaseEntity<AvatarEntity> {
  @Column({ type: 'varchar', length: 256, default: '' })
  path!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  price!: number;
}
