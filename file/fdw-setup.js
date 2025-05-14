// fdw-setup.js
import { Client } from "pg";
import dotenv from "dotenv";

// 1. Load .env into process.env
dotenv.config();

// 2. Pull in our config variables
const connectionString = process.env.DATABASE_URL;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseCredentials = process.env.FIREBASE_CREDENTIALS_PATH;

if (!connectionString) {
  console.error("❌ Missing DATABASE_URL in .env");
  process.exit(1);
}
if (!firebaseProjectId) {
  console.error("❌ Missing FIREBASE_PROJECT_ID in .env");
  process.exit(1);
}
if (!firebaseCredentials) {
  console.error("❌ Missing FIREBASE_CREDENTIALS_PATH in .env");
  process.exit(1);
}

// 3. Async wrapper so we can use await at the top level
(async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  });

  try {
    await client.connect();
    console.log("🔗 Connected to Postgres.");

    const sql = `
      -- 1️⃣ Install the wrappers extension
      CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

      -- 2️⃣ Register the Firebase FDW
      CREATE FOREIGN DATA WRAPPER IF NOT EXISTS firebase_wrapper
        HANDLER firebase_fdw_handler
        VALIDATOR firebase_fdw_validator;

      -- 3️⃣ Point it at your Firebase project
      CREATE SERVER IF NOT EXISTS firebase_server
        FOREIGN DATA WRAPPER firebase_wrapper
        OPTIONS (
          project_id   '${firebaseProjectId}',
          credentials  '${firebaseCredentials}'
        );

      -- 4️⃣ Expose Firestore 'user-profiles' as a foreign table
      CREATE FOREIGN TABLE IF NOT EXISTS profiles (
        id    TEXT,
        attrs JSONB
      )
      SERVER firebase_server
      OPTIONS ( object 'firestore/user-profiles' );
    `;

    await client.query(sql);
    console.log("✅ FDW setup complete");
  } catch (err) {
    console.error("❌ Error during FDW setup:", err);
  } finally {
    await client.end();
    console.log("🔌 Disconnected from Postgres.");
  }
})();
