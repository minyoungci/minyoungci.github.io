# SCRATCHPAD - 개발 메모

## Google Indexing API 자동화 설정

### 현재 상태
- [x] Google Cloud 프로젝트 설정
- [x] Indexing API 활성화
- [x] 서비스 계정 생성 및 JSON 키 다운로드
- [x] Search Console에 서비스 계정 추가 (소유자 권한)
- [x] `npm run indexing` 스크립트 작성
- [ ] 매일 자동 실행 설정

---

## 매일 자동 실행 설정 (GitHub Actions)

### 1단계: GitHub Secrets에 API 키 추가

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. Name: `GOOGLE_INDEXING_KEY`
4. Secret: `google-indexing-key.json` 파일 **전체 내용** 붙여넣기
5. **Add secret** 클릭

### 2단계: GitHub Actions 워크플로우 생성

`.github/workflows/daily-indexing.yml` 파일 생성:

```yaml
name: Daily Indexing

on:
  schedule:
    # 매일 한국시간 오전 9시 (UTC 00:00)
    - cron: '0 0 * * *'
  workflow_dispatch: # 수동 실행 가능

jobs:
  indexing:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Create Google API key file
        run: echo '${{ secrets.GOOGLE_INDEXING_KEY }}' > google-indexing-key.json

      - name: Run indexing
        run: npm run indexing

      - name: Cleanup
        run: rm -f google-indexing-key.json
```

### 3단계: 워크플로우 활성화

1. 위 파일을 저장하고 GitHub에 푸시
2. GitHub 저장소 → **Actions** 탭에서 워크플로우 확인
3. 수동 테스트: **Run workflow** 버튼 클릭

---

## 수동 실행 방법

```bash
# 모든 포스트 색인 요청
npm run indexing

# 특정 URL만 요청
npm run indexing -- --url https://minyoungci.github.io/새포스트/
```

---

## 참고 사항

- **API 할당량**: 하루 200개 URL 요청 가능
- **색인 반영 시간**: 보통 1-2일 소요
- **Search Console 확인**: URL 검사 도구로 색인 상태 확인 가능

---

## 문제 해결

### "Permission denied" 오류
- Search Console에서 서비스 계정 이메일이 **소유자** 권한인지 확인

### "Quota exceeded" 오류
- 하루 200개 제한 초과 → 다음 날 다시 시도

### JSON 키 파일 오류
- `google-indexing-key.json` 파일이 프로젝트 루트에 있는지 확인
- JSON 형식이 올바른지 확인
