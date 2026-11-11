import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/omniaqua",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL] Erro inesperado no cliente de banco:", err);
});

export async function testDbConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("[PostgreSQL] Conexão estabelecida com sucesso. Hora do servidor:", result.rows[0].now);
  } catch (error) {
    console.error("[PostgreSQL] Falha ao conectar ao banco de dados:", error.message);
  }
}
