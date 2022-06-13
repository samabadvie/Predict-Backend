import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'otpcode',
  synchronize: true,
})
export class OtpCodesEntity extends BaseEntity<OtpCodesEntity> {
  @Column({ type: 'int', nullable: false, default: 0 })
  user_id!: number;

  @Column({ type: 'varchar', length: 256, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  otpcode!: string;

  @Column({ type: 'timestamp', nullable: true })
  otpValidDate!: Date;
}
