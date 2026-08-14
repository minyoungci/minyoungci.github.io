// Sample posts shown when Supabase is unavailable or has no posts yet.
// Delete entries here (or just add real posts to Supabase) to replace them —
// real Supabase data always takes priority over these.

export const SAMPLE_POSTS = [
    {
        id: 'sample-transformer-deep-dive',
        title: 'Attention Is All You Need — Transformer 아키텍처 완전 분석',
        date: '2026-08-11',
        tag: 'AI',
        summary: 'Self-attention 메커니즘이 어떻게 RNN을 대체하게 되었는지, 원 논문의 수식과 구조를 따라가며 깊이 있게 살펴봅니다.',
        image: '/images/samples/sample-1.jpg',
        content: `Transformer 구조는 attention만으로 시퀀스를 처리합니다. RNN 없이 병렬 처리가 가능해지면서 대규모 학습의 문이 열렸고, 이후 모든 대형 언어 모델의 기반이 되었습니다.

## Self-Attention 메커니즘

쿼리, 키, 밸류의 내적으로 토큰 간 관계를 계산합니다. 이 단순한 구조가 문맥 이해의 핵심입니다. **가중치는 학습되지만, 관계의 형태는 데이터가 결정합니다.**

\`\`\`python
import torch

q, k, v = qkv.chunk(3, dim=-1)
attn = torch.softmax(q @ k.transpose(-2, -1) / d**0.5, dim=-1)
out = attn @ v
\`\`\`

> 단순함이 스케일링의 열쇠였다. 복잡한 귀납 편향보다 데이터와 연산이 이긴다.

## Multi-Head Attention

여러 개의 attention 헤드가 서로 다른 관계 패턴을 학습합니다. 어떤 헤드는 구문을, 어떤 헤드는 장거리 의존성을 포착합니다.

### 헤드 수의 트레이드오프

헤드가 많다고 항상 좋은 것은 아닙니다. 각 헤드의 차원이 줄어들면서 표현력이 희석되는 지점이 존재합니다. [원 논문](https://arxiv.org/abs/1706.03762)의 ablation을 참고하세요.

## Conclusion

Transformer는 이후 모든 LLM의 기반이 되었습니다. 원 논문을 직접 읽어보길 권합니다.`
    },
    {
        id: 'sample-llm-agents',
        title: 'LLM 에이전트의 현재와 미래',
        date: '2026-08-05',
        tag: 'AI',
        summary: '2026년 에이전트 생태계를 정리합니다. 툴 사용, 멀티에이전트 오케스트레이션, 그리고 남은 과제들.',
        image: '/images/samples/sample-2.jpg',
        content: `2026년 현재 LLM 에이전트는 툴 사용을 넘어 멀티에이전트 오케스트레이션으로 진화하고 있습니다.

## 툴 사용의 표준화

MCP 같은 프로토콜이 자리잡으면서 에이전트와 도구의 연결이 표준화되었습니다.

## 남은 과제

- 장기 계획 능력
- 비용 효율적인 검증
- 안전한 자율성의 경계`
    },
    {
        id: 'sample-diffusion-basics',
        title: 'Diffusion 모델 기초부터 DDPM까지',
        date: '2026-07-28',
        tag: 'Science',
        summary: '노이즈에서 이미지가 만들어지는 과정을 수학적으로 이해해 봅니다. 시리즈 1편.',
        image: '/images/samples/sample-3.jpg',
        content: `노이즈에서 이미지가 만들어지는 과정을 수학적으로 이해해 봅니다.

## Forward Process

데이터에 점진적으로 가우시안 노이즈를 더해 완전한 노이즈로 만듭니다.

## Reverse Process

학습된 모델이 노이즈를 단계적으로 제거하며 데이터를 복원합니다.`
    },
    {
        id: 'sample-reading-routine',
        title: '연구자의 논문 읽기 루틴',
        date: '2026-07-20',
        tag: 'Science',
        summary: '하루 30분, 논문을 꾸준히 읽기 위해 만든 시스템을 공유합니다.',
        image: '/images/samples/sample-5.jpg',
        content: `하루 30분, 논문을 꾸준히 읽기 위해 만든 시스템을 공유합니다.

## 세 번 읽기

1. 초록과 그림만 훑기 (5분)
2. 서론과 결론 정독 (10분)
3. 방법론 깊이 읽기 (필요할 때만)

꾸준함이 깊이를 이깁니다.`
    },
    {
        id: 'sample-moe-explained',
        title: 'Mixture of Experts는 왜 다시 주목받는가',
        date: '2026-07-12',
        tag: 'AI',
        summary: '희소 활성화가 가져오는 효율과 라우팅의 난제를 정리합니다.',
        image: '/images/samples/sample-4.jpg',
        content: `희소 활성화가 가져오는 효율과 라우팅의 난제를 정리합니다.

## 희소 활성화의 이점

전체 파라미터 중 일부만 활성화해 연산량 대비 용량을 키웁니다.

## 라우팅의 난제

로드 밸런싱과 전문가 붕괴 문제는 여전히 활발한 연구 주제입니다.`
    },
    {
        id: 'sample-rag-guide',
        title: 'RAG 파이프라인 설계 실전 가이드',
        date: '2026-07-01',
        tag: 'Science',
        summary: '청킹, 임베딩, 리랭킹까지 — 검색 증강 생성의 모든 단계를 다룹니다. 시리즈 2편.',
        image: '/images/samples/sample-6.jpg',
        content: `청킹, 임베딩, 리랭킹까지 — 검색 증강 생성의 모든 단계를 다룹니다.

## 청킹 전략

문서 구조를 존중하는 청킹이 임의 분할보다 항상 낫습니다.

## 리랭킹

검색 품질의 마지막 10%는 리랭커가 만듭니다.`
    }
];

export function getSamplePostById(id) {
    return SAMPLE_POSTS.find((post) => post.id === id) || null;
}
