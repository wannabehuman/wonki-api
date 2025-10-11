import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreparationDateToOutbound1724504500000 implements MigrationInterface {
    name = 'AddPreparationDateToOutbound1724504500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 조제일자 컬럼 추가 (NULL 허용)
        await queryRunner.query(`
            ALTER TABLE "outbound" 
            ADD COLUMN "preparation_date" date
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // preparation_date 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "outbound" 
            DROP COLUMN "preparation_date"
        `);
    }
}