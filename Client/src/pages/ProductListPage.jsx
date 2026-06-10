import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { deleteProduct, fetchAdminProducts } from '../services/api'
import './ProductCreatePage.css'
import './ProductListPage.css'

const PAGE_LIMIT = 5

/**
 * 가격 값을 통화에 맞는 문자열로 변환한다.
 * - 값이 비어 있으면 '-' 반환
 * - USD는 '$1,234', 그 외(KRW)는 '1,234원' 형식으로 표시
 */
function formatPrice(value, currency = 'KRW') {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  if (currency === 'USD') {
    return `$${Number(value).toLocaleString()}`
  }

  return `${Number(value).toLocaleString()}원`
}

/**
 * 관리자 상품 목록 페이지 컴포넌트.
 * 서버에서 상품을 페이지 단위로 불러와 테이블로 보여주고,
 * 검색(클라이언트 필터링)과 페이지네이션을 제공한다.
 */
function ProductListPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState('')

  const loadProducts = useCallback(async () => {
    if (!token) {
      setError('관리자 인증 정보가 없습니다.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await fetchAdminProducts(token, { page: currentPage, limit: PAGE_LIMIT })
      setProducts(data.products || [])
      setPagination({
        total: data.total || 0,
        page: data.page || currentPage,
        limit: data.limit || PAGE_LIMIT,
        totalPages: data.totalPages || 1,
        hasNextPage: Boolean(data.hasNextPage),
        hasPrevPage: Boolean(data.hasPrevPage),
      })
    } catch (loadError) {
      setError(loadError?.message || '상품 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, token])

  // currentPage가 바뀔 때마다 해당 페이지의 상품 목록을 서버에서 다시 불러온다.
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleDeleteProduct = async (event, product) => {
    event.stopPropagation()

    if (!token || product.isDeleted) return

    const confirmed = window.confirm(
      `"${product.name}" 상품을 삭제하시겠습니까?\n주문 이력이 있으면 상품관리 목록에만 남고 고객에게는 노출되지 않습니다.`
    )

    if (!confirmed) return

    setDeletingId(product.id)
    setError('')
    setMessage('')

    try {
      const result = await deleteProduct(token, product.id)
      setMessage(
        result.deletionType === 'soft'
          ? '주문 이력이 있어 상품관리 목록에는 남기고 고객에게는 숨겼습니다.'
          : '상품을 서버에서 삭제했습니다.'
      )
      await loadProducts()
    } catch (deleteError) {
      setError(deleteError?.message || '상품을 삭제하지 못했습니다.')
    } finally {
      setDeletingId('')
    }
  }

  // 전체 페이지 수를 기반으로 페이지네이션 버튼에 쓸 번호 배열을 생성한다. (예: [1, 2, 3])
  const pageNumbers = useMemo(
    () => Array.from({ length: pagination.totalPages }, (_, index) => index + 1),
    [pagination.totalPages]
  )

  // 현재 페이지에 표시 중인 상품의 시작/끝 순번 (예: "전체 12개 중 6-10개 표시")
  const displayStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
  const displayEnd = Math.min(pagination.page * pagination.limit, pagination.total)

  // 검색어로 상품명/SKU/카테고리를 대소문자 구분 없이 필터링한다.
  // 검색어가 없으면 현재 페이지의 상품 전체를 그대로 반환한다.
  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) {
      return products
    }

    return products.filter((product) =>
      [product.name, product.sku, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    )
  }, [products, searchTerm])

  return (
    <div className="product-admin-page">
      <header className="product-list-topbar">
        <button type="button" className="product-list-back" onClick={() => navigate('/admin')}>
          ←
        </button>
        <strong>상품 관리</strong>
        <Link to="/admin/products/new" className="product-list-create-btn">
          + 새 상품 등록
        </Link>
      </header>

      <main className="product-list-main">
        <div className="product-list-tabs">
          <button type="button" className="active">
            상품 목록
          </button>
          <Link to="/admin/products/new">상품 등록</Link>
        </div>

        <section className="product-list-toolbar">
          <label className="product-list-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={searchTerm}
              // 검색어 입력 시 검색어를 갱신하고 1페이지로 되돌린다.
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="상품명으로 검색..."
            />
          </label>
          <button type="button" className="product-list-filter">
            ▽ 필터
          </button>
        </section>

        <section className="product-list-table-card">
          {error && <p className="product-list-state error">{error}</p>}
          {message && <p className="product-list-state success">{message}</p>}
          {isLoading && <p className="product-list-state">상품 목록을 불러오는 중입니다.</p>}
          {!isLoading && !error && (
            <table className="product-list-table">
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>재고</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`product-list-clickable-row${product.isDeleted ? ' deleted' : ''}`}
                      // 행 클릭 시 해당 상품의 수정 페이지로 이동
                      onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                    >
                      <td>
                        <div className="product-list-thumb">
                          {product.image ? <img src={product.image} alt={product.name} /> : null}
                        </div>
                      </td>
                      <td>
                        <strong>{product.isDeleted ? '삭제된 상품입니다.' : product.name}</strong>
                        <span>{product.isDeleted ? `${product.name} · ${product.sku}` : product.sku}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <strong>{formatPrice(product.price, product.currency)}</strong>
                        {product.originalPrice ? (
                          <span>{formatPrice(product.originalPrice, product.currency)}</span>
                        ) : null}
                      </td>
                      <td>
                        {product.isDeleted ? (
                          <span className="product-list-status deleted">미노출</span>
                        ) : (
                          product.stock ?? 0
                        )}
                      </td>
                      <td>
                        <div className="product-list-actions">
                          <button
                            type="button"
                            // 행 클릭 이벤트와 겹치지 않게 전파를 막고 수정 페이지로 이동
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`/admin/products/${product.id}/edit`)
                            }}
                            aria-label={`${product.name} 수정`}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleDeleteProduct(event, product)}
                            disabled={product.isDeleted || deletingId === product.id}
                            aria-label={`${product.name} 삭제`}
                          >
                            {deletingId === product.id ? '…' : '🗑'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="product-list-empty">
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        {!isLoading && !error && (
          <nav className="product-list-pagination" aria-label="상품 목록 페이지네이션">
            <div className="product-list-page-buttons">
              <button
                type="button"
                // 이전 페이지로 이동 (최소 1페이지)
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={!pagination.hasPrevPage}
              >
                ← 이전
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  type="button"
                  className={pageNumber === pagination.page ? 'active' : ''}
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                // 다음 페이지로 이동 (최대 totalPages)
                onClick={() => setCurrentPage((page) => Math.min(page + 1, pagination.totalPages))}
                disabled={!pagination.hasNextPage}
              >
                다음 →
              </button>
            </div>
            <p>
              전체 {pagination.total}개 상품 중 {displayStart}-{displayEnd}개 표시
            </p>
          </nav>
        )}
      </main>
    </div>
  )
}

export default ProductListPage
