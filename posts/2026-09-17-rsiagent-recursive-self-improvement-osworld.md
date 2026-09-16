---
title: "오픈소스가 GPT-6를 앞섰다? RSIAgent 성적표가 남긴 두 번째 숫자"
date: "2026-09-17"
tag: "AI"
summary: "RSIAgent는 학습 없이 메모리만 쌓아 OSWorld 부분점수 78.98, ALE 84.82를 낸다. (w/o RSI) 하네스·부분/이진·Astra 이진 우위를 같이 읽는다."
image: "/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/cover.png"
---

디지털 에이전트는 자주 새 소프트웨어 환경에 떨어진다. 버튼 위치, 실패 모드, 도구 관례가 사전학습에 다 들어 있지 않다. 그때 흔한 선택은 추가 상호작용 데이터를 모아 다시 학습하는 일이다. 비용이 크고, 비공개·계속 바뀌는 환경에는 얹기 어렵다.

2026년 9월 14일 arXiv에 오른 논문 RSIAgent: Autonomous Exploration for Recursive Self-improvement in New Environments(arXiv:2609.15364)는 다른 길을 잡는다. Sibo Zhu·Shicheng Fan·Xinyue Wang·Wenyi Wu·Kun Zhou(교신)·Biwei Huang(Aether AI, UC San Diego, University of Illinois Chicago)은 curriculum·actor·verifier 세 역할을 묶어, 파라미터를 건드리지 않고 환경 특이 메모리를 스스로 쌓는다. 헤드라인은 오픈소스 조합이 GPT-6 Astra·Claude Opus 5의 보고 점수를 앞선다는 쪽이다. 이 지면이 확인할 것은 그 한 줄이 아니다. RSI를 켠 행과 끈 행의 간격, Partial과 Binary의 갈림, 그리고 닫힌 모델 기준선이 “대부분 공식 보고서에서 복사”됐다는 표 주석이다.

> **출처:** arXiv abs(`https://arxiv.org/abs/2609.15364`)와 PDF(`https://arxiv.org/pdf/2609.15364`)를 직접 열어 재구성했다. 표·한계·부록은 PDF 본문 기준이다. 저자·소속·제출일(2026-09-14)은 arXiv 메타데이터와 PDF 표지를 대조했다. 코드는 `github.com/AetherLabsAI/RSIAgent`, 웹사이트는 `aetherlabsai.github.io/RSIAgent`다. 이 지면은 저장소를 실행해 재현하지 않았다.

![새벽 빛이 드는 빈 책상과, 추상적인 UI 빛만 보이는 여러 모니터. 사람 얼굴·텍스트·로고 없음.](/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/cover.png)

## 1. 새 환경에서, 학습 없이 무엇이 남는가

논문의 출발점은 단순하다. 디지털 에이전트는 관측하고 클릭하거나 코드를 실행한다. 그런데 새 환경의 인터페이스와 실패 모드는 사전학습이 다 담지 못한다. 추가 학습은 비싸고, 맥락 안 메모리 정리만으로도 성적이 오른다는 최근 관찰이 있다.

저자들이 묻는 질문은 한 단계 더 간다. 성공 궤적을 외우는 수준을 넘어, 행동·조건·결과 사이의 안정된 인과를 환경에서 스스로 찾아 재사용 가능한 메모리로 묶을 수 있는가. RSIAgent는 그 루프를 curriculum(다음에 무엇을 연습할지), actor(환경과 상호작용하고 메모리를 갱신), verifier(결과를 근거로 판정)로 나눈다. 액션은 code-as-policy다.

핵심 선언은 training-free다. 탐색이 끝난 뒤 메모리는 동결되고, 테스트 때는 파라미터 갱신 없이 그 메모리를 다시 쓴다.

## 2. Broad 다음에 Deep, 그리고 얼린 메모리

![세 개의 서로 다른 작업대와 가운데 공유 노트책. 사람·텍스트·로고 없음.](/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/three-workstations.png)

