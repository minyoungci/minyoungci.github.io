---
title: "8B 평균 50.7, BrowseComp-ZH +15.2? IterSynth가 보여주는 Planner·Synthesizer 성적표"
date: "2026-09-28"
tag: "AI"
summary: "ZJU·Tencent IterSynth-8B는 다섯 deep-search 벤치 평균 50.7로 ≤8B 최강 대비 +4.2를 보고한다. ReAct 64K 미완료 59%와 RDPO 역할별 이점이 헤드라인을 완성한다."
image: "/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/cover.png"
---

긴 검색 에이전트는 질문을 쪼개고, 검색을 내고, 증거를 모아 답을 써야 한다. 많은 오픈웨이트 시스템은 그 일을 ReAct식 한 정책·한 컨텍스트로 돌린다. 검색 이력이 쌓일수록 역할은 뒤섞이고, 쓸 만한 증거는 노이즈에 가린다.

Zhejiang University와 Tencent의 Xingyu Wu·Yuchen Yan·Zhengxi Lu·Siqi Chen·Xin Zhang·Aiting Liu·Chao Deng·Jie Liu·Jin Ma·Jian Shao·Jun Xiao·Yongliang Shen이 2026년 9월 24일 arXiv에 올린 IterSynth: Rethinking Deep Search Agents via Role-Decoupled Iterative Synthesis(arXiv:2609.29444)는 그 병목을 Planner와 Synthesizer의 교대, 그리고 요약 상태를 검색의 영속 상태로 두는 설계로 겨냥한다. 헤드라인은 “IterSynth-8B 평균 50.7, ≤8B 최강 대비 +4.2”에 가깝다. 이 지면이 확인할 것은 그 한 줄이 아니다. 벤치별 30.9 / 55.4 / 55.3 / 66.0 / 46.0, BrowseComp-ZH에서 소형 에이전트 대비 +15.2, SFT 44.1→GRPO 48.9→RDPO 50.7, 역할 교체 시 −17.4 / −41.1, 프롬프트만으로 Claude-4.5-Opus 평균 66.1, 그리고 Appendix H의 ReAct 64K 미완료 59% 초과다.

> **출처:** arXiv abs(`https://arxiv.org/abs/2609.29444`)와 HTML(`https://arxiv.org/html/2609.29444v1`)을 직접 열어 재구성했다. Abstract·§1·§3–§5·Table 1–3·Appendix H의 수치는 HTML 기준이다. 저자·소속(Zhejiang University / Tencent)과 코드(`https://github.com/Tencent/IterSynth`)는 arXiv 메타데이터·표지를 대조했다. 이 지면은 IterSynth-8B를 재학습하거나 BrowseComp 등을 재평가하지 않았다. 채택 수치는 원문 표와 본문 문장에 있는 것만이다.

![새벽빛이 드는 빈 연구 책상. 왼쪽엔 빈 노트, 오른쪽엔 닫힌 폴더와 모니터의 부드러운 빛만 있다. 사람 얼굴·텍스트·로고 없음.](/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/cover.png)

## 1. 전제, 역할 결합과 컨텍스트 퇴적

Deep search는 수동 검색을 넘어 지식을 능동적으로 쌓는 일이다. 복잡한 질문이 오면 에이전트는 문제를 분해하고, 검색을 내고, 증거를 읽고, 정보 필요를 다시 잡고, 근거 있는 답을 써야 한다.

최근 오픈웨이트 에이전트는 대개 ReAct식 레시피를 따른다. 검색·추론 궤적에 SFT를 걸고, 결과 기반 RL이나 preference로 다듬는다. 그래도 한 정책이 추론·검색·종합을 한 줄로 밀어 가는 경우가 많다.

논문이 짚는 균열은 두 가지다. 첫째는 역할 결합이다. 계획, 질의 작성, 증거 선별, 공백 찾기, 충돌 해소, 최종 종합을 한 구분 없는 단일 정책에 맡기면 조기 종료, 중복 검색, 얕은 증거 사용이 나온다. 둘째는 컨텍스트 퇴적이다. 검색문이 쌓이고 중간 생각과 부분 결론이 붙으면, 쓸 만한 증거는 찾기 어려워지고 초반 실수가 이후 결정으로 번진다. Appendix H는 64K 컨텍스트에서도 BrowseComp의 ReAct 궤적 중 59% 초과가 종료 전에 컨텍스트를 소진한다고 적는다.

