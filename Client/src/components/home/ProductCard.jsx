import { Link } from 'react-router-dom'

function ProductCard({ product, index, tone = 'red', showDescription = true }) {
  const content = (
    <>
      <div className={`product-thumb ${tone} thumb-${index + 1}${product.image ? ' has-image' : ''}`}>
        {product.image && <img src={product.image} alt={product.name} />}
        {product.badge && <span>{product.badge}</span>}
      </div>
      <div className="product-info">
        <strong>{product.name}</strong>
        {showDescription && <p>{product.desc}</p>}
        <em>{product.price}</em>
      </div>
    </>
  )

  if (!product.id) {
    return <article className="product-card">{content}</article>
  }

  return (
    <Link to={`/products/${product.id}`} className="product-card product-card-link">
      {content}
    </Link>
  )
}

export default ProductCard
