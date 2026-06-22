import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MisCompras from '../pages/MisCompras'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } }),
}))

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('../api/client', () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <MisCompras />
    </MemoryRouter>
  )
}

const makeCompra = (id, estado) => ({
  idVenta: id,
  estado,
  fecha: '2026-06-01T10:00:00',
  cantEntradas: 1,
  subtotal: 500,
  comision: 50,
  total: 550,
  entradas: [],
})

describe('MisCompras', () => {
  beforeEach(() => { mockGet.mockReset(); mockPost.mockReset() })

  it('renders purchase list', async () => {
    mockGet.mockResolvedValue({
      data: [makeCompra(1, 'PAGA'), makeCompra(2, 'PENDIENTE')],
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('#000001')).toBeInTheDocument()
      expect(screen.getByText('#000002')).toBeInTheDocument()
    })
  })

  it('shows Confirmar button for PENDIENTE status', async () => {
    mockGet.mockResolvedValue({ data: [makeCompra(10, 'PENDIENTE')] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    })
  })

  it('shows Pagar button for CONFIRMADA status', async () => {
    mockGet.mockResolvedValue({ data: [makeCompra(11, 'CONFIRMADA')] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument()
    })
  })
})
