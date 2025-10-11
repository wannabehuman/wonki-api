import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreparationDateToInbound1724504400000 implements MigrationInterface {
    name = 'AddPreparationDateToInbound1724504400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1단계: 조제일자 컬럼 추가 (NULL 허용)
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ADD COLUMN "preparation_date" date
        `);

        // 2단계: 기존 데이터의 preparation_date를 고유하게 설정
        // 같은 stock_code, inbound_date 조합이 있다면 preparation_date를 다르게 설정
        await queryRunner.query(`
            WITH numbered_rows AS (
                SELECT 
                    ctid,
                    stock_code,
                    inbound_date,
                    ROW_NUMBER() OVER (PARTITION BY stock_code, inbound_date ORDER BY ctid) - 1 AS row_num
                FROM "inbound"
            )
            UPDATE "inbound" 
            SET "preparation_date" = (
                SELECT inbound_date + (row_num || ' days')::interval 
                FROM numbered_rows 
                WHERE numbered_rows.ctid = "inbound".ctid
            )::date
        `);

        // 3단계: preparation_date를 NOT NULL로 변경
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ALTER COLUMN "preparation_date" SET NOT NULL
        `);

        // 4단계: 기존 PRIMARY KEY 제약 조건 삭제
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            DROP CONSTRAINT "PK_inbound"
        `);

        // 5단계: 새로운 복합 PRIMARY KEY 생성 (inbound_date, stock_code, preparation_date)
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ADD CONSTRAINT "PK_inbound" 
            PRIMARY KEY ("inbound_date", "stock_code", "preparation_date")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 복합 PRIMARY KEY 제거
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            DROP CONSTRAINT "PK_inbound"
        `);

        // 기존 PRIMARY KEY 복구 (inbound_date, stock_code)
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ADD CONSTRAINT "PK_inbound" 
            PRIMARY KEY ("inbound_date", "stock_code")
        `);

        // preparation_date 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            DROP COLUMN "preparation_date"
        `);
    }
}