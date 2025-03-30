import { Pool } from "pg";

import dotenv from "dotenv";
dotenv.config();

const main = async () => {
  console.log("start defi-agent");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.connect();
    console.log("connected to postgres");
  } catch (error) {
    console.error("connect to PostgreSQL database:", error);
    throw error;
  }
};

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
