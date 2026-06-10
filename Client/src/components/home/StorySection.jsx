const stories = [
  { className: 'warm', title: 'Daily Care', description: '바쁜 일상 속에서도 쉽게 챙기는 건강 습관' },
  { className: 'clean', title: 'Inner Beauty', description: '몸 안에서부터 시작하는 균형 잡힌 아름다움' },
  { className: 'fresh', title: 'Wellness Lab', description: '가볍고 산뜻한 데일리 웰니스 솔루션' },
]

function StorySection() {
  return (
    <section className="story-section">
      {stories.map((story) => (
        <article className={`story-card ${story.className}`} key={story.title}>
          <div />
          <strong>{story.title}</strong>
          <p>{story.description}</p>
        </article>
      ))}
    </section>
  )
}

export default StorySection
