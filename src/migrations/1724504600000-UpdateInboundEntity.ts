import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInboundEntity1724504600000 implements MigrationInterface {
    name = 'UpdateInboundEntity1724504600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 이 마이그레이션은 엔티티를 최종 복합키 상태로 업데이트하기 위한 것입니다.
        // 실제 데이터베이스 변경사항은 이전 마이그레이션에서 처리되었습니다.
        console.log('Inbound entity updated to use composite primary key with preparation_date');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 롤백 시에는 특별한 작업이 필요하지 않습니다.
        console.log('Reverting inbound entity changes');
    }
}