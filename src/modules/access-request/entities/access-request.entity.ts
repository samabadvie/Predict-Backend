import { BaseEntity } from 'core/entities.entity';
import { UserEntity } from 'modules/users/entities/user.entity';
import { Entity, ManyToOne } from 'typeorm';

@Entity({
  name: 'Access-requests',
  synchronize: true,
})
export class AccessRequestEntity extends BaseEntity<AccessRequestEntity> {
  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  from!: UserEntity;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  to!: UserEntity;
}
