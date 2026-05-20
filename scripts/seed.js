import 'dotenv/config';
import pool from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

async function seedDb() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM events');
    await client.query('DELETE FROM users');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE events_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

    const pw = hashPassword('Password1');
    const usersResult = await client.query(
      `INSERT INTO users (username, email, password_hash) VALUES
        ('alice',   'alice@example.com',   $1),
        ('bob',     'bob@example.com',     $1),
        ('charlie', 'charlie@example.com', $1)
       RETURNING id, username`,
      [pw]
    );
    const [alice, bob, charlie] = usersResult.rows;
    console.log('  👤 Users:', usersResult.rows.map(u => u.username).join(', '));

    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 86_400_000).toISOString();

    await client.query(
      `INSERT INTO events (title, description, date, total_seats, available_seats, created_by) VALUES
        ('Node.js Workshop',       'Hands-on Node.js and Express session',      $1, 50, 50, $4),
        ('PostgreSQL Deep Dive',   'Advanced PostgreSQL for developers',         $2, 30, 30, $4),
        ('React Summit',           'Full-day React conference with workshops',   $3, 200,200,$5),
        ('Docker & Kubernetes',    'Container orchestration from scratch',       $1, 40, 40, $5),
        ('Open Source Hackathon',  '24-hour open source coding marathon',        $2, 100,100,$6),
        ('TypeScript Masterclass', 'From beginner to advanced TypeScript',       $3, 60, 60, $4),
        ('API Design Patterns',    'REST, GraphQL, gRPC — when to use each',    $1, 45, 45, $6),
        ('DevOps Bootcamp',        'CI/CD, monitoring, and deployment pipelines',$2,80, 80, $5)`,
      [future(10), future(20), future(30), alice.id, bob.id, charlie.id]
    );
    console.log('   8 events seeded');

    await client.query('COMMIT');
    console.log(' Seed complete!');
    console.log('\n📋 Sample credentials:');
    console.log('   Email: alice@example.com   Password: Password1');
    console.log('   Email: bob@example.com     Password: Password1');
    console.log('   Email: charlie@example.com Password: Password1');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDb();