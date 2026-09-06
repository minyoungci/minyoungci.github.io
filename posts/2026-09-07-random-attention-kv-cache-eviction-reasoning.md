---
title: "프롬프트만 지키면 점수는 필요 없다, Random Attention이 TriAttention과 맞먹고 서빙은 32–43% 더 빠르다"
date: "2026-09-07"
tag: "AI"
summary: "Random Attention은 프롬프트를 고정하고 head마다 무작위 eviction만 한다. 4모델×6과제에서 최강 선택기와 맞먹고, vLLM에서는 TriAttention 대비 32–43% 더 높은 throughput을 낸다."
image: "/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/cover.png"
---

긴 추론 모델은 답을 내기 전에 수만 토큰의 사고 과정을 남긴다. 그 과정이 길어질수록 KV cache는 선형으로 불어나고, 서빙 메모리는 금세 병목이 된다. 그래서 최근 몇 년의 KV eviction 연구는 같은 문장을 반복해 왔다. 캐시된 토큰마다 “나중에 얼마나 중요할지”를 점수로 매기고, 상위 K개만 남기라는 것이다.

2026년 9월 3일 arXiv에 올라온 논문은 그 문장을 정면에서 흔든다. Salesforce AI Research와 UIUC의 Heng Wang, Jielin Qiu, Wenting Zhao, Cheng Qian, Liangwei Yang, Jiawei Han, Heng Ji, Silvio Savarese, Shelby Heinecke, Huan Wang이 쓴 Random Attention: Rethinking KV Cache Eviction for Efficient Reasoning(arXiv:2609.03430)이다. 방법은 놀랍도록 얇다. 프롬프트 전체는 절대 버리지 않고, 나머지 추론 궤적은 attention head마다 균일 난수로 골라 남긴다. 점수는 없다.

이 지면이 확인할 것은 “무작위가 최강 선택기와 같다”는 헤드라인 하나가 아니다. 프롬프트를 지키면 선택기 간 격차가 대부분 사라진다는 통제 실험, 추론 궤적이 텍스트와 head 두 층에서 스스로를 보호한다는 심기 사실 탐침, 그리고 vLLM에서 TriAttention 대비 32–43% 높은 throughput이라는 두 번째 성적표를 원문 HTML에서 대조한다.

> **출처:** 공개 arXiv/alphaXiv 트렌딩(2026년 9월)을 스파크로 삼되, Gmail alphaXiv digest(2026-09-03)의 재서술이 아니라 ar5iv HTML(`https://ar5iv.labs.arxiv.org/html/2609.03430`)과 abs(`https://arxiv.org/abs/2609.03430`)를 직접 열어 재구성했다. 코드는 `https://github.com/SalesforceAIResearch/Random-Attention`. 생성 영상·티저 PDF는 픽셀로 보지 않았다.

![책상 위 봉인된 편지 봉투가 조심히 보호되고, 뒤쪽 긴 손글씨 노트는 무작위로 얇아지는 장면](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/cover.png)

## 1. 업계의 전제, eviction은 점수 싸움이다

추론 모델은 짧은 질문에도 수만 토큰의 chain of thought를 남긴다. Prefill은 짧고 decode가 길다. 이 비율이 뒤집히면, 문서 긴 입력·짧은 출력용으로 설계된 KV 압축 가정은 그대로 옮기기 어렵다.

기존 eviction은 거의 같은 골격을 쓴다. 예산 K와 최근 버퍼 r를 두고, 버퍼가 찰 때마다 후보 위치에 실수 점수 s를 매긴 뒤 top-K만 남긴다. H2O는 누적 attention, SnapKV는 최근 창의 attention, R-KV는 SnapKV에 중복 페널티, VaSE는 value 범위와 확률 샘플, TriAttention은 위치·키 통계의 삼각급수를 쓴다. 전제는 하나다. 점수가 압축 아래 정확도를 가른다는 것이다.

## 2. Random Attention의 한 줄, 프롬프트 고정 + head별 난수

