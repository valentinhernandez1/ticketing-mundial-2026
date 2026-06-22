import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MisEntradas from '../pages/MisEntradas'

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 } }),
}))

// Mock QRModal to avoid canvas/qrcode deps
vi.mock('../components/QRModal', () => ({
  default: ({ onClose }) => <div data-testid="qr-modal"><button onClick={onClose}>Cerrar</button></div>,
}))

// Mock api client
const mockGet = vi.fn()
vi.mock('../api/client', () => ({
  default: { get: (...args) => mockGet(...args) },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <MisEntradas />
    </MemoryRouter>
  )
}

describe('MisEntradas', () => {
  beforeEach(() => { mockGet.mockReset() })

  it('shows LoadingSpinner while loading', () => {
    // Never resolves
    mockGet.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders ticket list after load', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          idEntrada: 1,
          seleccionLocal: 'Argentina',
          seleccionVisitante: 'Brasil',
          estadio: 'MetLife',
          estado: 'EMITIDA',
          estadoVenta: 'PAGA',
          precio: 500,
          nombreSector: 'A',
        },
      ],
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Argentina vs Brasil/i)).toBeInTheDocument()
    })
  })

  it('shows EmptyState when no tickets', async () => {
    mockGet.mockResolvedValue({ data: [] })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no tenés entradas/i)).toBeInTheDocument()
    })
  })

  it('Ver QR button appears only for EMITIDA + PAGA tickets', async () => {
    mockGet.mockResolvedValue({
      data: [
        { idEntrada: 1, seleccionLocal: 'A', seleccionVisitante: 'B', estado: 'EMITIDA', estadoVenta: 'PAGA', precio: 100, nombreSector: 'A' },
        // EMITIDA but not PAGA — no QR
        { idEntrada: 2, seleccionLocal: 'C', seleccionVisitante: 'D', estado: 'EMITIDA', estadoVenta: 'PENDIENTE', precio: 100, nombreSector: 'B' },
        // CONSUMIDA — no QR
        { idEntrada: 3, seleccionLocal: 'E', seleccionVisitante: 'F', estado: 'CONSUMIDA', estadoVenta: 'PAGA', precio: 100, nombreSector: 'C' },
      ],
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/A vs B/i)).toBeInTheDocument()
    })
    const qrButtons = screen.getAllByRole('button', { name: /ver qr/i })
    expect(qrButtons).toHaveLength(1)
  })
})