탐색은 broad-then-deep이다. Broad Recursive Self-exploration(BRS)는 환경을 넓게 훑기 위해 여러 방향을 병렬로 연다. 기본 설정에서 명목 예산은 탐색 프로젝트 약 8개, 동시에 최대 4개까지다. 예산 점검은 진행 중인 웨이브를 끊지 않고, 끝난 웨이브 사이에서 한다.

Deep Recursive Self-exploration(DRS)는 이어서 어렵고 숨은 제약, 경계 조건, 아직 모르는 인과를 파고든다. 순차로 돌며, curriculum이 “더 이상 쓸모 있는 연습이 없다”고 판단할 때까지 이어진다. 성공 한 번이 곧바로 종료 조건은 아니다. curriculum이 검증된 결과와 누적 메모리를 보고 추가 연습을 결정한다.

탐색이 끝나면 누적 메모리는 동결된다. 테스트 단계에서는 curriculum과 메모리 갱신이 꺼지고, actor가 동결된 절차·제약·실패 교훈을 읽어 실행한다. verifier는 과제 요건에 맞춰 결과를 본다. 논문이 말하는 recursive self-improvement는, 이 지면의 독법으로는 “가중치를 고친다”가 아니라 “검증된 환경 지식을 메모리에 쌓아 같은 하네스에서 다시 푼다”에 가깝다.

## 3. 첫 성적표, OSWorld 2.0과 Agents’ Last Exam

평가는 OSWorld 2.0(0808 offline, 82과제)과 Agents’ Last Exam Near-term(67과제)이다. 지표는 Partial(%)과 Binary(%)다. Partial은 과제 점수의 평균, Binary는 만점 과제 비율이다. 기본 구성은 actor에 GLM-5.3, verifier와 curriculum에 Kimi-K3다.

Table 1의 핵심 행만 옮긴다. 기준선 닫힌 모델 숫자는 논문이 “대부분 공식 기술 보고서·블로그에서 복사”했다고 밝힌다.

- RSIAgent (w/o RSI): OSWorld 71.97 / 37.80, ALE 83.75 / 49.25
- RSIAgent: OSWorld 78.98 / 42.68, ALE 84.82 / 50.75
- GPT-6 Astra: OSWorld 72.60 / (미보고), ALE 82.26 / 52.24
- Claude Opus 5: OSWorld 70.19 / 34.72, ALE 79.54 / 46.27
- Kimi-K3 단독: OSWorld 58.30 / (미보고), ALE 71.60 / 40.30

논문 문장으로는 RSIAgent가 GPT-6 Astra의 보고 점수보다 OSWorld Partial에서 6.38%p, ALE Partial에서 2.56%p 높다. 같은 표에서 Claude Opus 5의 Partial·Binary도 아래다. RSI를 끈 하네스만 봐도 OSWorld Partial 71.97은 Astra 72.60과 경합이고, ALE Partial 83.75는 Astra 82.26을 이미 웃돈다. 헤드라인의 “오픈소스가 이겼다”는, 상당 부분이 하네스와 RSI의 합으로 읽어야 한다.

## 4. 두 번째 성적표, Binary와 복사된 기준선

![결승선이 보이는 트랙, 숫자나 글자는 없음.](/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/finish-line.png)

Partial만 보면 RSIAgent가 앞선다. Binary로 바꾸면 층이 달라진다. ALE Binary에서 GPT-6 Astra는 52.24, RSIAgent는 50.75다. Partial 우세가 만점 비율 우세로 자동 연장되지 않는다. OSWorld에서 Astra의 Binary 칸은 비어 있다(미보고).

표 주석은 비교의 성격을 고정한다. 닫힌 모델 행은 대부분 외부 보고를 옮긴 것이고, 하네스·실행 예산이 논문의 RSI 설정과 완전히 맞춰진 재현이 아니다. Appendix도 RSI를 끝내지 못한 과제에는 기준선 점수를 유지한다고 적는다(Appendix C.3). 집계에 미완료 RSI가 섞인다는 뜻이다.

이 지면이 붙잡는 대비는 세 겹이다. (1) RSI on/off 간격, (2) Partial vs Binary, (3) 자체 측정 행과 복사 기준선 행. “오픈소스 모델이 frontier를 이겼다”는 문장은 이 세 겹을 생략하면 성급해진다.

