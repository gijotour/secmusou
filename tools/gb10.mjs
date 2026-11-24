// GB10 (DGX Spark) Qwen3-Coder-Next 80B 호출 헬퍼
// 사용: node tools/gb10.mjs <prompt.txt> <out.txt> [max_tokens]
// 엔드포인트: 환경변수 GB10_LLM_URL, 없으면 tools/local.config.json 의 "gb10Url" (깃에 올리지 않는 로컬 파일)
import fs from 'node:fs';

const [, , promptFile, outFile, maxTok = '6000'] = process.argv;
let ENDPOINT = process.env.GB10_LLM_URL;
if (!ENDPOINT) {
  try { ENDPOINT = JSON.parse(fs.readFileSync(new URL('./local.config.json', import.meta.url), 'utf8')).gb10Url; } catch { /* 없음 */ }
}
if (!ENDPOINT) {
  console.error('GB10 엔드포인트가 없습니다. GB10_LLM_URL 환경변수나 tools/local.config.json {"gb10Url": "http://<host>:8080/v1/chat/completions"} 를 설정하세요.');
  process.exit(2);
}
const prompt = fs.readFileSync(promptFile, 'utf8');

const t0 = Date.now();
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a senior HTML5 game developer and Korean game writer. Output exactly what is asked, no preamble.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: Number(maxTok),
    temperature: 0.7,
  }),
});
const j = await res.json();
if (!res.ok || !j.choices) {
  console.error('GB10 error', res.status, JSON.stringify(j).slice(0, 500));
  process.exit(1);
}
const text = j.choices[0].message.content;
fs.writeFileSync(outFile, text, 'utf8');
const u = j.usage || {};
console.log(`ok ${((Date.now() - t0) / 1000).toFixed(1)}s in=${u.prompt_tokens} out=${u.completion_tokens} -> ${outFile}`);