Random Attention은 선택 신호를 비운다. 구조는 두 줄이다.

첫째, 프롬프트 위치 1…ℓ_p는 영원히 남긴다. 시스템 프롬프트, 채팅 템플릿, 질문 전체가 여기 들어간다. 질문은 한 번만 적히고, 버리면 복구할 수 없다.

둘째, 나머지 캐시 위치에는 head마다 i.i.d. 균일 난수 점수를 주고, 각 KV head가 독립적으로 top-K를 고른다. 같은 위치가 어떤 head에서는 살고 어떤 head에서는 죽는다.

알고리즘은 rand 한 번, 프롬프트 구간에 +∞, topk 한 번이다. 보정 데이터도, 헤드별 캘리브레이션도, attention 재계산도 없다. 저자들은 이를 배포 가능한 방법이자, 새 선택 신호가 이겨야 할 귀무가설로 둔다.

수식으로 쓰면 프롬프트 구간은 s_i=+∞, 나머지는 u_i~Uniform(0,1)이다. Eq. 2의 top-K가 나머지 일을 한다. 버퍼 r개의 최근 토큰은 점수 대상에서 빼는 decode-phase 골격은 Cai et al.(2025)·Chang et al.(2026)과 같다. Random Attention이 바꾸는 것은 s의 정의뿐이며, 그 s조차 난수다.

배포 관점에서의 값은 보정 부재다. TriAttention은 head별 삼각급수 계수를 캘리브레이션하고, R-KV는 λ를 고른다. Random Attention은 그 손잡이가 없다. 새 선택 신호가 예산과 프롬프트 보호를 맞춘 뒤에도 이 귀무가설을 이기지 못하면, 그 신호는 집계 정확도에 쓸 만한 정보를 뽑지 못한 것이다.

## 3. 실험판, 4모델 × 6과제 × 약 4배 압축

비교 대상은 SnapKV, R-KV, VaSE, TriAttention이다. Full attention이 천장이다. 모델은 Qwen3-4B, Qwen3-14B, Qwen3-32B, Phi-4-reasoning이다. 과제는 MATH500(K=1024), GPQA-Diamond(K=2048), AIME 2025+2026 통합(K=4096), HMMT(K=4096), LiveCodeBench-v6 medium(K=3072)이다. 대략 4배 압축이고 LiveCodeBench만 약 3배다. 최대 생성 길이는 32,768토큰이다.

반복 샘플은 MATH500 2회, GPQA-D·LiveCodeBench 4회, AIME·HMMT 16회다. 유의성은 문제 군집 부트스트랩(95%)과 부호 검정으로 가린다. 본문 Table 1은 주로 Qwen3-4B, Phi-4-reasoning, Qwen3-32B를 보여 주고, Qwen3-14B는 부록에서 같은 패턴을 반복한다.

## 4. 첫 성적표, 수학·과학에서 선택 신호는 거의 사지 못한다

Qwen3-4B MATH500에서 Full은 0.939다. SnapKV 0.703, R-KV 0.810, VaSE 0.809, TriAttention 0.864, Random Attention 0.874다. GPQA-D에서는 Full 0.562, Snap 0.369, R-KV 0.482, VaSE 0.461, Tri 0.533, RA 0.530이다.

AIME에서는 Full 0.642, Snap 0.418, R-KV 0.494, VaSE 0.596, Tri 0.592, RA 0.610이다. HMMT에서는 Full 0.462, Snap 0.395, R-KV 0.371, VaSE 0.421, Tri 0.437, RA 0.438이다. LiveCodeBench에서는 Full 0.807, Snap 0.507, R-KV 0.712, VaSE 0.700, Tri 0.755, RA 0.744다.

짝지은 검정에서 Random Attention은 60개 기준선 셀 중 31개에서 유의하게 앞섰고, 유의하게 뒤진 셀은 하나뿐이었다. 수학·과학에서 “점수 있는 선택기가 난수를 이긴다”는 문장은 이 표에서 거의 성립하지 않는다.

