import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForceFixCompositeKey1724504800000 implements MigrationInterface {
    name = 'ForceFixCompositeKey1724504800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1단계: 모든 기존 PRIMARY KEY 제약 조건 제거
        try {
            const constraints = await queryRunner.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'inbound' 
                AND constraint_type = 'PRIMARY KEY'
            `);
            
            for (const constraint of constraints) {
                await queryRunner.query(`
                    ALTER TABLE "inbound" 
                    DROP CONSTRAINT "${constraint.constraint_name}"
                `);
                console.log(`Dropped constraint: ${constraint.constraint_name}`);
            }
        } catch (error) {
            console.log('Error dropping constraints:', error.message);
        }

        // 2단계: preparation_date 컬럼이 없으면 추가
        try {
            await queryRunner.query(`
                ALTER TABLE "inbound" 
                ADD COLUMN IF NOT EXISTS "preparation_date" date
            `);
        } catch (error) {
            console.log('preparation_date column already exists or error:', error.message);
        }

        // 3단계: preparation_date가 NULL인 레코드 처리
        await queryRunner.query(`
            UPDATE "inbound" 
            SET "preparation_date" = "inbound_date"
            WHERE "preparation_date" IS NULL
        `);

        // 4단계: 중복 제거 - 동일한 (stock_code, inbound_date, preparation_date) 조합이 있으면 하나만 남기기
        await queryRunner.query(`
            DELETE FROM "inbound" 
            WHERE ctid NOT IN (
                SELECT min(ctid) 
                FROM "inbound" 
                GROUP BY stock_code, inbound_date, preparation_date
            )
        `);

        // 5단계: preparation_date를 NOT NULL로 설정
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ALTER COLUMN "preparation_date" SET NOT NULL
        `);

        // 6단계: 새로운 3개 필드 복합 PRIMARY KEY 생성
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ADD CONSTRAINT "PK_inbound_composite" 
            PRIMARY KEY ("stock_code", "inbound_date", "preparation_date")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 3개 필드 복합키 제거
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            DROP CONSTRAINT "PK_inbound_composite"
        `);

        // 기존 2개 필드 복합키 복구
        await queryRunner.query(`
            ALTER TABLE "inbound" 
            ADD CONSTRAINT "PK_inbound" 
            PRIMARY KEY ("stock_code", "inbound_date")
        `);
    }
}