멀티에이전트는 역할을 모델마다 나누지만 추론 비용과 조율 부담이 커진다. 요약 기반 시스템은 이력을 압축하지만, 요약이 검색 정책 밖의 보조 모듈로 남는 경우가 많다. IterSynth는 한 공유 정책 안에서 역할 분리와 워크스페이스 재구성을 같이 가져가겠다는 제안이다.

## 2. IterSynth 설계, Planner와 Synthesizer의 교대

![서로 마주 본 빈 워크스테이션 두 대. 한쪽은 빈 플래너, 다른 쪽은 정리된 서류 더미. 사람·텍스트 없음.](/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/planner-synthesizer-loop.png)

각 반복에서 같은 LLM 정책이 두 역할로 교대한다. Planner는 원래 질문과 현재 전역 요약만 보고, 다음 검색 질의를 내거나 최종 답으로 종료한다. Synthesizer는 검색으로 돌아온 증거를 읽고, 쓸모 있는 발견을 넣고, 모순을 정리하고, 노이즈를 걸러 요약을 갱신한다. Synthesizer는 질의를 내거나 최종 답을 쓰지 못한다.

상태는 \(s_t=(q,M_t)\)다. \(q\)는 질문, \(M_t\)는 지금까지 모은 증거 요약이다. Planner는 전체 이력 대신 이 압축 상태만 본다. 검색이 나오면 환경이 문서를 반환하고, Synthesizer가 \(M_{t+1}\)을 만든다. 다음 반복의 활성 컨텍스트는 \((q,M_{t+1})\)로 다시 조립된다. 요약은 수동 압축물이 아니라 검색의 영속 상태가 된다.

역할은 프롬프트와 정보 접근, 허용 행동으로만 갈라진다. 파라미터는 하나다. 멀티에이전트의 전문화 이득과 요약 에이전트의 컨텍스트 제어를, 모델 수를 늘리지 않고 묶겠다는 그림이다.

## 3. 학습 레시피, SFT 약 10K와 RDPO

백본은 Qwen3-8B다. 1단계는 콜드스타트 SFT다. 공개 deep-search 데이터와 합성 실세계 질문으로, 프론티어 모델(Qwen3.5-397B-A17B)이 라이브 검색 환경에서 Planner–Synthesizer 궤적을 굴린다. 형식 수리·환각 제거·정답 종료 필터를 거친 뒤 약 10K 고품질 궤적이 남는다. 궤적당 평균 4.37회 교대이며, 턴별 Planner·Synthesizer 응답을 독립 지도 목표로 펼치면 약 87.4K 샘플이 된다.

2단계는 Role-Decoupled Policy Optimization(RDPO)이다. 쿼리마다 여러 롤아웃을 돌리고, 각 궤적의 턴을 역할별 풀로 나눈다. 보상은 최종 정답 신호 \(r_{\text{acc}}\)와 턴별 rubric 점수의 합이다. rubric은 Planner·Synthesizer 각각 다섯 차원이며, LLM judge가 채점한다. 이점은 역할별 풀 안에서만 정규화한다. 같은 composite reward를 쓰더라도 역할을 섞어 정규화하면(w/o RD) 신호가 얽힌다.

RL 데이터는 SFT 체크포인트로 쿼리당 다섯 번 굴려, 정확히 한두 번만 맞춘 중간 난이도 약 1,000 쿼리를 고른다. 학습 라운드 상한은 30, 평가 상한은 50이다. 도구는 SerpAPI 검색과 URL 조건 요약 브라우저다. RL 중에는 캐시 검색, 평가 때는 라이브 도구다.

SFT만으로 형식은 배우지만, 언제 검색할지·무엇을 남길지·두 역할이 어떻게 맞물릴지는 결과 최적화로 밀어 올려야 한다고 논문은 본다. RDPO가 그 자리를 맡는다. α=0.5가 메인 설정이고, Appendix G는 α=0.3에서 평균 46.6, α=0.7에서 49.0으로, 0.5의 50.7이 꼭짓점이라고 보고한다.

## 4. 메인 성적표, IterSynth-8B 평균 50.7

![빈 점수 카드가 실험대 위에 부드러운 호를 그리며 쌓여 있다. 숫자·글자·사람 없음.](/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/scorecard-50-7.png)

