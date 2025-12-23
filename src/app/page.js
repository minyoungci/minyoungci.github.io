import Hero from '@/components/Hero';
import Brief from '@/components/Brief';
import { getSortedPostsData } from '@/lib/posts';

export default async function Home() {
  const allPostsData = await getSortedPostsData();

  return (
    <>
      <Hero />
      <section className="container" style={{ padding: '40px 20px 80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '40px'
        }}>
          {allPostsData.map(({ id, date, title, tag, summary, image }) => (
            <Brief
              key={id}
              slug={id}
              title={title}
              tag={tag}
              summary={summary}
              image={image}
            />
          ))}
        </div>
      </section>
    </>
  );
}