## 5. RSI 스텝이 붙는 자리, T044·T049·T065

![넓은 지도 갈래와 한쪽 깊은 복도가 나란히 있는 장면. 사람·텍스트 없음.](/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/broad-vs-deep.png)

Figure 3은 OSWorld 과제 세 개의 Partial 곡선이다. T044(영상 편집), T049(발표 자료 수리), T065(철도 예매)다. 가로축은 RSI step 0–8이고, 0은 (w/o RSI) 기준선이다. step 8에서 T044·T049·T065는 각각 100%, 80%, 100%에 도달한다.

본문 해석은 이렇다. BRS가 다양한 절차와 환경 지식을 메모리에 쌓고, DRS가 과제 특화 디테일을 다듬는다. 결정적 병목이 풀리면 점수가 한꺼번에 뛰기도 한다. 단일 과제 곡선은 그 “뚫림”을 집계 표보다 잘 보여 준다. 다만 세 과제 사례가 OSWorld 82과제 전체의 평균 기울기는 아니다.

## 6. Ablation, broad만, deep만, 둘 다

네 과제(T080 스프레드시트 수리, T085 오디오 편집, T089 웹 발표 수리, T106 간 분할)에서 단계를 뺀다. Full RSI 평균 Partial은 74.54%다. broad-only(DRS 없음)는 65.52%, deep-only(BRS 없음)는 56.50%다. broad-only는 네 과제 모두에서 빈 메모리 기준선보다 올랐고, deep-only는 T085·T089에서 기준선 아래로 떨어졌다고 본문에 적혀 있다.

논문의 설계 주장과 맞물린다. 넓은 탐색으로 뼈대를 만든 뒤 깊게 파는 순서가, 빈 메모리에서 바로 깊게만 파는 것보다 낫다는 관측이다. 표본은 네 과제·보고된 평균이며, 전체 벤치마크 재집계는 아니다.

## 7. 한계, 비용, 독성 메모리, 윤리

Limitation 절은 짧고 구체적이다. 첫째, 테스트 타임 탐색·연습의 계산 비용이 크다. 둘째, 유한한 예산·종료 정책·메모리 품질에 성적이 달린다. 셋째, 모델 기반 verifier의 잘못된 판정이 이후 탐색과 메모리에 스며들 수 있다. 넷째, 환경마다 도구·검증 신호·탐색 전략이 다르고, 현재 실험이 모든 부품의 기여를 완전히 분리하지는 않았다.

윤리 문단도 본문에 있다. 자율적으로 소프트웨어를 탐색하고 프로그램을 실행하며 재사용 메모리를 남기면, 의도치 않은 행동·무단 접근·개인정보 유출 위험이 따른다. 실험은 허용된 도구·데이터 접근의 통제 환경에서 했다고 적는다.

이 지면이 덧붙이지 않는 독법도 있다. RSIAgent를 “가중치까지 스스로 고치는 AGI 루프”로 읽지 않는다. 여기서의 RSI는 동결 메모리 재사용이다. GPT-6·Claude 이름표만으로 세대 교체를 단정하지도 않는다. 표에 적힌 보고 점수와 논문의 자체 측정 행을 구분해 둔다.


## 8. 관련 축, 메모리 적응과 컴퓨터 사용 에이전트

관련 연구 절은 컴퓨터 사용 에이전트, 자동 curriculum·스킬 획득, 메모리·매뉴얼 구축 계열을 짧게 묶는다. Voyager식 자동 curriculum, AutoManual식 환경 학습 매뉴얼, 최근의 맥락 메모리 조직이 같은 이웃에 있다. RSIAgent가 강조하는 차이는 gold label 없이 curriculum–action–verification 루프로 인과 지식을 메모리에 쌓고, broad-then-deep으로 탐색 순서를 고정한 점이다.