![점수가 매겨진 측정기와 난수로 고른 측정기가 비슷한 정확도 눈금을 가리키는 장면](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/score-vs-random.png)

원문 Figure 1a는 여섯 과제의 평균 정확도에서 Random Attention이 모든 모델의 최강 기준선과 겹친다고 요약한다. 14B·32B에서 TriAttention과의 작은 간격은 대부분 코드 추론과 긴 프롬프트 탓이라고 §4.2가 적는다. Figure 1b는 같은 논문의 두 번째 성적표, 즉 점수 패스가 없는 서빙 마진을 한눈에 보여 준다.

이 지면이 Table 1에서 특히 붙잡는 대비는 SnapKV다. 최근 창 attention만으로 점수를 매기는 대표 방법이, 프롬프트를 점수에 맡긴 채 두면 수학·과학·코드 모두에서 크게 벌어진다. 반면 TriAttention은 입력을 기본으로 지키므로, Random Attention과의 비교는 이미 보호 제도가 맞춰진 대결에 가깝다.

## 5. Phi-4-reasoning, 같은 판에서 같은 결말

Phi-4-reasoning MATH500에서 Full은 0.922다. Snap 0.844, R-KV 0.909, VaSE 0.853, Tri 0.891, RA 0.910이다. GPQA-D는 Full 0.707, Snap 0.442, R-KV 0.636, VaSE 0.562, Tri 0.684, RA 0.678이다.

AIME는 Full 0.677, Snap 0.502, R-KV 0.643, VaSE 0.520, Tri 0.633, RA 0.662다. HMMT는 Full 0.444, Snap 0.343, R-KV 0.440, VaSE 0.354, Tri 0.431, RA 0.430이다. LiveCodeBench는 Full 0.697, Snap 0.314, R-KV 0.621, VaSE 0.373, Tri 0.652, RA 0.667이다.

R-KV가 MATH500·HMMT에서 강하지만, 전체 판에서 Random Attention은 TriAttention과 어깨를 나란히 한다. VaSE와 SnapKV는 코드·과학에서 크게 벌어진다.

## 6. Qwen3-32B, 규모가 커져도 신호가 압도하지 않는다

Qwen3-32B MATH500에서 Full은 0.950이다. Snap 0.816, R-KV 0.857, VaSE 0.868, Tri 0.887, RA 0.891이다. GPQA-D는 Full 0.703, Snap 0.476, R-KV 0.638, VaSE 0.597, Tri 0.683, RA 0.683으로 Tri와 RA가 같다.

AIME는 Full 0.715, Snap 0.541, R-KV 0.613, VaSE 0.680, Tri 0.677, RA 0.664다. HMMT는 Full 0.559, Snap 0.450, R-KV 0.472, VaSE 0.524, Tri 0.508, RA 0.509이다. LiveCodeBench는 Full 0.886, Snap 0.609, R-KV 0.779, VaSE 0.797, Tri 0.834, RA 0.806이다.

여기 LiveCodeBench에서 TriAttention이 약 3포인트 앞선 셀이, 본문에서 유일하게 기준선이 Random Attention을 유의하게 이긴 자리이다. 원문은 그 이유를 선택 신호가 아니라 프롬프트 길이로 돌린다.

## 7. 코드 과제, 긴 프롬프트가 예산을 먼저 먹는다

LiveCodeBench 프롬프트는 평균 557토큰으로, 같은 토크나이저 기준 MATH500의 약 6배다. 가장 긴 프롬프트는 K=3072 예산의 절반까지 먹을 수 있다. 프롬프트를 놓치는 선택기는 여기서 가장 크게 무너진다.

SnapKV는 모든 모델에서 Random Attention 대비 20–35포인트가량 뒤진다. VaSE는 Phi-4-reasoning에서 0.373으로 약 29포인트 뒤처진다. TriAttention과 Random Attention은 4B·Phi에서 비슷하고, 32B에서만 Tri가 앞선다.

