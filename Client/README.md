# DRVT Mall Client

React + Vite 프론트엔드

## 요구 사항

- Node.js 18+

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

```
VITE_API_URL=http://localhost:5000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

> Server(`http://localhost:5000`)가 실행 중이어야 API 연결 상태가 정상으로 표시됩니다.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
Client/
├── public/           # 정적 파일
├── src/
│   ├── components/   # 재사용 컴포넌트
│   ├── hooks/        # 커스텀 훅
│   ├── pages/        # 페이지 컴포넌트
│   ├── services/     # API 호출
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── vite.config.js
└── package.json
```

## API 프록시

개발 모드에서 `/api` 요청은 Vite가 `http://localhost:5000`으로 프록시합니다.
