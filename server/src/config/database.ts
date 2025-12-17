import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 데이터베이스 연결 설정
const dbConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'schedule_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 포트 설정 (TCP/IP 연결 시)
if (process.env.DB_PORT) {
  dbConfig.port = parseInt(process.env.DB_PORT);
}

// 소켓 파일 경로 설정 (localhost 사용 시)
const dbHost = process.env.DB_HOST || 'localhost';
if (dbHost === 'localhost' && !process.env.DB_PORT) {
  dbConfig.socketPath = process.env.DB_SOCKET_PATH || '/tmp/mysql.sock';
}

const pool = mysql.createPool(dbConfig);

// 데이터베이스 초기화 (테이블 자동 생성)
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // users 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // todos 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        date DATE NOT NULL,
        image_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_date (date),
        INDEX idx_user_date (user_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // goals 테이블 생성
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        is_completed TINYINT(1) NOT NULL DEFAULT 0,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_goal_date (date),
        INDEX idx_goal_user_date (user_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    connection.release();
    console.log('데이터베이스 테이블 초기화 완료');
  } catch (error: any) {
    console.error('데이터베이스 초기화 오류:', error.message);
  }
};

// 데이터베이스 연결 테스트 및 초기화
pool.getConnection()
  .then(async (connection) => {
    console.log('데이터베이스 연결 성공');
    connection.release();
    await initializeDatabase();
  })
  .catch((error) => {
    console.error('데이터베이스 연결 실패:', error.message);
    console.error('오류 코드:', error.code);
    console.error('오류 상세:', error);
    console.error('데이터베이스 설정을 확인해주세요.');
  });

export default pool;