Random Attention 자신은 프롬프트 전체를 고정하므로, 코드에서는 선택 전에 예산의 큰 가변 몫이 이미 나간다. 원문은 입출력 형식·하네스 같은 스캐폴딩을 통째로 고정하는 대신 압축할 규칙을 남긴다고 적는다. 그 튜닝은 Random Attention의 귀무가설 역할 밖이다.

## 8. 압축을 조이면, 격차는 Random Attention 쪽으로 벌어진다

Figure 2는 Qwen3-4B와 Phi-4-reasoning의 수학·과학 네 과제에서 2×부터 16×까지 압축을 훑는다. 2×에서는 모든 방법이 Full 근처에 붙는다. 예산이 줄수록 Random Attention은 TriAttention과 묶이고, 둘과 VaSE 사이 간격이 벌어진다. LiveCodeBench는 작은 예산에 프롬프트가 들어가지 않아 이 스윕에서 빠진다.

경쟁 수학(AIME·HMMT)은 표본이 작고 어렵지만, 예산을 더 조이면 분리도 Random Attention 유리로 나타난다. 본문 메인 그리드의 느슨한 예산에서는 선택기가 서로를 유의하게 누르지 못하는 경우가 많다.

## 9. 왜인가 (1), 프롬프트가 캐시의 깨지기 쉬운 부분이다

캐시 내용은 두 종류로 나뉜다. 프롬프트는 한 번만 적히고 다시 나오지 않는다. 작업 상태인 추론 궤적은 모델이 계속 다시 쓴다. Table 2는 모든 방법에 “프롬프트 보호” 규칙을 같은 방식으로 준 통제다.

Qwen3-4B MATH500에서 SnapKV는 0.703→0.829(+12.6), R-KV는 0.810→0.812, VaSE는 0.809→0.812, Recency는 0.246→0.843, Random Attention은 0.459→0.874(+41.5)다. GPQA-D에서 Snap은 0.369→0.492, RA는 0.231→0.530, Recency는 0.093→0.519다.

Phi MATH500에서 Snap은 0.844→0.889, RA는 0.759→0.910이다. Phi GPQA-D에서 Snap은 0.442→0.667(+22.5), RA는 0.434→0.678이다. 규칙의 이득은, 기존 점수가 질문을 얼마나 잃고 있었는지에 비례한다. SnapKV가 가장 많이 얻고, 이미 프롬프트를 잘 지키던 R-KV는 거의 안 얻는다.

프롬프트를 모두 지키게 하면, 세 기준선은 설정마다 서로 2.2포인트 안으로 모인다. Phi에서는 Random Attention과도 약 2포인트 안에 붙는다. Qwen3-4B에는 4–6포인트 잔차가 남지만, 그 잔차조차 학습된 점수 쪽이 난수보다 낮은 쪽이다. 선택기 간 격차의 대부분은 점수 품질이 아니라 프롬프트 생존이었다.

![떨어지면 안 되는 얇은 질문 카드가 앞에 서 있고, 뒤로는 흩어진 메모가 있는 장면](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/prompt-fragile.png)

방법들은 프롬프트를 다르게 취급한다. TriAttention은 입력 전체를 기본으로 남기고, VaSE·R-KV·SnapKV는 기본적으로 sink 토큰만 남긴 뒤 나머지를 점수에 맡긴다. 논문 간 비교는 그래서 점수 비교인 동시에 보호 체제 비교이기도 하다. Chen et al.(2026)이 지적한 함정이다.

신호 없는 두 행이 같은 점을 반대쪽에서 찍는다. 규칙 없이 Recency window는 예산을 최근 궤적에만 주고 프롬프트에는 주지 않아 0.09까지 떨어질 수 있다. 규칙을 주면 평범한 Recency조차 최강 기준선 2포인트 안으로 붙고, Random Attention은 모든 설정에서 최고 정책이 된다. 프롬프트를 잃는 일은 치명적이고, 궤적을 무작위로 자르는 일은 그렇지 않다. 이전 연구가 난수 기준선이 점수 선택에 크게 뒤진다고 보고한 이유도, 원문에 따르면 그 난수가 프롬프트를 잃었기 때문이다.

