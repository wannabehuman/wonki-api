import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wk_code_group')
export class CodeGroup {
  @PrimaryColumn({ length: 20 })
  grp_code: string; // 그룹코드

  @Column({ length: 100 })
  grp_name: string; // 그룹명

  @Column({ type: 'text', nullable: true })
  description: string; // 설명

  @Column({ type: 'char', length: 1, default: 'Y' })
  use_yn: string; // 사용여부 (Y/N)

  @Column({ type: 'int', default: 0 })
  sort_order: number; // 정렬순서

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
