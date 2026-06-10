function HeroSection() {
  return (
    <section className="main-hero">
      <div className="main-hero-copy">
        <span className="eyebrow">Dr.VrT WELLNESS</span>
        <h2>두뇌 건강과 컨디션을 위한 스마트 케어</h2>
        <p>매일 챙기기 쉬운 건강 루틴을 DRVT Mall에서 만나보세요.</p>
        <a href="#best-seller" className="hero-link">
          쇼핑하러 가기
        </a>
      </div>
      <div className="main-hero-visual" aria-hidden="true">
        <div className="hero-bottle">Dr.VrT</div>
        <div className="hero-bottle slim">Care</div>
        <div className="hero-leaf leaf-1" />
        <div className="hero-leaf leaf-2" />
      </div>
    </section>
  )
}

export default HeroSection
