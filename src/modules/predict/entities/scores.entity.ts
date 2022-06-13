import { BaseEntity } from 'core/entities.entity';
import { UserEntity } from 'modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity({
  name: 'scores',
  synchronize: true,
})
export class ScoreEntity extends BaseEntity<ScoreEntity> {
  @ManyToOne(() => UserEntity, (user) => user.receive_points, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 32, nullable: false, default: '0' })
  score!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  rank!: number;
}
