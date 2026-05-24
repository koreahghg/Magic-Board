# Vercel 배포 가이드

## 필요한 환경변수

| 변수명 | 설명 |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL Connection String (Pooled) |
| `CRON_SECRET` | Cron 요청 인증 시크릿 (임의의 랜덤 문자열) |

---

## 1. Neon DB 생성

### 1.1 프로젝트 생성

1. [console.neon.tech](https://console.neon.tech) 접속 후 로그인
2. **New Project** 클릭
3. Project name 입력 (예: `magic-board`)
4. Region: **AWS / Asia Pacific (Singapore)** 선택 (한국과 가장 가까움)
5. **Create Project** 클릭

### 1.2 Connection String 복사

1. 프로젝트 대시보드 → **Connection Details** 섹션
2. 연결 방식: **Pooled connection** 탭 선택
   - Serverless 환경(Vercel)에서는 Connection Pooler 사용이 필수
3. `postgresql://USER:PASSWORD@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` 형태의 문자열 복사

### 1.3 DB 스키마 적용

로컬에서 실행:

```bash
# .env 파일에 DATABASE_URL 설정 후
npx prisma migrate dev --name init
```

Vercel 배포 후에는 아래 명령으로 프로덕션 DB에 적용:

```bash
DATABASE_URL="<Neon Connection String>" npx prisma migrate deploy
```

---

## 2. Vercel 프로젝트 연동

### GitHub 연동 (권장)

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 레포지토리 Import
3. Framework Preset: **Next.js** (자동 감지됨)
4. **환경변수는 아직 입력하지 말고** Deploy는 잠시 보류

### CLI 배포

```bash
npm i -g vercel
vercel --prod
```

---

## 3. 환경변수 등록

**Vercel 대시보드 → Project → Settings → Environment Variables**

### DATABASE_URL

- Key: `DATABASE_URL`
- Value: Neon Pooled Connection String
- Environment: `Production`, `Preview`, `Development` 모두 체크

### CRON_SECRET

CRON_SECRET은 Cron 요청 인증에 사용하는 임의의 시크릿 값입니다.

```bash
# 생성 예시 (터미널에서 실행)
openssl rand -hex 32
```

- Key: `CRON_SECRET`
- Value: 위에서 생성한 랜덤 문자열
- Environment: `Production`, `Preview`, `Development` 모두 체크

> 로컬 `.env` 파일에도 동일한 값을 추가해야 로컬에서 `/api/snapshot` 테스트가 가능합니다.

### 환경변수 등록 후 재배포

환경변수 등록 후 반드시 재배포(Redeploy)를 실행해야 적용됩니다.

---

## 4. 배포 후 동작 확인

### 4.1 API 정상 동작 확인

```bash
# 실시간 KBO 순위 크롤링
curl https://<your-app>.vercel.app/api/kbo

# 히스토리 조회
curl "https://<your-app>.vercel.app/api/history?date=2025-05-01"
```

### 4.2 Cron 수동 트리거

```bash
curl -X GET https://<your-app>.vercel.app/api/snapshot \
  -H "Authorization: Bearer <CRON_SECRET>"
```

성공 응답 예시:
```json
{ "id": "clxxx...", "date": "2025-05-24", "createdAt": "2025-05-24T14:30:00.000Z" }
```

데이터 없음 응답 (비시즌 등):
```json
{ "skipped": true, "reason": "경기 데이터 없음" }
```

### 4.3 Vercel Cron Jobs 확인

1. Vercel 대시보드 → Project → **Cron Jobs** 탭
2. 등록된 Job 확인: `GET /api/snapshot` — `30 14 * * *`
3. **Run** 버튼으로 즉시 수동 실행 가능
4. 실행 로그: **Functions** 탭 → `/api/snapshot` 클릭

> Cron은 매일 **14:30 UTC (23:30 KST)** 에 자동 실행됩니다.
> Vercel Hobby 플랜은 Cron을 하루 1회까지 지원합니다.

### 4.4 DB 데이터 확인 (Prisma Studio)

```bash
# 로컬에서 실행
npx prisma studio
```

브라우저에서 `http://localhost:5555` 접속 → `Snapshot` 테이블 확인

---

## 배포 체크리스트

- [ ] Neon DB 생성 및 Pooled Connection String 확보
- [ ] 로컬 `.env` 파일에 `DATABASE_URL`, `CRON_SECRET` 설정
- [ ] `npx prisma migrate dev --name init` 실행 (로컬 or 프로덕션 DB)
- [ ] Vercel 프로젝트 생성 및 GitHub 연동
- [ ] Vercel 환경변수 `DATABASE_URL` 등록
- [ ] Vercel 환경변수 `CRON_SECRET` 등록
- [ ] Vercel 재배포(Redeploy) 실행
- [ ] `/api/kbo` 응답 확인
- [ ] `Authorization` 헤더로 `/api/snapshot` 수동 호출 → DB 저장 확인
- [ ] Vercel Cron Jobs 탭에서 스케줄 등록 확인
