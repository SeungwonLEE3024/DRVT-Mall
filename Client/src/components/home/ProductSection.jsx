import ProductCard from './ProductCard'

function ProductSection({ id, eyebrow, title, description, products, tone, compact = false, showDescription = true }) {
  return (
    <section id={id} className={`product-section${compact ? ' compact' : ''}`}>
      <div className="section-heading">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>

      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id || product.name}
            product={product}
            index={index}
            tone={tone}
            showDescription={showDescription}
          />
        ))}
      </div>
    </section>
  )
}

export default ProductSection
