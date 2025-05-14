import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ Missing DATABASE_URL in .env");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const sql = `
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;
CREATE FOREIGN DATA WRAPPER firebase_wrapper
  HANDLER firebase_fdw_handler
  VALIDATOR firebase_fdw_validator;
CREATE SERVER IF NOT EXISTS firebase_server
  FOREIGN DATA WRAPPER firebase_wrapper
  OPTIONS (
    project_id   '${process.env.FIREBASE_PROJECT_ID}',
    credentials  '${process.env.FIREBASE_CREDENTIALS_PATH}'
  );
CREATE FOREIGN TABLE IF NOT EXISTS profiles (
  id    TEXT,
  attrs JSONB
)
SERVER firebase_server
OPTIONS ( object 'firestore/user-profiles' );
`;
try {
  await client.query(sql);
  console.log("✅ FDW setup complete");
} catch (err) {
  console.error("❌ Error during FDW setup:", err);
} finally {
  await client.end();
}
