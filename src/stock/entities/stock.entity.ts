import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stocks')
export class Stock {
  @PrimaryColumn()
  name: string;

  @Column()
  quantity: number;

  @Column()
  unit: string;

  @Column()
  location: string;

  @Column()
  initialQuantity: number;

  @Column()
  outQuantity: number;

  @Column()
  stockQuantity: number;

  @Column()
  stockUpdateReason: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
