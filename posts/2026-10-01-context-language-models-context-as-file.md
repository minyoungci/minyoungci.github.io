---
title: "컨텍스트를 파일로 고치면 점수가 오른다? CLM의 두 번째 성적표는 FLOPs와 쓰기 권한"
date: "2026-10-01"
tag: "AI"
summary: "UW·Meta의 Context Language Models는 컨텍스트를 Bash로 편집 가능한 파일로 두고 제로샷에서 BrowseComp-Plus 정확도 11.4%↑·FLOPs 21.5%↓를 보고한다. 두 번째 성적표는 prefix-reuse FLOPs, SCR, 쓰기 가능 컨텍스트의 안전성이다."
image: "/images/posts/2026-10-01-context-language-models-context-as-file/cover.png"
---

언어 모델 에이전트에게 긴 과제를 맡기면, 컨텍스트는 금방 찬다. 지금까지의 답은 대개 하네스였다. 길이가 임계를 넘으면 요약하고, 도구로 일부를 접고, 미리 정한 행동만 허용하는 식이다. 모델은 다음 토큰을 붙이고, 컨텍스트가 어떻게 남을지는 바깥 규칙이 정했다.

2026년 9월 29일 arXiv에 오른 논문 Context Language Models(arXiv:2609.37725)는 그 경계를 뒤집는다. Rulin Shao·Shannon Zejiang Shen·Junjie Oscar Yin·Yuetai Li·Minheng Wang·Hamish Ivison·Radha Poovendran·Nathan Lambert·Teng Xiao·Mike Lewis·Wen-tau Yih·Luke Zettlemoyer·Pang Wei Koh(University of Washington / Meta Superintelligence Labs 등)는 컨텍스트를 파일로 두고, 모델이 Bash로 자유롭게 고치게 한다. 수정은 바로 라이브 컨텍스트에 동기화된다. 헤드라인은 "컨텍스트를 파일로 다루면 점수가 오르고 계산도 줄어든다" 쪽에 가깝다. 이 지면이 확인할 것은 그 한 줄이 아니다. BrowseComp-Plus에서 Codex식 요약 대비 정확도 11.4% 상승·prefix-reuse FLOPs 21.5% 감소(CLM 59.4%, Qwen3.6-27B·32K), EdgeBench-10에서 점수 5% 상승·FLOPs 59% 감소(44.6 / 179 PFLOPs 대 요약 42.3 / 437), Software World에서 동일 예산으로 65% 더 큰 속도 향상, Suffix Cache Reuse의 서버 측 약 35% 절감, 그리고 Discussion이 적는 쓰기 가능 컨텍스트의 새 공격면이다다.

> **출처:** arXiv abs(`https://arxiv.org/abs/2609.37725`)와 PDF(`https://arxiv.org/pdf/2609.37725`)를 직접 열어 재구성했다. Abstract·§1·§3–§6·Table 1–2·Figure 5·8·11의 수치는 PDF 본문 기준이다. 저자·소속·제출일(2026-09-29)·코드(`https://github.com/facebookresearch/context-language-models`)는 arXiv 메타데이터와 PDF 표지를 대조했다. 이 지면은 CLM을 재학습하거나 BrowseComp-Plus·EdgeBench를 재평가하지 않았다. 채택 수치는 원문 표와 본문 문장에 있는 것만이다. Gmail alphaXiv "Weekly Paper Recs"(contact@alphaxiv.org, 2026-09-30)의 트렌딩 목록에는 CLM이 실리지 않았다. 스파크만 참고했고, 1차 출처는 arXiv PDF다.

![아침 빛이 드는 빈 책상. 펼친 노트와 부드럽게 빛나는 모니터. 사람 얼굴·텍스트·로고 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/cover.png)

## 1. 전제, 하네스가 정하던 컨텍스트

논문의 출발점은 단순하다. 컨텍스트는 모델이 시간에 걸쳐 정보를 붙잡는 기반인데, 그 관리는 전통적으로 LM의 고유 능력이 아니었다. Cursor·Codex·Terminus2처럼 임계에서 압축하는 하네스, Self-Compact·ACM·Sculptor처럼 미리 정한 도구만 여는 행동 기반 방식, Recursive Language Models처럼 긴 입력을 REPL 변수로 두는 읽기 중심 설계가 있었다.

