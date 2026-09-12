import { useMemo, useState } from 'react'
import './App.css'

type MenuItem = {
  id: string
  name: string
  category: 'Featured' | 'Flower' | 'Vape' | 'Edible' | 'Beverage'
  price: number
  stock: number
}

const menuItems: MenuItem[] = [
  { id: 'f1', name: 'Sour Diesel 1g', category: 'Flower', price: 15, stock: 52 },
  { id: 'f2', name: 'Blue Dream 1g', category: 'Flower', price: 14, stock: 48 },
  { id: 'v1', name: 'Live Resin Cart', category: 'Vape', price: 32, stock: 33 },
  { id: 'v2', name: 'Disposable Pineapple', category: 'Vape', price: 28, stock: 26 },
  { id: 'e1', name: 'Gummies 10pk', category: 'Edible', price: 18, stock: 40 },
  { id: 'e2', name: 'Chocolate Bar 100mg', category: 'Edible', price: 20, stock: 19 },
  { id: 'b1', name: 'THC Lemonade', category: 'Beverage', price: 12, stock: 31 },
  { id: 'x1', name: 'Staff Pick Bundle', category: 'Featured', price: 45, stock: 22 },
]

function App() {
  const [activeCategory, setActiveCategory] = useState<MenuItem['category'] | 'All'>('All')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [orderNote, setOrderNote] = useState('')

  const categories = ['All', 'Featured', 'Flower', 'Vape', 'Edible', 'Beverage'] as const

  const visibleItems = useMemo(() => {
    const filtered = activeCategory === 'All'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory)
    return [...filtered].sort((a, b) => b.stock - a.stock)
  }, [activeCategory])

  const quickTapItems = useMemo(() => [...menuItems].sort((a, b) => b.stock - a.stock).slice(0, 4), [])

  const cartRows = useMemo(
    () =>
      menuItems
        .filter((item) => cart[item.id])
        .map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart],
  )

  const subtotal = cartRows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const tax = subtotal * 0.0825
  const total = subtotal + tax

  const addItem = (itemId: string) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }))
  }

  const removeItem = (itemId: string) => {
    setCart((prev) => {
      const next = { ...prev }
      const current = next[itemId] ?? 0
      if (current <= 1) {
        delete next[itemId]
      } else {
        next[itemId] = current - 1
      }
      return next
    })
  }

  return (
    <main className="app-shell">
      <section className="left-panel">
        <header className="panel-head">
          <div>
            <p className="eyebrow">LEVELS POS UI</p>
            <h1>Fast lane order builder</h1>
            <p className="hint">Top-stocked items are pinned first for low-tap checkout.</p>
          </div>
          <div className="status-chip">
            <span className="dot" />
            Clover mode: {import.meta.env.VITE_CLOVER_MOCK_MODE === 'false' ? 'Live ready' : 'Mock'}
          </div>
        </header>

        <section className="quick-tap">
          <h2>Quick tap favorites</h2>
          <div className="quick-grid">
            {quickTapItems.map((item) => (
              <button key={item.id} type="button" className="quick-card" onClick={() => addItem(item.id)}>
                <span>{item.name}</span>
                <strong>${item.price.toFixed(2)}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="menu-panel">
          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? 'pill active' : 'pill'}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="item-grid">
            {visibleItems.map((item) => (
              <article key={item.id} className="item-card">
                <div>
                  <p className="item-name">{item.name}</p>
                  <p className="sub">
                    {item.category} · Stock {item.stock}
                  </p>
                </div>
                <div className="item-actions">
                  <strong>${item.price.toFixed(2)}</strong>
                  <button type="button" className="add-btn" onClick={() => addItem(item.id)}>
                    + Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <aside className="cart-panel">
        <h2>Current ticket</h2>
        {cartRows.length === 0 ? (
          <p className="empty">Tap an item to start an order.</p>
        ) : (
          <ul className="cart-list">
            {cartRows.map((row) => (
              <li key={row.id}>
                <div>
                  <p>{row.name}</p>
                  <span>${row.price.toFixed(2)}</span>
                </div>
                <div className="qty-controls">
                  <button type="button" onClick={() => removeItem(row.id)}>
                    -
                  </button>
                  <span>{row.quantity}</span>
                  <button type="button" onClick={() => addItem(row.id)}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="note">
          Order note
          <textarea
            value={orderNote}
            onChange={(event) => setOrderNote(event.target.value)}
            placeholder="Promo code, loyalty, special handling..."
          />
        </label>

        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>${subtotal.toFixed(2)}</dd>
          </div>
          <div>
            <dt>Tax</dt>
            <dd>${tax.toFixed(2)}</dd>
          </div>
          <div className="final">
            <dt>Total</dt>
            <dd>${total.toFixed(2)}</dd>
          </div>
        </dl>

        <button type="button" className="checkout-btn" disabled={cartRows.length === 0}>
          Send to Clover tender
        </button>
      </aside>
    </main>
  )
}

export default App
