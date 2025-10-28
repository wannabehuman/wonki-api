import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string; // 등록자 user ID

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string; // 수정자 user ID

  @UpdateDateColumn()
  updated_at: Date;
}