CLM은 그 스펙트럼의 끝으로 간다. 표준 LM의 전이 \(c_{t+1}=c_t \oplus f^{\mathrm{LM}}_\theta(c_t)\) 대신, 모델이 다음 컨텍스트 자체를 만든다. \(c_{t+1}=f^{\mathrm{CLM}}_\theta(c_t)\). 구현은 컨텍스트를 저장 공간의 파일로 미러링하고, 경로를 시스템 프롬프트에 넣는다. 모델은 Bash로 파일을 고치고, 그 수정은 다음 턴의 라이브 컨텍스트로 동기화된다. 파일을 건드리지 않으면 기본값은 토큰 추가다. 다중 에이전트는 컨텍스트 파일을 여러 개 두고 각 LLM 서버와 맞추면 된다.

![펼친 원고 더미를 페이지 단위로 다시 쓰는 빈 책상. 사람·텍스트 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/context-as-file.png)

저자들이 The Bitter Lesson을 인용하는 대목은 이 설계의 선언이다. 사람이 정한 요약·오프로딩 레시피보다, 모델이 검색하고 배우는 전략이 더 멀리 갈 수 있다는 입장이다. 이 지면은 그 철학을 채택하지 않는다. 채택하는 것은 PDF에 적힌 실험 숫자와, 쓰기 권한을 열었을 때 논문이 스스로 적는 한계다.

## 2. ContextBench, 고정 전략이 먼저 깨지는 자리

긴 벤치에 들어가기 전, 논문은 ContextBench로 진단을 연다. Needle Retention(선택적 원문 보존), Sudoku Sketchpad(자리 단위 현장 수정), KV Store·Log Triage(대량 오프로딩·검색) 네 과제다. 컨텍스트 한도 32K에서 압력(입력량/한도)을 최대 24배까지 올린다. 목표는 추론·지식과 분리해 컨텍스트 관리만 보는 것이다.

결과 그림은 고정 전략의 균열을 보여 준다. 요약 압축은 Needle·Sudoku에서 정보를 잃거나 환각할 수 있다. 현장 편집이 없으면 Sudoku 보드를 매 수정마다 통째로 다시 써야 한다. 코딩 도구로 값을 디스크에 빼도, 라이브 컨텍스트에서 제때 비우지 못하면 창은 찬다. 논문은 기존 방법이 이 단순 과제에서도 완벽하지 않다고 적는다. CLM을 포함한 비교는 Figure 2에 있다. 이 지면은 원 도판을 재측정하지 않았고, "고정 전략이 압력 아래에서 실패한다"는 PDF의 진단을 옮긴다.

## 3. 제로샷 코딩·딥리서치, 첫 성적표

![잠긴 서류함 워크스테이션과 열린 책상 워크스테이션이 나란히 있는 장면. 사람·텍스트 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/harness-vs-clm.png)

§5.1.1은 Qwen3.6-27B, 컨텍스트 32K, 100턴 상한으로 TerminalBench 2.1, TBLite, BrowseComp-Plus를 돌린다. 비교군은 MEM1, Self-Compact, ACM, RLM, Codex식 요약이며, 모두 Mini-SWE-Agent 백본을 공유하고 학습 없이 제로샷이다. 비용 축은 prefix-reuse FLOPs다. 중간 편집이 나면 접두 불일치 이후를 다시 prefill해야 하는 표준 서빙 비용을 궤적 단위로 모은 값이다.

BrowseComp-Plus에서 CLM은 59.4%다. 가장 강한 베이스라인인 Codex식 요약보다 상대 기준 정확도가 11.4% 높고, prefix-reuse FLOPs는 21.5% 적다. MEM1 대비로는 FLOPs가 28.9% 적다. TerminalBench 2.1에서는 최강 베이스라인과 정확도를 맞추면서 FLOPs는 요약의 70%(29.5% 절감)다. TBLite에서는 73.7% 대 요약 67.0%이며, FLOPs는 요약의 91%다. Figure 5의 Pareto 경계에 CLM이 올라간다고 논문은 적는다.

