import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wk_stock_base')
export class StockBase {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column()
  unit: string;

  @Column({ type: 'int', nullable: true })
  max_use_period: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'boolean', default: false })
  isAlert: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
