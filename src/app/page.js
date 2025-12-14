import Hero from '@/components/Hero';
import Brief from '@/components/Brief';

// Mock data based on "The Batch" content
const articles = [
  {
    id: 1,
    tag: "News",
    title: "DeepSeek Sharpens Its Reasoning",
    summary: "DeepSeek-R1, an affordable rival to OpenAI’s o1, demonstrates that strong reasoning capabilities can be achieved efficiently.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop", // Abstract AI image
    slug: "deepseek-sharpens-reasoning"
  },
  {
    id: 2,
    tag: "Research",
    title: "Meta’s Open 3D Pipeline",
    summary: "Meta releases new tools for generating 3D assets, accelerating the development of virtual spaces and gaming environments.",
    image: "https://images.unsplash.com/photo-1633419461186-7d40a2e50594?q=80&w=1000&auto=format&fit=crop", // Meta/VR image
    slug: "metas-open-3d-pipeline"
  },
  {
    id: 3,
    tag: "Industry",
    title: "World Labs’ Virtual Spaces",
    summary: "World Labs introduces AI-generated virtual environments that adapt to user behavior in real-time.",
    slug: "world-labs-virtual-spaces",
    image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 4,
    tag: "Technology",
    title: "Baidu’s Multimodal Models",
    summary: "Baidu unveils its latest multimodal AI, capable of processing text, images, and audio simultaneously with high accuracy.",
    slug: "baidus-multimodal-models",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 5,
    tag: "Robotics",
    title: "Coordinating Robot Teams",
    summary: "New research shows how swarms of robots can collaborate on complex tasks without central control.",
    slug: "coordinating-robot-teams",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 6,
    tag: "Ethics",
    title: "Google Rules Arena Leaderboards",
    summary: "Google's latest models top the charts in safety and reasoning benchmarks, setting a new standard for AI evaluation.",
    slug: "google-rules-arena",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop"
  }
];

export default function Home() {
  return (
    <>
      <Hero />
      <section className="container" style={{ padding: '40px 20px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '40px'
        }}>
          {articles.map(article => (
            <Brief key={article.id} {...article} />
          ))}
        </div>
      </section>
    </>
  );
}
