import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from './index.js';

const SCHEMA_FILE = new URL('../../database/schema.sql', import.meta.url);

let pool = null;

// Tạo database (nếu chưa có), chạy schema.sql rồi mở connection pool
export async function connectDatabase() {
	const { host, port, user, password, database } = config.db;

	const setup = await mysql.createConnection({
		host,
		port,
		user,
		password,
		multipleStatements: true,
	});
	try {
		await setup.query(
			`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
		);
		await setup.query(`USE \`${database}\``);
		await setup.query(await readFile(SCHEMA_FILE, 'utf8'));
	} finally {
		await setup.end();
	}

	pool = mysql.createPool({
		host,
		port,
		user,
		password,
		database,
		connectionLimit: 10,
		// Trả DATETIME dạng chuỗi "YYYY-MM-DD HH:mm:ss" (giờ máy), đúng định dạng Frontend hiển thị và tìm kiếm
		dateStrings: true,
	});
	await pool.query('SELECT 1');
	console.log(`[MySQL] Đã kết nối: ${host}:${port}/${database}`);
}

export function db() {
	if (!pool) throw new Error('MySQL chưa được khởi tạo');
	return pool;
}

export async function isDatabaseConnected() {
	try {
		await pool?.query('SELECT 1');
		return Boolean(pool);
	} catch {
		return false;
	}
}

export async function disconnectDatabase() {
	await pool?.end();
	pool = null;
}
