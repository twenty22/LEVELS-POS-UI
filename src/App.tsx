import { useMemo, useState } from 'react'
import './App.css'

type MenuItem = {
  id: string
  name: string
  section: 'Drinks' | 'Dispensary'
  price: number
  size?: '1g' | '3.5g'
}

type Tender = {
  id: string
  label: string
  detail: string
}

const menuItems: MenuItem[] = [
  { id: 'cruzan-confusion', name: 'Cruzan Confusion', section: 'Drinks', price: 15 },
  { id: 'painkiller', name: 'St. Croix Painkiller', section: 'Drinks', price: 15 },
  { id: 'bushwacker', name: 'Boardwalk Bushwacker', section: 'Drinks', price: 15 },
  { id: 'rum-punch', name: 'House Rum Punch', section: 'Drinks', price: 15 },
  { id: 'soursop-spritz', name: 'Soursop lime spritz', section: 'Drinks', price: 15 },
  { id: 'island-haze-1g', name: 'Island Haze', section: 'Dispensary', size: '1g', price: 18 },
  { id: 'island-haze-35g', name: 'Island Haze', section: 'Dispensary', size: '3.5g', price: 52 },
  { id: 'sunset-sherbet-1g', name: 'Sunset Sherbet', section: 'Dispensary', size: '1g', price: 20 },
  { id: 'sunset-sherbet-35g', name: 'Sunset Sherbet', section: 'Dispensary', size: '3.5g', price: 56 },
  { id: 'christiansted-kush-1g', name: 'Christiansted Kush', section: 'Dispensary', size: '1g', price: 19 },
  { id: 'christiansted-kush-35g', name: 'Christiansted Kush', section: 'Dispensary', size: '3.5g', price: 54 },
]

const tenders: Tender[] = [
  { id: 'tap', label: 'Tap', detail: 'Fastest card flow' },
  { id: 'chip', label: 'Chip', detail: 'Fallback ready' },
  { id: 'cash', label: 'Cash', detail: 'Drawer A' },
  { id: 'gift', label: 'Gift', detail: 'Scan or key in' },
]

const bartenders = ['Bartender A', 'Bartender B', 'Bartender C', 'Bartender D'] as const

function App() {
  const [activeView, setActiveView] = useState<MenuItem['section']>('Drinks')
  const [activeTender, setActiveTender] = useState('tap')
  const [assignedBartender, setAssignedBartender] = useState<string>(bartenders[0])
  const [isTicketOpen, setIsTicketOpen] = useState(false)
  const [cart, setCart] = useState<Record<string, number>>({
    'cruzan-confusion': 2,
    'sunset-sherbet-1g': 1,
  })

  const views = ['Drinks', 'Dispensary'] as const

  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.section === activeView),
    [activeView],
  )

  const cartRows = useMemo(
    () =>
      menuItems
        .filter((item) => cart[item.id])
        .map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart],
  )

  const total = cartRows.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const itemCount = cartRows.reduce((sum, row) => sum + row.quantity, 0)

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
      <section className="workspace-grid">
        <section className="catalog-panel" aria-label="Menu">
          <div className="category-row" aria-label="Filter menu sections">
            {views.map((view) => (
              <button
                key={view}
                type="button"
                className={view === activeView ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            ))}
          </div>

          <section className="menu-section">
            <div className="item-grid">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="item-card"
                  onClick={() => addItem(item.id)}
                >
                  <div className="item-meta">
                    <h3>{item.name}</h3>
                    <p>{item.size ?? 'Cocktail'}</p>
                  </div>
                  <div className="item-actions">
                    <strong>${item.price.toFixed(2)}</strong>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        addItem(item.id)
                      }}
                    >
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>

      <button
        type="button"
        className="ticket-toggle"
        onClick={() => setIsTicketOpen((previous) => !previous)}
        aria-controls="ticket-drawer"
        aria-expanded={isTicketOpen}
      >
        Ticket
        <span className="ticket-count-pill">{itemCount}</span>
      </button>

      {isTicketOpen ? (
        <button
          type="button"
          className="drawer-backdrop"
          onClick={() => setIsTicketOpen(false)}
          aria-label="Close current ticket"
        />
      ) : null}

      <aside
        id="ticket-drawer"
        className={isTicketOpen ? 'ticket-panel ticket-drawer open' : 'ticket-panel ticket-drawer'}
        aria-label="Current ticket"
      >
        <div className="drawer-heading">
          <div>
            <p className="eyebrow">Current ticket</p>
            <h2>Order #1050</h2>
          </div>
          <div className="drawer-heading-actions">
            <span className="item-count">{itemCount} items</span>
            <button type="button" className="drawer-close" onClick={() => setIsTicketOpen(false)}>
              Close
            </button>
          </div>
        </div>

        <label className="employee-field">
          Bartender
          <select
            value={assignedBartender}
            onChange={(event) => setAssignedBartender(event.target.value)}
            aria-label="Select bartender account"
          >
            {bartenders.map((bartender) => (
              <option key={bartender} value={bartender}>
                {bartender}
              </option>
            ))}
          </select>
        </label>

        {cartRows.length === 0 ? (
          <div className="empty-ticket">
            <strong>No items yet</strong>
            <p>Add a product to stage the Clover order.</p>
          </div>
        ) : (
          <ul className="cart-list">
            {cartRows.map((row) => (
              <li key={row.id}>
                <div>
                  <p>{row.name}{row.size ? ` (${row.size})` : ''}</p>
                  <span>${row.price.toFixed(2)} each</span>
                </div>
                <div className="quantity-stepper" aria-label={`${row.name} quantity`}>
                  <button type="button" onClick={() => removeItem(row.id)} aria-label={`Remove one ${row.name}`}>
                    -
                  </button>
                  <strong>{row.quantity}</strong>
                  <button type="button" onClick={() => addItem(row.id)} aria-label={`Add one ${row.name}`}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="tender-grid" aria-label="Tender options">
          {tenders.map((tender) => (
            <button
              key={tender.id}
              type="button"
              className={tender.id === activeTender ? 'tender-card active' : 'tender-card'}
              onClick={() => setActiveTender(tender.id)}
            >
              <strong>{tender.label}</strong>
              <span>{tender.detail}</span>
            </button>
          ))}
        </div>

        <div className="due-now">
          <span>Due now</span>
          <strong>${total.toFixed(2)}</strong>
        </div>

        <button type="button" className="checkout-button" disabled={cartRows.length === 0}>
          Send ${total.toFixed(2)} to Clover
        </button>
      </aside>
    </main>
  )
}

export default App
