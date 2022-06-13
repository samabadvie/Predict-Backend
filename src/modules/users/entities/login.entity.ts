import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'logins',
  synchronize: true,
})
export class LoginEntity extends BaseEntity<LoginEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  //   @Column({ type: 'varchar', length: 64, nullable: false, default: '' })
  //   device!: string;

  @Column({ type: 'timestamp', nullable: true })
  start_time!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_time!: Date | null;
}
