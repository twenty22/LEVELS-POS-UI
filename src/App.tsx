import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { BootstrapPayload, CatalogItem, MenuSection, PaymentStatus } from './integration/contracts'
import { createPosClient } from './integration/pos-client'
import { getRuntimeConfig } from './integration/runtime-config'

type CartRow = CatalogItem & { quantity: number }
type TicketDraft = {
  orderId: string | null
  employeeId: string
  tenderId: string
  view: MenuSection
  cart: Record<string, number>
}

const runtimeConfig = getRuntimeConfig()
const posClient = createPosClient(runtimeConfig)
const menuSections: MenuSection[] = ['Drinks', 'Dispensary']
const closingStatuses: PaymentStatus[] = ['success', 'partial', 'offline']
const emptyCatalog: CatalogItem[] = []
const emptyEmployees: BootstrapPayload['employees'] = []
const emptyTenders: BootstrapPayload['tenders'] = []
const ticketDraftStorageKey = 'levels-pos-ticket-draft-v1'

const formatDollars = (cents: number): string => `$${(cents / 100).toFixed(2)}`

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected Clover integration error'
}

const getRuntimeModeLabel = (runtimeMode: BootstrapPayload['runtimeMode']): string => {
  if (runtimeMode === 'bridge') {
    return 'Bridge mode'
  }

  if (runtimeMode === 'api') {
    return 'API mode'
  }

  return 'Mock mode'
}

const getPaymentLabel = (status: PaymentStatus): string => {
  if (status === 'success') {
    return 'Approved'
  }

  if (status === 'partial') {
    return 'Partially approved'
  }

  if (status === 'offline') {
    return 'Offline approved'
  }

  if (status === 'canceled') {
    return 'Canceled'
  }

  return 'Failed'
}

const restoreTicketDraft = (): TicketDraft | null => {
  const rawDraft = window.localStorage.getItem(ticketDraftStorageKey)
  if (!rawDraft) {
    return null
  }

  try {
    const parsedDraft = JSON.parse(rawDraft)
    if (typeof parsedDraft !== 'object' || parsedDraft === null) {
      throw new Error('ticket draft must be an object')
    }

    const draft = parsedDraft as TicketDraft
    if (draft.view !== 'Drinks' && draft.view !== 'Dispensary') {
      throw new Error(`invalid draft view "${String(draft.view)}"`)
    }

    if (typeof draft.employeeId !== 'string' || typeof draft.tenderId !== 'string') {
      throw new Error('invalid employee or tender values in ticket draft')
    }

    if (typeof draft.cart !== 'object' || draft.cart === null) {
      throw new Error('ticket draft cart must be an object map')
    }

    return draft
  } catch (error) {
    console.error('Failed to restore ticket draft', error)
    window.localStorage.removeItem(ticketDraftStorageKey)
    return null
  }
}

