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

// 데이터베이스 연결 테스트
pool.getConnection()
  .then((connection) => {
    console.log('데이터베이스 연결 성공');
    connection.release();
  })
  .catch((error) => {
    console.error('데이터베이스 연결 실패:', error.message);
    console.error('오류 코드:', error.code);
    console.error('오류 상세:', error);
    console.error('데이터베이스 설정을 확인해주세요.');
  });

export default pool;