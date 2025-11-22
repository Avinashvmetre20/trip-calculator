import pool from "../db";

const addActivationColumns = async () => {
  try {
    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_active', 'activation_token')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    // Add is_active column if it doesn't exist
    if (!existingColumns.includes('is_active')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT FALSE
      `);
      console.log("✅ Added 'is_active' column to users table");
    } else {
      console.log("ℹ️  'is_active' column already exists");
    }

    // Add activation_token column if it doesn't exist
    if (!existingColumns.includes('activation_token')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN activation_token VARCHAR(255)
      `);
      console.log("✅ Added 'activation_token' column to users table");
    } else {
      console.log("ℹ️  'activation_token' column already exists");
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    await pool.end();
  }
};

addActivationColumns();