## 10. 왜인가 (2), 추론 궤적은 두 층에서 스스로를 보호한다

첫째 층은 텍스트다. 추론 궤적은 아직 쓰는 값을 다시 말한다. 중요한 값이 한 위치에만 사는 경우는 드물다. R-KV 논문이 이미 지적한 중복이다.

둘째 층은 head다. 각 KV head는 모든 토큰의 자기 사본을 들고, eviction은 head마다 어느 사본이 죽을지를 고른다. 모든 head가 같은 위치를 버릴 때만 그 토큰은 완전히 사라진다.

심기 사실 탐침은 이 둘째 층을 보여 준다. MATH500 궤적에 합성 사실(예: Let zq = 4729)을 넣고, 1,536토큰 뒤(약 15번 eviction)에 그 값이 필요한 질문을 붙인다. 질문은 항상 남기고, 사실을 남길 head 집합만 통제한다.

한 head만 사실을 남기면 검색 성공은 약 3%다. 같은 두 head면 60%, 세 head면 83%, 여덟 head 전부면 99%다. 풀링은 강하게 초가산적이다. 서로 다른 head에 나뉜 두 값이 함께 필요할 때도, 단독 recall보다 합이 크다.

사본의 모양도 거의 중요하지 않다. 토큰을 head에 흩어 연속 구간을 없애도 검색은 0.33 대 0.39, recall R은 0.75 대 0.76으로 거의 같다. 실제 MATH500에서도 연속 블록 크기 1~64는 비용이 없고, 헤드당 블록이 4개·2개로 줄 때(블록 256)야 정확도가 떨어진다. 필요한 것은 “어딘가에 쓸 만한 사본이 남는가”이지, 어느 사본·어느 head·어떤 형태가 아니다.

![같은 노트 페이지 사본을 각각 들고 있는 여러 개의 평행한 선반](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/head-redundancy.png)

실제 MATH500 궤적에서는 이 둘째 층이 심지어 필수가 아닐 수 있다. 모든 head가 같은 난수 keep-set을 쓰는 공유 추첨은 4×·8×에서 Random Attention과 0.3포인트 안에 붙는다. 텍스트 층 중복이 이미 재진술 사본을 남기기 때문이다. Cross-head 층이 짐을 지는 구간은 텍스트가 재진술하지 않는 탐침 체제다. 두 중복은 대체재다. Random Attention은 둘을 모두 보존한다.

Keep-log 측정은 프롬프트 생존 분율도 남긴다. Random Attention은 라운드 직후 프롬프트 생존이 0.994–0.999인 반면, SnapKV는 합집합 기준 0.32–0.42로 가장 낮다. R-KV는 0.55–0.91, VaSE는 0.56–0.70이다. Table 2의 이득 순서가 이 생존 로그와 맞물린다.

## 11. 신호가 아직 사는 자리, 한 번만 적히고 다시 안 나오는 사실

한 번만 선언되고 다시 말해지지 않는 사실은 난수가 못 지킨다. 패스코드를 한 번만 알리고 질문까지 57번의 압축 라운드를 둔 탐침에서, Random Attention의 Retr은 0.000이다. R-KV는 0.836, VaSE는 0.344, SnapKV·TriAttention은 거의 0에 가깝다(각각 0.004, 0.016).

주의 통계를 오래 쌓는 R-KV가 needle에 강하고, 최근 창 신호인 SnapKV·TriAttention은 거의 못 찾는다. 그런데 Table 1에서 R-KV가 앞서는 열은 하나뿐이고, 메인 그리드에서 가장 강한 기준선 TriAttention은 이 탐침에서 거의 실패한다. needle 실력과 집계 정확도는 서로 함의하지 않는다.

