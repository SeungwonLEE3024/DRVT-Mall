import { useEffect, useMemo, useState } from 'react'
import BannerSection from '../components/home/BannerSection'
import HeroSection from '../components/home/HeroSection'
import MainFooter from '../components/home/MainFooter'
import ProductSection from '../components/home/ProductSection'
import PromoBand from '../components/home/PromoBand'
import StorySection from '../components/home/StorySection'
import VideoSection from '../components/home/VideoSection'
import { fetchAllProducts } from '../services/api'

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, '').trim()
}

function formatHomeProduct(product, index) {
  return {
    id: product.id,
    name: product.name,
    desc: stripHtml(product.description) || product.category,
    price: `${Number(product.price).toLocaleString()}원`,
    image: product.image,
    badge: index === 0 ? 'BEST' : index === 1 ? 'HOT' : index === 2 ? 'NEW' : undefined,
  }
}

function Home() {
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productError, setProductError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAllProducts()
        setProducts(data.products || [])
      } catch (error) {
        setProductError(error?.message || '상품 데이터를 불러오지 못했습니다.')
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [])

  const homeProducts = useMemo(
    () => products.map((product, index) => formatHomeProduct(product, index)),
    [products]
  )
  const bestSellers = homeProducts.slice(0, 4)
  const newArrivals = homeProducts.slice(4)

  return (
    <main className="home">
      <HeroSection />
      {isLoadingProducts && <p className="product-load-state">상품 데이터를 불러오는 중입니다.</p>}
      {productError && <p className="product-load-state error">{productError}</p>}
      <ProductSection
        id="best-seller"
        eyebrow="BEST SELLER"
        title="많이 찾는 제품"
        description="DRVT Mall 고객들이 가장 많이 선택한 제품입니다."
        products={bestSellers}
        tone="red"
      />
      <PromoBand />
      <StorySection />
      <BannerSection />
      <ProductSection
        id="new-arrivals"
        eyebrow="NEW ARRIVALS"
        title="새롭게 도착했어요"
        products={newArrivals.length ? newArrivals : homeProducts.slice(0, 4)}
        tone="blue"
        compact
        showDescription={false}
      />
      <VideoSection />
      <MainFooter />
    </main>
  )
}

export default Home
