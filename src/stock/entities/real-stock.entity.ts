import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wk_real_stock')
export class RealStock {
  @PrimaryColumn({ length: 50 })
  stock_code: string; // 품목코드 (PK)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  quantity: number; // 실재고 수량

  @Column({ length: 20, nullable: true })
  unit: string; // 단위

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