이 지면이 여기서 붙잡는 우선순위는 “새 벤치마크”가 아니라 “같은 OSWorld·ALE 성적표에서 하네스+RSI가 무엇을 바꿨는지”다. Table 1의 직접 대비가 서론의 기여 목록과 맞물린다.

## 9. Appendix가 밝힌 집계 조건

Appendix C는 집계 경계를 밝힌다. OSWorld 잠정 집계는 offline 82과제이며, 일부 설정 실패 과제가 언급된다. ALE는 Near-term 67과제를 모두 포함한다. RSI 행은 일부 과제에서만 RSI를 끝냈고, 끝나지 않은 과제는 기준선 점수를 유지한다. Partial 우위가 Binary 우위로 자동 연장되지 않는다는 점도도 Appendix 서술과 맞닿아 있다.

Metrics and Sources 문단은 Table 1의 닫힌 모델 점수가 리더보드·공식 보고서에서 왔으며, GPT-6 Astra의 OSWorld 결과는 별도 보고를 쓴다고 적는다. 발표 시스템들은 원래 하네스와 실행 예산을 유지한다. 선택한 실행의 예산·평가 범위가 완전히 맞춰지지 않았다는 주의도 같은 부록에 있다. 이 지면은 그 주의를 성적표 해석의 전제로 둔다.

## 10. 재현 경계, 코드는 있고, 이 지면은 돌리지 않았다

코드와 웹사이트 URL은 PDF 표지에 있다. 이 지면은 PDF 표의 수치를 옮겼을 뿐, RSIAgent 탐색을 다시 돌리거나 OSWorld·ALE를 재평가하지 않았다. actor·verifier 모델 API 비용, BRS 8프로젝트 예산이 실제 벽시계로 얼마나 걸리는지, verifier 오판이 메모리에 남는 빈도는 독립 측정하지 않았다.

부록 사례(T044·T049·T065)는 메모리 파일 수·바이트·DRS 보충 프로젝트 같은 성장 기록을 보여 준다. 그 숫자는 “메모리가 실제로 불어난다”는 질적 증거이지, Table 1 집계의 대체재는 아니다.

## 11. 숫자만 모아 다시 보기

헤드라인용 한 줄은 OSWorld Partial 78.98, ALE Partial 84.82, Astra 대비 +6.38·+2.56%p다. 같은 표의 두 번째 줄은 (w/o RSI) 71.97 / 83.75다. RSI가 켠 뒤 OSWorld Partial은 약 7.0%p, Binary는 37.80→42.68로 오른다. ALE Partial 상승은 1.07%p로 더 작다.

Binary 성적표는 ALE에서 Astra 52.24 vs RSIAgent 50.75로 뒤집힌다. Kimi-K3 단독 OSWorld Partial 58.30과 RSIAgent 78.98 사이에는 하네스와 RSI가 함께 있다. Ablation 평균은 Full 74.54, broad-only 65.52, deep-only 56.50이다. 사례 곡선은 step 8에서 100/80/100이다.

이 묶음이 이 지면이 요구하는 최소 성적표다. 한 숫자만 남기면 나머지 다섯이 사라진다.

## 비유로 이해하기

![나중에 다시 집어 드는 얼린 유리 큐브 메모리. 사람·텍스트·로고 없음.](/images/posts/2026-09-17-rsiagent-recursive-self-improvement-osworld/frozen-memory.png)

낯선 앱을 배울 때 사람은 메뉴를 넓게 눌러 본 뒤, 막힌 지점만 반복해서 판다. RSIAgent의 BRS와 DRS는 그 순서에 가깝다. 다만 연습 기록은 뇌에 녹아 들지 않고, 검증을 거친 뒤 얼린 노트처럼 남는다. 시험 날에는 노트를 펼쳐 같은 연필(같은 모델 가중치)로 다시 푼다.

Verifier는 채점 조교다. 조교가 틀리면 오답이 노트로 굳을 수 있다. Broad만 하고 끝내면 지도는 넓은데 골목이 얕고, deep만 하면 골목은 깊은데 전체 지형이 비어 있다. 논문의 ablation 숫자는 그 직관을 네 과제의 평균으로 적어 둔 셈이다.

## 내가 보는 의미