const sanitizeDraftCart = (
  cart: Record<string, number>,
  catalogIds: Set<string>,
): Record<string, number> => {
  const sanitized: Record<string, number> = {}

  for (const [itemId, quantity] of Object.entries(cart)) {
    if (!catalogIds.has(itemId)) {
      continue
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      continue
    }

    sanitized[itemId] = quantity
  }

  return sanitized
}

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true)
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)
  const [activeView, setActiveView] = useState<MenuSection>('Drinks')
  const [activeTender, setActiveTender] = useState('')
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('')
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [lastPaymentStatus, setLastPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isCheckoutPending, setIsCheckoutPending] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null)
  const [isTicketOpen, setIsTicketOpen] = useState(false)
  const [cart, setCart] = useState<Record<string, number>>({})

  useEffect(() => {
    let alive = true

    const loadBootstrap = async () => {
      setIsBootstrapLoading(true)
      setBootstrapError(null)

      try {
        const payload = await posClient.getBootstrap()

        if (!alive) {
          return
        }

        const restoredDraft = restoreTicketDraft()
        const catalogIds = new Set(payload.catalog.map((item) => item.id))
        const restoredEmployeeId =
          restoredDraft?.employeeId && payload.employees.some((employee) => employee.id === restoredDraft.employeeId)
            ? restoredDraft.employeeId
            : payload.employees[0]?.id ?? ''
        const restoredTenderId =
          restoredDraft?.tenderId && payload.tenders.some((tender) => tender.id === restoredDraft.tenderId)
            ? restoredDraft.tenderId
            : payload.tenders[0]?.id ?? ''
        const restoredView = restoredDraft?.view ?? 'Drinks'
        const restoredCart = restoredDraft ? sanitizeDraftCart(restoredDraft.cart, catalogIds) : {}

        setBootstrap(payload)
        setAssignedEmployeeId(restoredEmployeeId)
        setActiveTender(restoredTenderId)
        setActiveView(restoredView)
        setCart(restoredCart)
        setCurrentOrderId(restoredDraft?.orderId ?? null)
      } catch (error) {
        if (!alive) {
          return
        }

        setBootstrapError(toErrorMessage(error))
      } finally {
        if (alive) {
          setIsBootstrapLoading(false)
        }
      }
    }

    void loadBootstrap()

    return () => {
      alive = false
    }
  }, [bootstrapAttempt])

  const catalog = bootstrap?.catalog ?? emptyCatalog
  const employees = bootstrap?.employees ?? emptyEmployees
  const tenders = bootstrap?.tenders ?? emptyTenders

  const catalogById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])

  const visibleItems = useMemo(
    () => catalog.filter((item) => item.section === activeView),
    [activeView, catalog],
  )

  const cartRows: CartRow[] = Object.entries(cart)
    .map(([itemId, quantity]) => {
      const item = catalogById.get(itemId)
      if (!item) {
        return null
      }

      return { ...item, quantity }
    })
    .filter((row): row is CartRow => row !== null)

  const totalCents = cartRows.reduce((sum, row) => sum + row.priceCents * row.quantity, 0)
  const itemCount = cartRows.reduce((sum, row) => sum + row.quantity, 0)

  useEffect(() => {
    if (!bootstrap) {
      return
    }

    if (itemCount === 0 && !currentOrderId) {
      window.localStorage.removeItem(ticketDraftStorageKey)
      return
    }

    const draft: TicketDraft = {
      orderId: currentOrderId,
      employeeId: assignedEmployeeId,
      tenderId: activeTender,
      view: activeView,
      cart,
    }

    window.localStorage.setItem(ticketDraftStorageKey, JSON.stringify(draft))
  }, [activeTender, activeView, assignedEmployeeId, bootstrap, cart, currentOrderId, itemCount])

  const addItem = (itemId: string) => {
    setCheckoutError(null)
    setCheckoutNotice(null)
    setCart((previous) => ({ ...previous, [itemId]: (previous[itemId] ?? 0) + 1 }))
  }

  const removeItem = (itemId: string) => {
    setCheckoutError(null)
    setCheckoutNotice(null)
    setCart((previous) => {
      const next = { ...previous }
      const quantity = next[itemId] ?? 0

      if (quantity <= 1) {
        delete next[itemId]
      } else {
        next[itemId] = quantity - 1
      }

      return next
    })
  }

  const submitCheckout = async () => {
    if (!bootstrap) {
      setCheckoutError('Clover bootstrap has not completed yet')
      return
    }

    if (!assignedEmployeeId) {
      setCheckoutError('Select a bartender account before sending payment')
      return
    }

    if (!activeTender) {
      setCheckoutError('Select a tender before sending payment')
      return
    }

    if (cartRows.length === 0) {
      setCheckoutError('Add at least one menu item before sending payment')
      return
    }

    setIsCheckoutPending(true)
    setCheckoutError(null)
    setCheckoutNotice(null)

    try {
      const order = await posClient.upsertOrder({
        orderId: currentOrderId ?? undefined,
        employeeId: assignedEmployeeId,
        lines: cartRows.map((row) => ({ itemId: row.id, quantity: row.quantity })),
      })

      setCurrentOrderId(order.orderId)

      const payment = await posClient.startPayment({
        orderId: order.orderId,
        amountCents: order.totalCents,
        tenderId: activeTender,
        employeeId: assignedEmployeeId,
      })

      setLastPaymentStatus(payment.status)

      if (!closingStatuses.includes(payment.status)) {
        setCheckoutError(payment.message ?? `Payment ${getPaymentLabel(payment.status).toLowerCase()}`)
        return
      }

      await posClient.finalizeOrder({
        orderId: order.orderId,
        paymentId: payment.paymentId ?? null,
        paymentStatus: payment.status,
      })

      setCheckoutNotice(`Payment ${getPaymentLabel(payment.status).toLowerCase()}. Ticket closed.`)
      setCart({})
      setCurrentOrderId(null)
      setIsTicketOpen(false)
      window.localStorage.removeItem(ticketDraftStorageKey)
    } catch (error) {
      setCheckoutError(toErrorMessage(error))
    } finally {
      setIsCheckoutPending(false)
    }
  }

  if (isBootstrapLoading) {
    return (
      <main className="app-shell">
        <section className="catalog-panel loading-panel" aria-live="polite">
          <h2>Loading Clover session…</h2>
          <p>Preparing catalog, employees, and device capabilities.</p>
        </section>
      </main>
    )
  }

  if (bootstrapError || !bootstrap) {
    return (
      <main className="app-shell">
        <section className="catalog-panel error-panel" aria-live="assertive">
          <h2>Could not load Clover bootstrap</h2>
          <p>{bootstrapError ?? 'Bootstrap payload was empty'}</p>
          <button
            type="button"
            className="retry-button"
            onClick={() => setBootstrapAttempt((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="workspace-grid">
        <section className="catalog-panel" aria-label="Menu">
          <div className="runtime-strip" aria-live="polite">
            <span className={`runtime-pill ${bootstrap.runtimeMode}`}>{getRuntimeModeLabel(bootstrap.runtimeMode)}</span>
            <span className="runtime-copy">
              {bootstrap.merchant.displayName} · {bootstrap.device.productName} ({bootstrap.device.model}) · Tax{' '}
              {bootstrap.merchant.taxMode === 'none' ? 'disabled' : 'configured'}
            </span>
          </div>

          <div className="category-row" aria-label="Filter menu sections">
            {menuSections.map((section) => (
              <button
                key={section}
                type="button"
                className={section === activeView ? 'filter-pill active' : 'filter-pill'}
                onClick={() => setActiveView(section)}
              >
                {section}
              </button>
            ))}
          </div>

          <section className="menu-section">
            <div className="item-grid">
              {visibleItems.map((item) => (
                <article key={item.id} className="item-card" onClick={() => addItem(item.id)}>
                  <div className="item-meta">
                    <h3>{item.name}</h3>
                    <p>{item.size ?? 'Cocktail'}</p>
                  </div>
                  <div className="item-actions">
                    <strong>{formatDollars(item.priceCents)}</strong>
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
            <h2>Order {currentOrderId ?? 'Pending'}</h2>
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
            value={assignedEmployeeId}
            onChange={(event) => setAssignedEmployeeId(event.target.value)}
            aria-label="Select bartender account"
          >
            {employees.length === 0 ? (
              <option value="">No employee accounts loaded</option>
            ) : (
              employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))
            )}
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
                  <p>
                    {row.name}
                    {row.size ? ` (${row.size})` : ''}
                  </p>
                  <span>{formatDollars(row.priceCents)} each</span>
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
          <strong>{formatDollars(totalCents)}</strong>
        </div>

        {lastPaymentStatus ? <p className="status-caption">Last payment: {getPaymentLabel(lastPaymentStatus)}</p> : null}
        {checkoutError ? <p className="status-banner error">{checkoutError}</p> : null}
        {checkoutNotice ? <p className="status-banner success">{checkoutNotice}</p> : null}

        <button
          type="button"
          className="checkout-button"
          disabled={cartRows.length === 0 || isCheckoutPending}
          onClick={() => {
            void submitCheckout()
          }}
        >
          {isCheckoutPending ? 'Processing Clover payment…' : `Send ${formatDollars(totalCents)} to Clover`}
        </button>
      </aside>
    </main>
  )
}

export default App