Table 1 기준으로 IterSynth-8B는 다섯 장기 deep-search 벤치 평균 50.7이다. BrowseComp 30.9, BrowseComp-ZH 55.4, GAIA-text-only 55.3, xBench-DS-2505 66.0, xBench-DS-2510 46.0이다.

≤8B 구간에서 직전 최강으로 적힌 MiroThinker-v1.0-8B는 평균 46.5다. 차이는 +4.2다. 같은 칸의 다른 보고값은 OffSeeker-8B-DPO 평균 35.0, WebExplorer-8B-RL 34.9, AgentCPM-Explore-4B 44.2다. BrowseComp-ZH에서는 IterSynth-8B가 55.4로, 논문이 “가장 강한 소형 에이전트 베이스라인 대비 +15.2”라고 쓴다. MiroThinker-v1.0-8B의 BrowseComp-ZH는 40.2다(55.4−40.2=15.2). xBench-DS-2510은 IterSynth 46.0, MiroThinker-v1.0-8B 34.0이다.

BrowseComp와 xBench-DS-2505에서는 경쟁력이 있다고 본문은 말한다. 절대값만 보면 BrowseComp는 30.9로 MiroThinker-v1.0-8B의 31.1보다 소폭 낮다. GAIA-text-only는 55.3으로 MiroThinker 66.4·AgentCPM-Explore-4B 63.9보다 낮다. 평균을 끌어올린 칸은 BrowseComp-ZH와 xBench-2510 쪽이고, GAIA·BrowseComp 절대값은 헤드라인과 달리 읽힌다.

30B급과 견주면 IterSynth-8B는 ReSum-30B, AgentFold-30B-A3B, OpenSeeker-30B-SFT의 평균을 넘고, IterResearch-30B-A3B·WebSailor-V2-30B에 파라미터 1/3 미만으로 접근한다고 논문은 적는다. 이 지면은 30B 재평가를 하지 않았다. 표에 적힌 비교만 옮긴다.

## 5. 학습 ablation, SFT에서 RDPO까지

Table 2는 같은 IterSynth 골격 위에서 학습만 바꾼다. IterSynth-SFT 평균 44.1, outcome-only GRPO 48.9, RDPO 50.7이다. w/o RD는 RDPO와 같은 composite reward를 쓰되 역할 혼합 정규화를 한다. 평균은 47.2로, GRPO보다도 낮다.

벤치별로 보면 RDPO는 BC 30.9, BCzh 55.4, GAIA 55.3, Xb05 66.0, Xb10 46.0이다. GRPO는 28.2 / 53.6 / 50.5 / 63.0 / 49.0이다. Xb10만 GRPO가 49.0으로 RDPO 46.0보다 높다. 나머지와 평균에서는 RDPO가 앞선다. 논문은 특히 BrowseComp·BrowseComp-ZH에서 RDPO 이득이 두드러진다고 쓴다.

해석은 단순하다. 턴 단위 rubric만으로는 부족하고, Planner와 Synthesizer의 보상 밀도가 다를 때 공통 baseline을 쓰면 이점 신호가 섞인다. 역할별 그룹 이점이 그 섞임을 줄인다는 주장이다.

## 6. 역할 교체, Planner가 더 비싸다

Table 3은 한 역할만 학습된 IterSynth-8B로 두고, 다른 역할은 미학습 Qwen3-8B로 바꾼다. 워크플로·프롬프트·워크스페이스 조립은 그대로다.

전체 평균(세 벤치) 58.9에서 Synthesizer만 베이스로 바꾸면 41.5, Δ −17.4다. Planner만 바꾸면 17.8, Δ −41.1다. BrowseComp-ZH만 보면 Planner 교체 시 55.4→7.9로 떨어진다.

논문의 읽기는 이렇다. 약한 Planner는 나쁜 하위 질의를 내고, 궤적 전체의 증거를 오염시킨다. Synthesizer만 약해도 학습된 Planner가 후속 검색으로 일부 만회할 여지가 있다. 구조만으로 성적이 나온 것이 아니라, RDPO가 두 역할의 기능 자체를 끌어올렸다는 쪽이 저자들의 주장이다.

## 7. 프롬프트만으로도, Claude와 DeepSeek