수학 최적화 Table 1은 Claude 4.6 Sonnet·32K·최대 100회 또는 5시간이다. Circle packing에서 CLM 2.618(서브에이전트 2.636) 대 OpenEvolve 2.541, Heilbronn에서 0.03653 대 0.03127, min-max/min-dist에서 0.07758 대 0.07690, Erdős overlap에서 0.38094 대 0.38123(낮을수록 좋음)이다. 전용 진화 워크플로보다 일반 에이전트에 컨텍스트 쓰기 권한을 준 쪽이 네 과제 모두에서 더 나은 best-of-run을 냈다는 주장이다.

## 4. 긴 지평, EdgeBench와 Software World

![여섯 개의 빈 책상이 원형으로 놓인 채광 좋은 로프트. 사람·텍스트 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/long-horizon-swarm.png)

열린 발견(open discovery) 과제로 지평을 늘리면 그림이 더 길어진다. EdgeBench-10은 저장소 하나를 최대 12시간 최적화하는 10과제 부분집합이다. Qwen3.6-27B·32K에서 CLM은 점수 44.6에 시행당 prefix-reuse 179 PFLOPs다. Codex식 요약은 42.3 / 437이다. 점수는 약 5% 높고, FLOPs는 약 59% 적다. 서브에이전트 변형은 44.2 / 181로, 단일 저장소에서는 추가 이득이 작다. Claude 4.6 Sonnet에서는 CLM 51.0·서브에이전트 50.4, 요약 42.3이다.

Software World는 여섯 에이전트가 상호 의존 저장소를 24시간 이상 공동 최적화하고, 보지 못한 다운스트림 패키지 네 개·17개 평가 과제의 기하평균 속도 향상으로 채점한다. GPT-5.6-Sol·272K 예산이다. 동일 지출의 요약 기반 스웜 대비, CLM은 초기 릴리스 대비 다운스트림 속도 향상이 65% 더 크다고 적힌다. 숫자 출처는 Figure 8과 §5.1.2다. 이 지면은 스웜을 재실행하지 않았다.

## 5. 학습 축, 스킬 진화와 온라인 RL

컨텍스트 관리를 모델 고유 행동으로 두면, 지시·스킬 문서·강화학습으로 더 배울 수 있다고 논문은 본다. 한 문장 지시만으로 압축 시점, 의미 경계, 백업 행동을 바꿀 수 있다(Figure 9). ContextBench의 텍스트 진화 루프에서는 held-out 정확도가 최대 +35.9포인트 오르면서 계산도 줄일 수 있다고 Abstract가 적는다. Assisted evolution에서 KV Store held-out은 38.3%→74.2%로 오른다(Appendix F).

강화학습은 Qwen3.5-9B를 OpenResearcher로 학습하고 BrowseComp-Plus로 평가한다. Table 2 기준 CLM은 28.8%→42.5%(상대 +47.6%), PFLOPs/Q는 1.52→1.34다. 같은 레시피의 Summary는 34.7%→42.1%, 4.01→2.19 PFLOPs/Q다. 학습 후 CLM이 Summary보다 0.4포인트 높으면서 FLOPs는 더 낮다(1.34 대 2.19). Abstract의 "12% fewer FLOPs"는 CLM의 학습 전후 FLOPs 감소(1.52→1.34)와 맞물린 서술이다. 성공한 궤적 안에서만 낮은 prefix-reuse FLOPs에 가산점을 주는 success-gated efficiency advantage(식 6)가 핵심 장치다.

## 6. Suffix Cache Reuse, 두 번째 성적표의 서빙 층

![데이터센터 통로 유리 랙과 분기된 광섬유 트레이. 사람·텍스트·라벨 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/suffix-cache.png)