1. **헤드라인은 Partial 우위, 두 번째 성적표는 Binary와 (w/o RSI) 하네스다.** Astra 대비 +6.38·+2.56%p만 남기면, ALE Binary에서 Astra가 앞서는 층과 RSI 끈 행의 이미 높은 기준선이 지워진다.
2. **여기서의 RSI는 파라미터 갱신이 아니다.** 동결 메모리 재사용이다. “모델이 스스로 학습했다”와 “에이전트 시스템이 환경 노트를 쌓았다”를 구분해 읽어야 한다.
3. **broad-then-deep은 ablation에서 방향이 같다.** Full 74.54 > broad-only 65.52 > deep-only 56.50. 빈 메모리에서 바로 깊게만 파는 설정은 일부 과제에서 기준선보다 못하다고 보고됐다.
4. **비교의 영수증을 숨기지 말아야 한다.** 닫힌 모델 행은 대부분 외부 보고서 복사이고, 미완료 RSI 과제는 기준선 점수를 유지한다. 절대 순위 문장은 그 조건 위에서만 성립한다.
5. **비용·verifier 독성·자율 탐색 윤리는 본문이 이미 한계로 적었다.** 성적이 오른 만큼, 테스트 타임 탐색 예산과 잘못된 메모리 고정 위험을 같이 남겨 두는 편이 정직하다.

## 확인 기록

### 높은 확신도
- arXiv:2609.15364v1(2026-09-14) PDF에서 제목, 저자·소속, training-free 다에이전트 RSI, BRS/DRS, 메모리 동결·재사용, Table 1 핵심 수치, Astra 대비 +6.38·+2.56%p, T044/T049/T065 step 8 점수, ablation 평균 74.54/65.52/56.50, Limitation 문단을 확인했다.
- 기본 구성 actor GLM-5.3, verifier·curriculum Kimi-K3, BRS 명목 예산 8 프로젝트·동시 최대 4는 Implementation Details에서 대조했다.
- OSWorld 2.0 0808 offline 82과제, ALE Near-term 67과제, Partial/Binary 정의는 본문·Appendix와 맞췄다.

### 낮은 확신도
- Figure 3의 중간 step별 정확한 눈금값은 곡선 서술과 그림에 의존하며, 이 지면이 원 데이터를 재측정하지 않았다.
- Table 1의 닫힌 모델 행은 논문이 복사했다고 밝힌 외부 보고치라, 하네스·예산 동등성은 독립 검증하지 않았다.
- Ablation 네 과제의 반복 횟수·예산 세부는 Appendix C.5에 두고, 주 본문 평균만 옮겼다.

### 채택하지 않음
- RSIAgent를 가중치까지 갱신하는 일반 RSI/AGI 루프로 읽는 해석.
- ALE Binary에서도 Astra를 이겼다는 주장(표상 52.24 vs 50.75로 반대).
- alphaXiv 주간 다이제스트 TRENDING 목록에 RSIAgent가 올랐다는 서술(이 지면은 PDF 직접 열람이 1차 출처이며, 해당 TRENDING 등재를 주장하지 않음).
- 코드 저장소 실행 재현 결과(원문 미실행).

## 참고 문헌

1. Sibo Zhu, Shicheng Fan, Xinyue Wang, Wenyi Wu, Kun Zhou, Biwei Huang. RSIAgent: Autonomous Exploration for Recursive Self-improvement in New Environments. arXiv:2609.15364, 2026. https://arxiv.org/abs/2609.15364
2. OSWorld / OSWorld 2.0, 본문 인용 벤치마크. (원문 미열람; 과제 수·지표는 2609.15364 본문·Appendix 재인용)
3. Agents’ Last Exam (ALE), 본문 인용 벤치마크. (원문 미열람; 67 Near-term 과제 및 점수는 2609.15364 Table 1·Appendix 재인용)
4. GPT-6 Astra, Claude Opus 5 등 닫힌 모델 점수, 2609.15364 Table 1이 공식 보고서·리더보드에서 복사했다고 명시한 재인용. (각 원문 미열람)