학습 없이 워크플로만 바꾼 비교도 있다. Claude-4.5-Opus에서 ReAct 평균 60.6, IterResearch 63.2, IterSynth 66.1이다. DeepSeek-V3.1에서는 43.4 / 45.2 / 47.9다. ReAct 대비 Claude +5.5, DeepSeek +4.5다.

BrowseComp-ZH만 보면 Claude-4.5-Opus가 ReAct 60.2, IterSynth 70.2다. 서론이 말하는 “최대 +10.0”이 이 칸이다. IterResearch(61.9)보다도 높다. GAIA에서는 Claude 기준 IterResearch 66.0이 IterSynth 61.2를 앞선다. 평균과 BrowseComp-ZH·Xbench 쪽이 IterSynth 프롬프트의 강점으로 적힌다.

이 결과는 IterSynth가 학습된 8B 전용 요령이 아니라, 장기 검색의 구조적 사전 가정으로도 작동한다는 논문의 주장이다. 이 지면은 프롬프트 재실행을 하지 않았다.

## 8. ReAct의 컨텍스트 소진, 59% 초과

![왼쪽은 책상에서 넘쳐 흐르는 서류, 오른쪽은 비어 있고 단정한 닫힌 폴더. 사람·텍스트 없음.](/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/context-overflow.png)

Appendix H는 DeepSeek-V3.1과 Claude-Sonnet-4.6을 동일 ReAct deep-search 에이전트로 돌린다. 최대 컨텍스트는 64K다. BrowseComp-100에서 미완료(최종 답 전에 64K 도달)가 약 59–65%로 지배적이다. 성공은 DeepSeek 7%, Claude 14% 수준으로 붕괴한다. xBench-2510에서도 미완료가 27–30%, BC-zh-100에서는 31–34%다.

백본을 바꿔도 미완료율은 몇 포인트 안쪽에서 움직인다. 논문은 이를 모델 문제가 아니라 ReAct 패러다임의 속성으로 읽는다. Appendix F.3은 같은 계열 비교에서 IterSynth의 context-exhaustion rate를 5% 미만으로 적는다. 평균 검색 라운드도 ReAct 12+회 대비 IterSynth 7–8회다.

메인 결과에서 BrowseComp·BrowseComp-ZH 이득이 큰 이유와, Appendix H의 미완료율이 높은 벤치가 겹친다는 점을 논문은 서로 비춘다. 이 지면은 궤적 통계를 재측정하지 않았다.

## 9. 요약 워크스페이스, 무엇을 남기고 무엇을 잃는가

![햇살 든 나무 탁자 위 빈 노트와 단정한 폴더. 사람·손글씨·텍스트 없음.](/images/posts/2026-09-28-itersynth-role-decoupled-deep-search/summary-workspace.png)

요약이 영속 상태라는 말은, 매 스텝 이력을 통째로 들고 가지 않겠다는 뜻이다. 동시에 요약이 빠뜨리면 Planner는 없는 연결을 전제로 답을 고른다.

Appendix F.4는 잔여 실패 두 유형을 적는다. GAIA에서는 관계 링크가 요약에서 빠지는 정보 손실이 있다. BrowseComp에서는 겉보기에 권위 있어 보이는 오정보를 요약에 넣고, 이후 라운드가 그 방향을 확인하려는 쪽으로 기운다. 확증 편향에 가깝다. 저자들은 관계 보존형 요약과 모순 감지 단계를 앞으로의 과제로 남긴다.

공유 파라미터가 역할 간섭을 낳는지도 본다. SFT-Shared 평균 44.1, 동일 총 파라미터의 SFT-Independent(역할별 8B 둘)는 40.6이다. 공유가 +3.5다. 배포 비용도 줄이고 정확도도 낫다고 논문은 결론짓는다.

## 10. 숫자만 모아 다시 보기

헤드라인용 한 줄은 IterSynth-8B 평균 50.7, ≤8B 최강 대비 +4.2, BrowseComp-ZH 55.4(+15.2)다. 같은 표의 두 번째 줄은 벤치별 30.9 / 55.4 / 55.3 / 66.0 / 46.0, SFT 44.1→GRPO 48.9→RDPO 50.7, w/o RD 47.2, 역할 교체 −17.4 / −41.1, Claude 프롬프트 평균 ReAct 60.6 / IterResearch 63.2 / IterSynth 66.1, BrowseComp-ZH 70.2 vs 60.2, ReAct 64K 미완료 59% 초과, 백본 Qwen3-8B·SFT 약 10K 궤적이다.