실전 추론 궤적에서는 모델이 아직 쓰는 값을 계속 다시 말하므로, 이 한 번만 적힌 경우는 드물다. 원문이 “선택 신호가 아직 살 수 있는 자리”로 남기는 경계다.

## 12. 두 번째 성적표, vLLM에서 32–43% 더 빠른 서빙

효율은 두 설정으로 잰다. 첫째는 TriAttention 프로토콜을 따른 vLLM+PagedAttention이다. 둘째는 HuggingFace 경로의 동일 메모리 배치다. 서빙 주장의 본문은 전자다.

Table 4(H200, K=2048, 1k 프롬프트, 32k 생성)에서 Qwen3-4B는 Full 1296, Tri 1494(1.15×), RA 2046(1.58×)으로 Tri 대비 +37%다. Phi-4는 Full 780, Tri 1212, RA 1737로 +43%다. Qwen3-14B는 Full 925, Tri 1303, RA 1819로 +40%다. Qwen3-32B는 Full 346, Tri 700, RA 923으로 +32%다.

동일 메모리 HF 경로에서 RA는 K=3072일 때 4B/14B 기준 Full 대비 약 10.0× / 8.8×에 도달한다. 다만 원문은 TriAttention의 미융합 재구현 격차를 방법 자체로 과장하지 말라고 못 박는다. 이 지면이 옮기는 1차 서빙 주장은 vLLM의 32–43% 마진이다.

![점수용 스톱워치 단계 없이 GPU 랙의 흐름이 가벼워진 서버실 장면](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/throughput.png)

32B에서는 가중치가 KV 풀을 줄여, 압축 실행이 동시 96요청으로 제한된다. Full은 그런 상한이 없다. 그래도 동일 부하에서 Tri 대비 마진은 +32%로 남는다. 원문은 512요청을 더 줘도 4B throughput이 7%만 오르고, 용량 한계에서도 Tri 대비 +41%·+42%가 유지된다고 적는다. 마진은 이 동작점만의 우연이 아니다.

짧은 생성(8k)에서는 압축 자체가 아직 이득을 못 사기도 한다. 그때도 두 압축 방법 사이의 상대 마진은 비슷한 대역을 유지한다. 단일 요청에서는 둘의 벽시계가 약 1% 안으로 붙는다. 서빙 마진의 본체는 커널 시간 차이가 아니라, 페이지드 상태에서 점수 패스가 배치 장벽에 곱해지는 구조다.

## 13. 왜 점수 생략이 서빙에서 커지는가

단독 스트림에서 eviction 한 라운드는 Random Attention 0.30ms, TriAttention 1.47–1.64ms 수준이다. 단일 요청에서는 디코드 시간의 수 퍼센트에 불과하다.

서빙은 그 작은 비용을 두 배로 불린다. 첫째, 동시 요청이 각자 64토큰마다 압축되면, 배치 경계의 동기화 지점에서 모든 요청이 한 요청의 압축을 기다린다. 둘째, 내용 의존 점수는 페이지드 KV에서 블록 테이블을 가로지르는 추가 패스나, fused kernel이 만들지 않는 attention 통계의 재계산을 요구한다. Random Attention은 난수 순열로 keep-set만 정하고 공통 compaction만 탄다.

Qwen3-14B의 32k 실행에서 TriAttention이 Random Attention보다 더 쓴 약 910초는, 압축당 배치 대기 약 15ms에 해당한다고 원문은 적는다. Random Attention의 압축은 밀리초 미만이다.

Equal-memory 표에서 Full은 4B 배치 28·14B 배치 20에 머물고, 압축 캐시는 109–200을 넣는다. 그 용량 공유가 3–10× 가속의 본체다. 잔차 순위는 점수 패스다. Random Attention은 점수를 계산하지 않아 가장 큰 배치와 가장 작은 peak footprint(101·89GB)에 닿고, 4B/14B에서 10.0×·8.8×를 기록한다. K=1024로 조이면 4B에서 28.8×까지 간다. 이 숫자들은 용량 이야기다. 방법 간 공정 비교의 1차 문장은 여전히 Table 4다.

