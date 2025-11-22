import pool from "../db";

const addOtpColumns = async () => {
  try {
    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('activation_otp', 'activation_expires_at')
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);

    // Add activation_otp column if it doesn't exist
    if (!existingColumns.includes('activation_otp')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN activation_otp VARCHAR(6)
      `);
      console.log("✅ Added 'activation_otp' column to users table");
    } else {
      console.log("ℹ️  'activation_otp' column already exists");
    }

    // Add activation_expires_at column if it doesn't exist
    if (!existingColumns.includes('activation_expires_at')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN activation_expires_at TIMESTAMP
      `);
      console.log("✅ Added 'activation_expires_at' column to users table");
    } else {
      console.log("ℹ️  'activation_expires_at' column already exists");
    }

    console.log("\n✅ OTP migration completed successfully!");
  } catch (err) {
    console.error("❌ Error during migration:", err);
  } finally {
    await pool.end();
  }
};

addOtpColumns();
