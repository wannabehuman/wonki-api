import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wk_stock_hst')
export class StockHst {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  inbound_no: string;

  @Column()
  stock_code: string;

  @Column({ type: 'date', name: 'io_date', nullable: true })
  io_date: Date;

  @Column({ length: 10, default: 'OUT' })
  io_type: string; // 'IN' 또는 'OUT'

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;
}
