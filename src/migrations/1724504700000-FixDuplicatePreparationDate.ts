import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDuplicatePreparationDate1724504700000 implements MigrationInterface {
    name = 'FixDuplicatePreparationDate1724504700000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1단계: 기존 복합키 제거 (이미 있다면)
        try {
            await queryRunner.query(`
                ALTER TABLE "inbound" 
                DROP CONSTRAINT IF EXISTS "PK_inbound"
            `);
        } catch (error) {
            console.log('Primary key constraint not found or already removed');
        }

        // 2단계: 중복된 데이터 정리 - 같은 stock_code, inbound_date를 가진 레코드들의 preparation_date를 고유하게 만들기
        await queryRunner.query(`
            WITH ranked_data AS (
                SELECT 
                    ctid,
                    stock_code,
                    inbound_date,
                    preparation_date,
                    ROW_NUMBER() OVER (
                        PARTITION BY stock_code, inbound_date 
                        ORDER BY 
                            CASE WHEN preparation_date IS NOT NULL THEN preparation_date ELSE inbound_date END,
                            ctid
                    ) - 1 AS row_num
                FROM "inbound"
            )
            UPDATE "inbound" 
            SET "preparation_date" = (
                SELECT (
                    CASE 
                        WHEN ranked_data.preparation_date IS NOT NULL 
                        THEN ranked_data.preparation_date + (ranked_data.row_num || ' days')::interval
                        ELSE ranked_data.inbound_date + (ranked_data.row_num || ' days')::interval
                    END
                )::date
                FROM ranked_data 
                WHERE ranked_data.ctid = "inbound".ctid
            )
        `);

        // 3단계: preparation_date가 여전히 NULL인 경우를 위한 처리
        await queryRunner.query(`
            UPDATE "inbound" 
            SET "preparation_date" = "inbound_date"
            WHERE "preparation_date" IS NULL
        `);

        // 4단계: preparation_date를 NOT NULL로 설정
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ALTER COLUMN "preparation_date" SET NOT NULL
        `);

        // 5단계: 새로운 복합 PRIMARY KEY 생성
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
    }
}