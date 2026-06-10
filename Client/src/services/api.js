const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    throw { ...data, status: response.status }
  }

  return data
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/api/health`)

  return parseResponse(response)
}

export async function fetchProducts({ page = 1, limit = 2 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const response = await fetch(`${API_BASE}/api/products?${params.toString()}`)

  return parseResponse(response)
}

export async function fetchAdminProducts(token, { page = 1, limit = 2 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const response = await fetch(`${API_BASE}/api/products/admin?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function fetchAllProducts() {
  return fetchProducts({ page: 1, limit: 1000 })
}

export async function fetchProduct(productId) {
  const response = await fetch(`${API_BASE}/api/products/${productId}`)

  return parseResponse(response)
}

export async function fetchCart(token) {
  const response = await fetch(`${API_BASE}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function addCartItem(token, productId, quantity) {
  const response = await fetch(`${API_BASE}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  })

  return parseResponse(response)
}

export async function updateCartItem(token, productId, quantity) {
  const response = await fetch(`${API_BASE}/api/cart/items/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  })

  return parseResponse(response)
}

export async function clearCart(token) {
  const response = await fetch(`${API_BASE}/api/cart`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function removeCartItem(token, productId) {
  const response = await fetch(`${API_BASE}/api/cart/items/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function fetchMe(token) {
  const response = await fetch(`${API_BASE}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function updateProfile(token, profile) {
  const response = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  })

  return parseResponse(response)
}

export async function createOrder(token, order) {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(order),
  })

  return parseResponse(response)
}

export async function fetchOrders(token, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  const response = await fetch(`${API_BASE}/api/orders?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}

export async function createProduct(token, product) {
  const response = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })

  return parseResponse(response)
}

export async function updateProduct(token, productId, product) {
  const response = await fetch(`${API_BASE}/api/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  })

  return parseResponse(response)
}

export async function deleteProduct(token, productId) {
  const response = await fetch(`${API_BASE}/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return parseResponse(response)
}
