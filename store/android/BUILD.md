# 보안무쌍 안드로이드 앱 만들기 (TWA)

플레이 스토어 앱은 게임을 새로 만든 것이 아니라 **gijo.co.kr/games/secmusou/ 를 띄우는 껍데기(Trusted Web Activity)** 입니다.
게임을 고쳐 저장소 `main` 에 올리면 앱도 다음 실행부터 바뀝니다. 앱을 다시 올릴 필요가 없습니다.
앱 껍데기를 바꿀 때(이름·아이콘·방향 등)만 아래 순서로 다시 빌드하고 `appVersionCode` 를 1 올립니다.

| 항목 | 값 |
|---|---|
| 패키지 이름 | `kr.co.gijo.secmusou` (한 번 올리면 바꿀 수 없음) |
| 시작 주소 | `https://gijo.co.kr/games/secmusou/` (Labs `netlify.toml` 이 GitHub Pages 를 대리 전송) |
| 화면 | 전체 화면 · 가로 고정 |
| 알림 | 쓰지 않음(권한 요청 없음) |

## 1. 준비 (처음 한 번)

- Node.js 는 있습니다. Bubblewrap 이 처음 실행될 때 **JDK 17 과 Android SDK 를 내려받습니다(합쳐 약 1GB 안팎)**.
- `npm i -g @bubblewrap/cli`

## 2. 업로드 키 만들기 (사장님이 직접 — 비밀번호를 정하는 단계)

```powershell
cd D:\game\store\android
keytool -genkeypair -v -keystore secmusou-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

- 비밀번호는 사장님만 아는 곳(비밀번호 관리자)에 적어 두세요. 대화창이나 코드에 쓰지 않습니다.
- `secmusou-upload.keystore` 는 `.gitignore` 로 저장소에 올라가지 않습니다. **따로 백업**하세요. 잃어버리면 구글에 업로드 키 재설정을 요청해야 합니다.
- 플레이 콘솔의 「Play 앱 서명」을 켜 두면(기본값) 실제 배포 서명 키는 구글이 보관합니다.

## 3. 빌드

```powershell
cd D:\game\store\android
bubblewrap update   # twa-manifest.json 으로 안드로이드 프로젝트를 만든다
bubblewrap build    # 키 비밀번호를 물어본다 → app-release-bundle.aab 생성
```

`app-release-bundle.aab` 를 플레이 콘솔 → 테스트(내부 테스트) → 새 버전 만들기에 올립니다.

## 4. 도메인 연결 (주소창 없이 전체 화면으로 뜨게)

앱이 gijo.co.kr 의 주인임을 증명해야 주소창이 사라집니다.

1. 플레이 콘솔 → 앱 → 설정 → **앱 무결성** → 「앱 서명」에서 **SHA-256 인증서 지문** 두 개(앱 서명 키, 업로드 키)를 복사합니다.
2. Labs 저장소에 `public/.well-known/assetlinks.json` 을 만듭니다:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "kr.co.gijo.secmusou",
    "sha256_cert_fingerprints": ["앱 서명 키 지문", "업로드 키 지문"]
  }
}]
```

3. Labs 를 배포한 뒤 https://gijo.co.kr/.well-known/assetlinks.json 이 열리는지 확인합니다.
   구글 확인 도구: https://developers.google.com/digital-asset-links/tools/generator

## 5. 출시 전 휴대폰 확인

- 내부 테스트로 설치 → 주소창 없이 가로 전체 화면으로 뜨는지
- 터치 조작, 소리, 비행기 모드에서 다시 열기(오프라인 실행)
- 뒤로 가기 버튼이 게임 안 메뉴로 가는지, 앱이 바로 꺼지지 않는지