중간 편집은 표준 prefix cache를 깨뜨린다. 첫 불일치 이후는 다시 prefill된다. 논문은 그래서 궤적 비용을 prefix-reuse FLOPs로 먼저 재고, 그다음 Suffix Cache Reuse(SCR)를 제안한다. 편집으로 \(B\)가 \(B'\)로 바뀌어도 살아남은 접미 \(C\)의 캐시를 재사용하고, 새로 넣은 구간만 prefill한다. 근사이며, 재배치 span 수 \(K=6\)이 상한이다.

BrowseComp-Plus·Qwen3.6-27B에서 SCR은 표준 SGLang 대비 서버 측 계산을 약 35% 줄이면서 성능을 맞춘다. SCR의 경험적 prefix-reuse FLOPs는 SGLang의 65.0%다(Figure 11). SCR은 CLM 전용이 아니다. 이전 턴의 reasoning 토큰을 채팅 템플릿이 지울 때도 접미 재사용이 도움이 된다. 절감의 상당 부분은 그 일반 경로에서 나온다(Appendix B). 이 지면이 붙잡는 긴장은 여기다. "파일로 고치면 이긴다"만 남기면, prefix-reuse라는 비용 정의와 SCR이라는 근사 재사용, 그리고 모델이 컨텍스트를 쓸 수 있을 때의 안전 논의가 지워진다.

## 7. 안전, 쓰기 가능 컨텍스트가 여는 채널

![석양 도서관 복도에서 살짝 열린 유리 장. 사람·텍스트 없음.](/images/posts/2026-10-01-context-language-models-context-as-file/safety-writable.png)

§6 Discussion은 이득과 위험을 한 문단으로 적는다. 라이브 컨텍스트에 쓰기 권한을 주면 유연한 관리가 가능하지만, 프롬프트 주입이나 모델이 스스로 쓴 지시가 턴을 넘어 남는 새 채널이 된다. 논문은 압축 요약에 무단 지시가 들어가 이후 행동에 영향을 준 사례를 OpenAI(2026b)로 인용한다. 방어를 이 논문이 풀지는 않는다. 미래 과제로 남긴다. 이 지면은 그 한계 문장을 헤드라인과 같은 층에 둔다.

질적 사례(Figure 3)도 같은 동전의 양면이다. CLM은 멀티에이전트 스코어보드를 컨텍스트 안에서 163회 현장 수정하며 6–8K 토큰을 유지하고, notes 역할을 만들고, compact_turns 같은 헬퍼를 정의해 37회 재사용한다. 창의적 전략이 나온다는 증거이면서, 모델이 컨텍스트 문법을 스스로 다시 쓴다는 뜻이기도 하다. 그 권한이 곧 성적표의 일부다.

## 비유로 이해하기

긴 수사 기록을 수첩 한 권에만 계속 이어 쓰면, 페이지가 가득 찬 뒤로는 앞장을 찢거나 요약해 끼워 넣는 수밖에 없다. 기존 하네스는 "몇 장 넘으면 요약본으로 갈아끼우라"는 사무실 규정에 가깝다. CLM은 수첩 자체를 편집 가능한 파일로 주고, 담당자가 Bash로 중간을 지우고·옮기고·역할 칸을 새로 만들게 하는 일에 가깝다.

prefix-reuse FLOPs는 그 수첩을 복사기로 다시 찍을 때 드는 비용이다. 중간을 고치면 그 뒤 페이지는 캐시가 깨져 다시 찍어야 한다. SCR은 "바뀐 중간만 다시 찍고, 뒤쪽 원본 필름은 재사용한다"는 근사다. 쓰기 권한의 안전 문제는, 수첩에 누군가 몰래 지시 한 줄을 끼워 넣으면 다음 교대도 그 줄을 진실처럼 읽는 위험에 가깝다. 점수가 오른 성적표와, 다시 찍는 비용과, 열린 수첩의 위험이 같은 논문에 있다.

## 내가 보는 의미

1. **헤드라인은 "컨텍스트를 파일로 두면 점수↑·비용↓", 두 번째 성적표는 prefix-reuse FLOPs·SCR·쓰기 권한이다.** BrowseComp-Plus 59.4%·11.4%/21.5%, EdgeBench 44.6/179 대 42.3/437, Software World +65%만 남기면 Discussion의 주입 채널이 지워진다.
2. **제로샷 이득은 모델 규모에 기대 있다.** Qwen3.6-27B에서 Pareto 전면에 서는 그림과, Qwen3.5-9B가 편집을 덜 하고 학습 전에는 요약보다 뒤처지던 그림(Appendix F)이 같이 있다.
3. **학습 축은 하네스 밖의 스킬이다.** 한 문장 조향, +35.9포인트급 스킬 진화, 28.8%→42.5% RL은 "관리 규칙을 모델이 흡수한다"는 방향을 숫자로 보여 준다. 이 지면은 그 루프를 재실행하지 않았다.
4. **SCR은 CLM 전용 마법이 아니다.** reasoning 토큰 제거 경로에서도 절감이 나오고, \(K\)로 근사량을 제한한다. 서버 측 35%·SGLang 대비 65% FLOPs는 Figure 11 기준이다.
5. **존재 증명과 벤치 순위를 섞어 읽지 말아야 한다.** 과제·모델·예산·턴 상한이 실험마다 다르다. 1차 출처는 2609.37725 PDF이며, alphaXiv 트렌딩 등수는 없다.

## 확인 기록

### 높은 확신도
- arXiv:2609.37725(2026-09-29) PDF에서 제목, 저자·소속, 코드 URL, CLM 정의(컨텍스트-as-file·Bash 동기화), ContextBench 네 과제, BrowseComp-Plus 59.4%·요약 대비 +11.4%·FLOPs −21.5%, TB2.1 FLOPs 70%(−29.5%), TBLite 73.7% 대 67.0%, EdgeBench-10 44.6/179 대 42.3/437·점수 +5%·FLOPs −59%, Software World 동일 예산 +65% 속도 향상, Table 1 수학 네 과제, Table 2 RL 28.8%→42.5%·1.34 대 Summary 42.1%/2.19, 스킬 진화 held-out 최대 +35.9, SCR 서버 측 약 35%·BCP에서 SGLang FLOPs의 65.0%, Discussion의 OpenAI 2026b 인용 안전 노트를 확인했다.
- 모델명 Qwen3.6-27B·Qwen3.5-9B·Claude 4.6 Sonnet·GPT-5.6-Sol, 컨텍스트 32K(및 Software World 272K)는 본문·표와 맞췄다.

### 낮은 확신도
- Figure 2·5·8·9·10·11의 세부 점·오차 막대는 본문 서술·캡션에 의존하며, 이 지면이 원 도판을 재측정하지 않았다.
- "11.4% higher"·"5% higher"·"65% greater"·"47.6% relative"·"35%" 등은 원문이 상대/절대 표현을 섞어 쓰므로, 각 문장의 비교 기준(요약·SGLang·학습 전)을 본문 문맥에 묶어 옮겼다. 독립 재계산은 없다.
- Qualitative Figure 3의 163회 편집·compact_turns 37회 등은 본문 사례 서술이며, 원시 궤적 로그는 미열람이다.
- alphaXiv 주간 메일(2026-09-30)은 CLM 미수록만 확인했고, 다른 추천 순위를 본문 주장에 쓰지 않았다.

### 채택하지 않음
- CLM이 모든 긴 지평 과제에서 무조건부 SOTA라는 주장(본문은 과제·예산별로 보고).
- SCR이 정확한 재계산과 동일하다는 해석(본문은 근사·\(K\) 상한을 명시).
- 이 지면이 BrowseComp-Plus·EdgeBench·Software World를 재실행했다는 서술(원문 미실행).
- alphaXiv 트렌딩에 CLM이 올랐다는 서술(메일 목록 미수록).

## 참고 문헌

1. Rulin Shao, Shannon Zejiang Shen, Junjie Oscar Yin, Yuetai Li, Minheng Wang, Hamish Ivison, Radha Poovendran, Nathan Lambert, Teng Xiao, Mike Lewis, Wen-tau Yih, Luke Zettlemoyer, Pang Wei Koh. Context Language Models. arXiv:2609.37725, 2026. https://arxiv.org/abs/2609.37725 · PDF https://arxiv.org/pdf/2609.37725 · Code https://github.com/facebookresearch/context-language-models
2. OpenAI. Self-generated prompt injections in compaction summaries, September 2026b. https://alignment.openai.com/misalignment-reports/self-generated-prompt-injections-in-compaction-summaries/ (논문 Discussion 인용 범위)
3. (선택) alphaXiv "Weekly Paper Recs", contact@alphaxiv.org, Gmail 수신 2026-09-30. 스파크만 사용, CLM 미수록, 본문 수치의 1차 출처 아님.
