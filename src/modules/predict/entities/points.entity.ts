import { BaseEntity } from 'core/entities.entity';
import { UserEntity } from 'modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity({
  name: 'points',
  synchronize: true,
})
export class PointEntity extends BaseEntity<PointEntity> {
  @ManyToOne(() => UserEntity, (user) => user.receive_points, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  user!: UserEntity;

  @Column({ type: 'int', nullable: false, default: 0 })
  point!: number;

  @Column({ type: 'timestamp', nullable: true })
  time!: Date | null;
}
