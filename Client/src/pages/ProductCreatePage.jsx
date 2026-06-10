import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createProduct, fetchProduct, updateProduct } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import './ProductCreatePage.css'

const CATEGORY_OPTIONS = [
  '[건기식] 면역력 증진 / 스킨케어',
  '[건기식] 장 건강 / 프로바이오틱스',
  '[화장품] 앰플 / 세럼',
  '[화장품] 크림 / 보습',
]

const INITIAL_FORM = {
  name: '',
  sku: '',
  category: CATEGORY_OPTIONS[0],
  price: '',
  originalPrice: '',
  stock: '0',
  unit: '개',
  currency: 'KRW',
  image: '',
  description: '',
  maker: '',
  origin: '',
}

const IMAGE_SLOTS = [
  '[필수] 전면 라벨 및 패키지 이미지 등록',
  '[필수] 후면 영양성분/영양성분/기능 정보 등록',
  '[선택] 측면 1 등록',
  '[선택] 제품 컷 등록',
  '[선택] 기타 등록',
]

const CLOUDINARY_WIDGET_SCRIPT = 'https://upload-widget.cloudinary.com/global/all.js'
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ProductCreatePage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { productId } = useParams()
  const descriptionRef = useRef(null)
  const isEditMode = Boolean(productId)
  const [form, setForm] = useState(INITIAL_FORM)
  const [imagePreviews, setImagePreviews] = useState(() => IMAGE_SLOTS.map(() => ''))
  const [isCloudinaryReady, setIsCloudinaryReady] = useState(Boolean(window.cloudinary))
  const [isLoadingProduct, setIsLoadingProduct] = useState(Boolean(productId))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (window.cloudinary) {
      setIsCloudinaryReady(true)
      return
    }

    const existingScript = document.querySelector(`script[src="${CLOUDINARY_WIDGET_SCRIPT}"]`)

    if (existingScript) {
      existingScript.addEventListener('load', () => setIsCloudinaryReady(true), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = CLOUDINARY_WIDGET_SCRIPT
    script.async = true
    script.onload = () => setIsCloudinaryReady(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        return
      }

      try {
        const data = await fetchProduct(productId)
        const product = data.product
        const nextForm = {
          ...INITIAL_FORM,
          name: product.name || '',
          sku: product.sku || '',
          category: product.category || CATEGORY_OPTIONS[0],
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          currency: product.currency || 'KRW',
          stock: product.stock?.toString() || '0',
          image: product.image || '',
          description: product.description || '',
        }
        const nextImages = [product.image, ...(product.images || [])]
          .filter(Boolean)
          .filter((image, index, images) => images.indexOf(image) === index)

        setForm(nextForm)
        setImagePreviews(IMAGE_SLOTS.map((_, index) => nextImages[index] || ''))
        if (descriptionRef.current) {
          descriptionRef.current.innerHTML = product.description || ''
        }
      } catch (loadError) {
        setError(loadError?.message || '상품 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoadingProduct(false)
      }
    }

    loadProduct()
  }, [productId])

  useEffect(() => {
    if (!isEditMode || isLoadingProduct || !descriptionRef.current) {
      return
    }

    descriptionRef.current.innerHTML = form.description || ''
  }, [isEditMode, isLoadingProduct, productId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleImageUrlChange = (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, image: value }))
    setImagePreviews((current) => {
      const next = [...current]
      next[0] = value
      return next
    })
  }

  const openCloudinaryWidget = (slotIndex) => {
    setError('')

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setError('Cloudinary 환경변수(VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)를 설정해주세요.')
      return
    }

    if (!window.cloudinary || !isCloudinaryReady) {
      setError('Cloudinary 업로드 위젯을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        multiple: false,
        sources: ['local', 'url', 'camera'],
        folder: 'drvt-mall/products',
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5000000,
      },
      (widgetError, result) => {
        if (widgetError) {
          setError('이미지 업로드 중 오류가 발생했습니다.')
          return
        }

        if (result?.event !== 'success') {
          return
        }

        const imageUrl = result.info.secure_url
        setImagePreviews((current) => {
          const next = [...current]
          next[slotIndex] = imageUrl
          return next
        })

        if (slotIndex === 0 || !form.image) {
          setForm((current) => ({ ...current, image: imageUrl }))
        }
      }
    )

    widget.open()
  }

  const syncDescription = () => {
    setForm((current) => ({
      ...current,
      description: descriptionRef.current?.innerHTML || '',
    }))
  }

  const runEditorCommand = (command, value = null) => {
    descriptionRef.current?.focus()
    document.execCommand(command, false, value)
    syncDescription()
  }

  const toggleHeading = () => {
    descriptionRef.current?.focus()
    const currentBlock = document.queryCommandValue('formatBlock').toLowerCase()
    const nextBlock = currentBlock === 'h1' ? 'p' : 'h1'

    document.execCommand('formatBlock', false, nextBlock)
    syncDescription()
  }

  const handleImageInsert = () => {
    const imageUrl = window.prompt('이미지 URL을 입력하세요.')

    if (!imageUrl) {
      return
    }

    runEditorCommand('insertImage', imageUrl)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (Number(form.stock) < 1) {
      window.alert('재고를 등록하세요')
      return
    }

    setIsSubmitting(true)

    try {
      const productPayload = {
        sku: form.sku,
        name: form.name,
        price: Number(form.price),
        currency: form.currency || 'KRW',
        stock: Number(form.stock),
        category: form.category,
        image: form.image,
        images: imagePreviews.filter(Boolean),
        description: form.description,
      }

      if (form.originalPrice) {
        productPayload.originalPrice = Number(form.originalPrice)
      }

      if (isEditMode) {
        await updateProduct(token, productId, productPayload)
        setMessage('상품이 수정되었습니다.')
        navigate('/admin')
      } else {
        await createProduct(token, productPayload)
        setMessage('상품이 등록되었습니다.')
        setForm(INITIAL_FORM)
        setImagePreviews(IMAGE_SLOTS.map(() => ''))
        if (descriptionRef.current) {
          descriptionRef.current.innerHTML = ''
        }
      }
    } catch (submitError) {
      const validationMessage = submitError?.errors?.[0]?.message
      setError(validationMessage || submitError?.message || '상품 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="product-admin-page">
      <header className="product-admin-topbar">
        <div className="product-admin-brand">
          <button type="button" className="product-admin-menu" aria-label="관리자 메뉴 열기">
            ☰
          </button>
          <strong>쇼핑몰 어드민 · {isEditMode ? '상품 수정' : '상품 등록'}</strong>
        </div>
        <div className="product-admin-user">
          <span aria-hidden="true">♧</span>
          <span>어드민⌄</span>
        </div>
      </header>

      <div className="product-admin-shell">
        <aside className="product-admin-sidebar">
          <Link to="/admin" className="product-admin-nav-item">
            ⌂ 대시보드
          </Link>
          <Link to="/admin/products/new" className="product-admin-nav-item active">
            ◈ 상품
          </Link>
          <button type="button" className="product-admin-nav-item">
            🛒 주문
          </button>
          <button type="button" className="product-admin-nav-item">
            ♧ 사용자
          </button>
        </aside>

        <main className="product-create-main">
          <div className="product-create-heading">
            <h1>{isEditMode ? '상품 수정' : '상품 등록'}</h1>
            <button type="button" className="product-create-back" onClick={() => navigate('/admin/products')}>
              ← 목록으로 돌아가기
            </button>
          </div>

          {isLoadingProduct ? (
            <p className="product-create-message">상품 정보를 불러오는 중입니다.</p>
          ) : (
          <form className="product-create-form" onSubmit={handleSubmit}>
            <div className="product-create-grid">
              <section className="product-create-card product-create-card--wide">
                <h2>상품 기본 정보</h2>

                <label className="product-create-field">
                  <span>상품 이름</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="[유한] 고함량 멀티 비타민 & 미네랄"
                    required
                  />
                </label>

                <label className="product-create-field">
                  <span>SKU</span>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="DRVT-VITAMIN-001"
                    required
                  />
                </label>

                <div className="product-image-section">
                  <span className="product-create-label">상품 이미지</span>
                  <div className="product-image-grid">
                    {IMAGE_SLOTS.map((slot, index) => (
                      <button
                        type="button"
                        className={`product-image-slot ${imagePreviews[index] ? 'has-preview' : ''}`}
                        key={slot}
                        onClick={() => openCloudinaryWidget(index)}
                      >
                        {imagePreviews[index] ? (
                          <img src={imagePreviews[index]} alt={`${slot} 미리보기`} />
                        ) : (
                          <CameraIcon />
                        )}
                        <span>{imagePreviews[index] ? '이미지 변경' : slot}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="product-create-field">
                  <span>대표 이미지 URL</span>
                  <input
                    name="image"
                    value={form.image}
                    onChange={handleImageUrlChange}
                    placeholder="Cloudinary 업로드 시 자동 입력됩니다."
                    required
                  />
                </label>
              </section>

              <section className="product-create-card product-create-card--side">
                <h2>판매 및 상품 고시 정보</h2>

                <label className="product-create-field">
                  <span>카테고리</span>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="product-create-price-row">
                  <label className="product-create-field">
                    <span>판매가격</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="19800"
                      required
                    />
                  </label>
                  <label className="product-create-field">
                    <span>정가 (선택)</span>
                    <input
                      name="originalPrice"
                      type="number"
                      min="0"
                      value={form.originalPrice}
                      onChange={handleChange}
                      placeholder="25000"
                    />
                  </label>
                  <label className="product-create-field product-create-field--small">
                    <span>화폐</span>
                    <select name="currency" value={form.currency} onChange={handleChange}>
                      <option value="KRW">KRW</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                </div>

                <div className="product-create-inline">
                  <label className="product-create-field">
                    <span>수량 (재고)</span>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="product-create-field product-create-field--small">
                    <span>단위</span>
                    <select name="unit" value={form.unit} onChange={handleChange}>
                      <option value="개">개</option>
                      <option value="포">포</option>
                      <option value="병">병</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="product-create-card product-create-card--wide">
                <h2>상세 정보 고시 및 성분</h2>
                <div className="product-editor-toolbar">
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('bold')} aria-label="굵게">
                    <strong>B</strong>
                  </button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('italic')} aria-label="기울임">
                    <em>I</em>
                  </button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('insertUnorderedList')} aria-label="목록">
                    ≡
                  </button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={handleImageInsert} aria-label="이미지">
                    ▣
                  </button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={toggleHeading} aria-label="제목">
                    H1
                  </button>
                </div>
                <div
                  ref={descriptionRef}
                  className="product-rich-editor"
                  contentEditable
                  data-placeholder="상품 설명 및 영양 정보 고시를 입력하세요. 예: 비타민 C 1000mg, 유통기한 2026.12.31"
                  onInput={syncDescription}
                  role="textbox"
                  aria-label="상세 정보 고시 및 성분"
                  suppressContentEditableWarning
                />

                <div className="product-create-inline">
                  <label className="product-create-field">
                    <span>제조사/원산지</span>
                    <input
                      name="maker"
                      value={form.maker}
                      onChange={handleChange}
                      placeholder="[한국] 제조사명"
                    />
                  </label>
                  <label className="product-create-field">
                    <span>원산지 상세</span>
                    <input
                      name="origin"
                      value={form.origin}
                      onChange={handleChange}
                      placeholder="대한민국"
                    />
                  </label>
                </div>
              </section>
            </div>

            {(message || error) && (
              <p className={`product-create-message ${error ? 'error' : 'success'}`}>
                {error || message}
              </p>
            )}

            <div className="product-create-actions">
              <button type="button" className="product-create-cancel" onClick={() => navigate('/admin/products')}>
                취소
              </button>
              <button type="submit" className="product-create-submit" disabled={isSubmitting}>
                ✓ {isSubmitting ? '저장 중...' : isEditMode ? '상품 수정하기' : '상품 등록하기'}
              </button>
            </div>
          </form>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProductCreatePage
