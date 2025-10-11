import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CodeGroup } from './code-group.entity';

@Entity('wk_code_detail')
export class CodeDetail {
  @PrimaryColumn({ length: 20 })
  grp_code: string; // 그룹코드 (FK)

  @PrimaryColumn({ length: 20 })
  code: string; // 코드

  @Column({ length: 100 })
  code_name: string; // 코드명

  @Column({ length: 100, nullable: true })
  code_value: string; // 코드값

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

  @ManyToOne(() => CodeGroup)
  @JoinColumn({ name: 'grp_code' })
  codeGroup: CodeGroup;
}
