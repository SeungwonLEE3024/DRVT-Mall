# DRVT Mall Server

Node.js + Express + MongoDB API 서버

## 요구 사항

- Node.js 18+
- MongoDB (로컬 또는 MongoDB Atlas)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

`.env` 파일에서 MongoDB 연결 URI를 설정하세요.

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/drvt-mall
```

### 3. 서버 실행

개발 모드 (nodemon):

```bash
npm run dev
```

프로덕션 모드:

```bash
npm start
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | API 환영 메시지 |
| GET | `/api/health` | 서버 및 DB 상태 확인 |

## 프로젝트 구조

```
Server/
├── src/
│   ├── config/         # DB 등 설정
│   ├── controllers/    # 요청 처리 로직
│   ├── middleware/     # 미들웨어 (에러 처리 등)
│   ├── models/         # Mongoose 모델
│   ├── routes/         # API 라우트
│   ├── app.js          # Express 앱 설정
│   └── index.js        # 서버 진입점
├── .env.example
├── package.json
└── README.md
```
