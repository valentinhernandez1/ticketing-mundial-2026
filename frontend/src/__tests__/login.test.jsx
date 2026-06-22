import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock AuthContext
const mockLogin = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('renders email input, password input, and submit button', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('usuario@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { detalle: 'Credenciales incorrectas' } },
    })
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()
    })
  })

  it('submit button is disabled while loading', async () => {
    // login never resolves — simulates loading state
    mockLogin.mockReturnValue(new Promise(() => {}))
    renderLogin()
    const btn = screen.getByRole('button', { name: /ingresar/i })
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled()
    })
  })
})