이 묶음이 이 지면이 요구하는 최소 성적표다. “8B가 50.7을 찍었다”만 남기면 RDPO의 역할별 이점, Planner 교체 시 −41.1, ReAct의 컨텍스트 소진이 지워진다. 이 지면은 에이전트를 재실행하지 않았다.


## 11. 한계와 이 지면이 안 한 일

논문이 스스로 적는 한계도 있다. 평가 도구는 학습 때 캐시 검색, 평가 때 라이브 검색이다. matched tool environment에서의 30B 재대결은 표 바깥이다. not-attempted 한 번 리샘플은 xBench-2510 +9.0, BrowseComp +5.2, BrowseComp-ZH +6.3을 주지만, 이는 추론 예산 추가이지 학습 이득과 같은 칸이 아니다.

이 지면은 IterSynth-8B 체크포인트를 받지 않았고, BrowseComp·GAIA·xBench를 재돌리지 않았고, Claude·DeepSeek 프롬프트 표를 재현하지 않았다. Appendix K 사례(Ken Walibora 보호관찰관 연도)는 설계 이해를 돕는 질적 예시로만 두었고, 본문 수치 채택 근거로 쓰지 않았다. 코드 저장소 URL은 메타데이터에 있으나, 이 지면이 커밋 해시·라이선스 파일을 재검증하지는 않았다.

헤드라인을 안전하게 읽는 법은 이렇다. 8B 평균 50.7과 +4.2는 Table 1의 ≤8B 칸이다. BrowseComp-ZH +15.2는 같은 칸의 소형 베이스라인 대비다. ReAct 미완료 59% 초과는 Appendix H의 BrowseComp-100·64K 설정이다. 이 세 줄을 한 문장으로 섞으면 벤치와 설정이 사라진다.

## 비유로 이해하기

긴 취재가 한 기자 수첩에만 쌓인다고 상상해 보자. 취재 지시, 현장 메모, 인용, 반박, 임시 결론이 같은 페이지에 계속 붙으면, 나중에는 다음에 누굴 만날지보다 수첩을 넘기는 일에 힘이 빠진다. ReAct식 장기 검색이 그 수첩에 가깝다. Appendix H의 59% 초과 미완료는, 기한이 아니라 수첩 두께에 먼저 막히는 취재다.

IterSynth는 편집장을 둘로 나누지 않고, 같은 사람이 모자와 색깔만 바꿔 가며 일한다. Planner 모자를 쓰면 “지금 수첩 요약만 보고 다음 취재원을 고른다”. Synthesizer 모자를 쓰면 “돌아온 녹취를 요약본에만 반영하고, 다음 질의를 쓰지 않는다”. 요약 노트는 복도 가운데 둔 공동 화이트보드다. 매 라운드 책상 위에는 질문과 그 보드만 다시 올린다.

RDPO는 취재 끝에 맞은 기사에만 점수를 주지 않는다. 매 라운드 “질의는 뾰족했는가”, “요약은 증거를 왜곡하지 않았는가”를 역할별로 채점하고, 그 점수를 같은 기준선에 섞지 않는다. Planner를 초보로 바꾸면 취재 전체가 무너지고(−41.1), Synthesizer만 초보로 바꿔도 타격은 크지만(−17.4) 덜하다. 방향 결정이 더 비싸다는 성적표다.

## 내가 보는 의미

1. **헤드라인은 50.7과 +4.2, 두 번째 성적표는 벤치 편차와 RDPO다.** BrowseComp 30.9는 MiroThinker-v1.0-8B 31.1보다 낮다. 평균을 끌어올린 칸은 BrowseComp-ZH 55.4와 xBench-2510 46.0 쪽이다.
2. **역할 분리만으로는 부족하고, 역할별 이점이 성적표를 가른다.** 같은 composite reward의 w/o RD는 47.2로 GRPO(48.9)보다 낮다.
3. **Planner 교체 −41.1은 구조 선전이 아니다.** 워크플로를 고정한 채 역할 가중치만 빼도 무너진다. 학습이 역할을 “쓰는 법”까지 바꿨다는 쪽의 증거다.
4. **프롬프트 IterSynth는 학습 없이도 ReAct·IterResearch를 평균에서 앞선다.** 다만 Claude GAIA에서는 IterResearch가 더 높다. 모든 칸을 이기는 워크플로라고 단정하기는 표와 맞지 않는다.
5. **ReAct의 59% 초과 미완료는 모델 교체로 안 사라진다.** 64K를 줘도 BrowseComp-100에서 답이 나오기 전에 컨텍스트가 먼저 끝난다. 요약 상태 설계를 성적표와 같이 읽어야 한다.
6. **리샘플 +9.0은 별도 칸이다.** Appendix J의 not-attempted 1회 재시도는 학습 이득과 섞어 읽지 않는 편이 안전하다. 메인 50.7은 그 전략이 켜진 보고값으로 표기된다.

