import { BaseEntity } from 'core/entities.entity';
import { Column, Entity } from 'typeorm';

@Entity({
  name: 'MarketCharts',
  synchronize: true,
})
export class MarketChartEntity extends BaseEntity<MarketChartEntity> {
  @Column({ type: 'varchar', length: 32, default: '' })
  coin!: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  days!: string;

  @Column({ type: 'longtext', charset: 'utf8mb4', collation: 'utf8mb4_bin', nullable: true })
  chart_data!: string | null;
}
