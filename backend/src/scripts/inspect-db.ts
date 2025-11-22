import pool from '../db';

const inspectDb = async () => {
  try {
    const users = await pool.query('SELECT * FROM users');
    console.log('Users:', users.rows);

    const trips = await pool.query('SELECT * FROM trips');
    console.log('Trips:', trips.rows);

    const members = await pool.query('SELECT * FROM trip_members');
    console.log('Trip Members:', members.rows);
  } catch (error) {
    console.error('Error inspecting DB:', error);
  } finally {
    pool.end();
  }
};

inspectDb();
