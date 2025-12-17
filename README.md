# Schedule Web

스케줄 관리 웹 애플리케이션 (React + Express + MySQL)

## 프로젝트 구조

```
schedule-web/
├── client/          # React 프론트엔드
├── server/          # Express 백엔드
└── .env.example     # 환경 변수 템플릿
```

## 시작하기

### 1. 환경 변수 설정

```bash
# 서버 디렉토리에서
cd server
cp ../.env.example .env
# .env 파일을 열어서 실제 값으로 수정
```

### 2. 의존성 설치

```bash
# 루트 디렉토리
npm install

# 클라이언트
cd client
npm install

# 서버
cd ../server
npm install
```

### 3. 데이터베이스 설정

```bash
cd server
# MySQL 데이터베이스 생성 및 초기화
mysql -u root -p < init_database.sql
```

### 4. 실행

```bash
# 서버 실행 (터미널 1)
cd server
npm run dev

# 클라이언트 실행 (터미널 2)
cd client
npm start
```

## 하이브리드 앱 빌드

### Android

```bash
cd client
npm run build
npm run cap:sync
npm run cap:open:android
```

### iOS

```bash
cd client
npm run build
npm run cap:sync
npm run cap:open:ios
```