## 14. 연구 지형, 긴 입력 압축과 긴 추론 eviction은 다른 판이다

긴 문맥 이해용 KV 연구는 양자화, eviction, query-aware sparse attention으로 갈린다. 최근에는 전역 캐시 상한 아래 프롬프트 경계를 지키면 점수 선택이 2차 문제가 된다는 관찰도 있다. Random Attention의 설정은 다르다. 짧은 질문 뒤 긴 생성이므로, 채울 대상은 모델 자신의 궤적이고, 지켜야 할 것은 경계 토큰이 아니라 질문 전체다.

긴 추론용 eviction은 R-KV, VaSE, TriAttention, LazyEviction, SpeContext, Prefix Sliding 등으로 이어진다. 일부 평가는 난수·recency가 점수 선택에 크게  lag한다고 보고했지만, 원문은 그 난수 기준선이 프롬프트를 잃었기 때문이라고 재해석한다. 프롬프트를 맞추면 난수도 최강 기준선에 붙는다.

## 15. 한계, 코드 프롬프트 예산과 희귀 needle

한계는 원문 자신이 연다. 코드처럼 긴 프롬프트에서는 전체를 고정하는 규칙이 예산의 큰 몫을 삼킨다. 스캐폴딩을 압축하는 더 영리한 규칙은 열려 있다. 한 번만 적힌 희귀 사실은 내용 의존 신호만이 살릴 수 있다.

또한 메인 그리드의 LiveCodeBench Qwen3-32B 셀처럼, 프롬프트 길이가 만든 잔차는 남는다. Random Attention은 보정이 없어서 그 잔차를 튜닝으로 줄이지 않는다. 그게 강점이자 경계다.

Qwen3-14B 부록에서는 TriAttention이 LiveCodeBench·MATH500에서, VaSE가 AIME에서 유의하게 앞선 셀이 있다. 본문이 강조하는 32B LiveCodeBench의 유일 패배와 같은 계열의, 프롬프트·표본 변동 이야기로 읽힌다. 이 지면은 14B 숫자를 1차 성적표로 승격하지 않는다.

## 16. 비유로 이해하기, 시험지와 연습장 스티커

시험장에서 문제지가 한 장 있다. 그 문제지를 잃으면 시험은 끝이다. 반면 풀이 연습장에는 같은 중간식을 여러 색 스티커로 다시 적는다. 책상 위에도, 옆 친구에게 보여 준 메모에도, 다시 쓴 검산 칸에도 같은 숫자가 남아 있다.

기존 eviction은 스티커마다 “나중에 얼마나 중요할지” 점수를 매기고 상위만 남기려 했다. Random Attention은 문제지 봉투를 봉인한 채 책상 위에 두고, 연습장 스티커는 서랍에서 아무거나나 집는다. 스티커가 여러 서랍(head)에 복제되어 있으면, 한 서랍이 비어도 다른 서랍에 같은 장이 남는다.

패스코드처럼 한 번만 적고 다시 안 쓰는 메모는 이 방식이 못 지킨다. 그런데 실제 긴 풀이에서는 아직 필요한 값을 계속 다시 쓰기 때문에, 그 한 장짜리 메모는 드물다. 점수가 사는 자리는 그 드문 장이다.

![시험 문제지를 보호한 채, 풀이 연습장의 스티커 메모를 무작위로 남기는 책상 장면](/images/posts/2026-09-07-random-attention-kv-cache-eviction-reasoning/analogy.png)

## 내가 보는 의미

이 논문이 흥미로운 이유는 새 점수 함수를 하나 더 제안해서가 아니라, “점수”라는 연구 질문을 거의 비웠기 때문이다. 보호할 대상과 버려도 되는 대상의 경계를 먼저 긋자, 나머지 순위는 귀무가설인 난수로도 충분하다는 주장이다.

