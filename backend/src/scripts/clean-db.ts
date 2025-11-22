import pool from '../db';

const cleanDb = async () => {
  try {
    // Delete trip members with null user_id
    await pool.query('DELETE FROM trip_members WHERE user_id IS NULL');
    
    // Delete trips created by null (if any)
    await pool.query('DELETE FROM trips WHERE created_by IS NULL');

    console.log('Database cleaned of invalid entries.');
  } catch (error) {
    console.error('Error cleaning DB:', error);
  } finally {
    pool.end();
  }
};

cleanDb();
