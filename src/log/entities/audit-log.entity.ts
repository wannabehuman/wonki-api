import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('wk_audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: true })
  user_id: string;

  @Column({ length: 100, nullable: true })
  username: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ length: 50 })
  table_name: string;

  @Column({ length: 100, nullable: true })
  record_id: string;

  @Column({ length: 10 })
  operation: string; // INSERT, UPDATE, DELETE

  @Column({ type: 'text', nullable: true })
  old_value: string;

  @Column({ type: 'text', nullable: true })
  new_value: string;

  @Column({ length: 50, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