동시에 옮겨야 할 무게중심이 분명하다. 앞으로 eviction 연구가 최적화할 곳은 프롬프트 예산을 어떻게 나눌지, 코드처럼 긴 입력을 통째로 고정하지 않고도 살릴지, 한 번만 적힌 희귀 사실을 언제 점수에 맡길지다. 새 attention 통계를 하나 더 쌓는 경주만으로는 Table 1을 뒤집기 어렵다.

이 지면이 앞으로 볼 목록은 다음이다.

1. 긴 코드 프롬프트에서 “전체 고정” 대신 스캐폴딩을 압축하는 규칙이 Random Attention 정확도를 유지한 채 예산을 얼마나 되찾는지.
2. Prefix Sliding·학습 시 eviction 통합이, 프롬프트 보호를 맞춘 뒤에도 난수 귀무가설을 이기는지.
3. vLLM이 아닌 다른 페이지드 런타임에서 점수 패스 대기가 같은 32–43% 대역으로 재현되는지.
4. 한 번만 적힌 도구 출력·API 반환값처럼, 실서비스 궤적에서 needle 비율이 얼마나 되는지.
5. head 간 공유 keep-set과 독립 난수가 실궤적에서 계속 동점인지, 비재진술 비율이 올라갈 때 갈라지는지.

## 확인 기록

**높은 확신도:** ar5iv HTML에서 확인한 제목·저자·소속, 핵심 주장(프롬프트 고정 + head별 균일 난수, 점수 없음), Table 1의 Qwen3-4B·Phi-4-reasoning·Qwen3-32B 정확도, 31/60·유일 유의 패배(Qwen3-32B LiveCodeBench ~3pt) 서술, Table 2 프롬프트 보호 전후 숫자, planted-fact 3%/60%/83%/99%, Table 3 Retr(RA 0.000, R-KV 0.836, VaSE 0.344, Snap 0.004, Tri 0.016), Table 4 vLLM throughput과 Tri 대비 +37/+43/+40/+32%, LiveCodeBench 프롬프트 평균 557토큰·K=3072, 코드 URL.

**낮은 확신도:** Qwen3-14B 부록 셀의 세부 p값·표본 해석을 1차 성적표와 같은 층으로 읽는 일, HF equal-memory의 TriAttention 미융합 구현 격차를 방법 본질로 확장하는 일, 서빙 마진이 다른 클러스터·다른 vLLM 버전에서 그대로라는 일반화, 생성 길이와 정확도의 인과(부록은 상관만 보고).

**채택하지 않음:** 선택 신호가 “완전히 무의미하다”는 과장(원문은 희귀 needle을 남긴다). HF 경로의 3배 격차를 1차 서빙 주장으로 쓰는 일. Gmail newsletter 문장을 본문 근거로 재서술한 글. 원문이 주지 않은 벤치마크 숫자·인용문 발명. AREX(2026-08-01)와 동일 논문으로 혼동하는 서술.

## 참고 문헌

1. Heng Wang, Jielin Qiu, Wenting Zhao, Cheng Qian, Liangwei Yang, Jiawei Han, Heng Ji, Silvio Savarese, Shelby Heinecke, Huan Wang. Random Attention: Rethinking KV Cache Eviction for Efficient Reasoning. arXiv:2609.03430, 2026. https://arxiv.org/abs/2609.03430
2. ar5iv HTML. https://ar5iv.labs.arxiv.org/html/2609.03430
3. Code. https://github.com/SalesforceAIResearch/Random-Attention
4. Li et al. SnapKV. NeurIPS 2024.
5. Cai et al. R-KV: Redundancy-aware KV cache compression for reasoning models. NeurIPS 2025.
6. Chang et al. VaSE: Value-aware stochastic KV cache eviction for reasoning models. arXiv:2606.03928, 2026.
7. Mao et al. TriAttention: Efficient long reasoning with trigonometric KV compression. ICML 2026.
8. Kwon et al. Efficient memory management for large language model serving with PagedAttention. SOSP 2023.
