import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('wk_handstock')
export class Handstock {
  @PrimaryColumn({ length: 11 })
  inbound_no: string; // yyyyMMdd + 001, 002, etc.

  @Column()
  stock_code: string;

  @Column({ type: 'date' })
  inbound_date: Date;

  @Column({ type: 'date', nullable: true })
  preparation_date: Date; // 조제일자

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  created_at: Date;
}
