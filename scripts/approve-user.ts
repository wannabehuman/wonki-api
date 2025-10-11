import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'wonki',
  password: 'wonki14',
  database: 'stock_manage',
});

async function approveUser() {
  await dataSource.initialize();

  const result = await dataSource.query(
    `UPDATE wk_user SET status = 'active', role = 'admin' WHERE username = 'wonki' RETURNING *`
  );

  console.log('사용자 승인 완료:', result);

  await dataSource.destroy();
}

approveUser().catch(console.error);