## 확인 기록

### 높은 확신도
- arXiv:2609.29444v1 HTML에서 제목, 저자·소속(Zhejiang University / Tencent), Abstract의 평균 50.7·≤8B 대비 +4.2·RDPO·프롬프트 패러다임, §1의 ReAct 64K 미완료 59% 초과, §3의 Planner–Synthesizer·\(s_t=(q,M_t)\)·SFT 약 10K·RDPO 수식, Table 1의 IterSynth-8B 30.9/55.4/55.3/66.0/46.0·평균 50.7·MiroThinker-v1.0-8B 46.5, §4.2의 BrowseComp-ZH +15.2·xBench-2510 +5.4, Table 2의 SFT 44.1·GRPO 48.9·RDPO 50.7·w/o RD 47.2, Table 3의 −17.4/−41.1, §5.1 프롬프트 표의 Claude 60.6/63.2/66.1·DeepSeek 43.4/45.2/47.9·BCzh 70.2 vs 60.2, Appendix H의 59–65% Not completed, 코드 URL `https://github.com/Tencent/IterSynth`를 확인했다.

### 낮은 확신도
- Figure 1–3·Appendix 도판의 세부 시각 요소는 캡션·본문 서술에 의존하며, 이 지면이 원 도판을 재측정하지 않았다.
- rubric 다섯 차원의 구체 문구·judge 모델(Gemini-2.5-flash-lite) 채점 안정성은 Appendix C 서술 수준이며, 이 지면이 judge를 재현하지 않았다.
- 30B급과의 “접근” 서술은 표 평균 비교이지, 동일 도구·동일 검색 캐시에서의 matched eval 결과가 아니다.

### 채택하지 않음
- IterSynth-8B가 모든 deep-search 벤치에서 MiroThinker-v1.0-8B를 앞선다는 주장(BrowseComp 30.9 < 31.1).
- 프롬프트 IterSynth가 모든 벤치·모든 백본에서 IterResearch를 이긴다는 주장(Claude GAIA 반례).
- 이 지면의 재학습·재평가 수치(원문 미실행).
- 상용 Deep Research 제품과의 직접 우열 단정(표는 공개 벤치·보고된 에이전트 숫자 비교).
- confirmation-bias 실패 비율의 정량 단정(Appendix F.4는 정성 샘플).

## 참고 문헌

1. Xingyu Wu et al., IterSynth: Rethinking Deep Search Agents via Role-Decoupled Iterative Synthesis, arXiv:2609.29444, 2026. `https://arxiv.org/abs/2609.29444` / `https://arxiv.org/html/2609.29444v1`
2. IterSynth code repository, Tencent. `https://github.com/Tencent/IterSynth`
3. Shunyu Yao et al., ReAct: Synergizing Reasoning and Acting in Language Models, arXiv:2210.03629, 2023.
4. Jason Wei et al., BrowseComp: A Simple yet Challenging Benchmark for Browsing Agents, arXiv:2504.12516, 2025.
5. Peilin Zhou et al., BrowseComp-ZH: Benchmarking Web Browsing Ability of Large Language Models in Chinese, arXiv:2504.19314, 2025.
6. Grégoire Mialon et al., GAIA: a benchmark for general AI assistants, arXiv:2311.12983, 2023.
7. Guoxin Chen et al., IterResearch: Rethinking Long-Horizon Agents with Interaction Scaling, arXiv:2511.07327, 2026.
8. MiroMind Team et al., MiroThinker: Pushing the Performance Boundaries of Open-Source Research Agents, arXiv:2511.11793, 2026.
9. An Yang et al., Qwen3 Technical Report, arXiv:2505.09388, 2025.
