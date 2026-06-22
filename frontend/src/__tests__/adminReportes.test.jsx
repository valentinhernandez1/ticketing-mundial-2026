import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminReportes from '../pages/admin/AdminReportes'


const mockGet = vi.fn()
vi.mock('../api/client', () => ({
  default: { get: (...args) => mockGet(...args) },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminReportes />
    </MemoryRouter>
  )
}

describe('AdminReportes', () => {
  beforeEach(() => { mockGet.mockReset() })

  it('renders LoadingSpinner while fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders ranking section after load', async () => {
    // Three endpoints are called via Promise.all in the component:
    //   /reportes/ranking-compradores  → compradores
    //   /reportes/eventos-top          → eventosTop
    //   /reportes/estadisticas-estadio → estadisticas
    mockGet
      .mockResolvedValueOnce({ data: [{ nombre: 'Alice', cant_entradas: 5, monto_total: 2500 }] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })

    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/ranking de compradores/i)).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('shows error Alert when API fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar los reportes/i)).toBeInTheDocument()
    })
  })
})
