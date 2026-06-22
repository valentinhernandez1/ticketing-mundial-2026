import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Alert from '../components/ui/Alert'
import PageHeader from '../components/ui/PageHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

describe('Alert', () => {
  it('renders nothing when no message', () => {
    const { container } = render(<Alert />)
    expect(container.firstChild).toBeNull()
  })

  it('renders error message', () => {
    render(<Alert type="error" message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders success message', () => {
    render(<Alert type="success" message="Done!" />)
    expect(screen.getByText('Done!')).toBeInTheDocument()
  })
})



describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="My Title" />)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<PageHeader title="T" subtitle="My Subtitle" />)
    expect(screen.getByText('My Subtitle')).toBeInTheDocument()
  })

  it('renders without icon without crashing', () => {
    render(<PageHeader title="T" />)
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(<PageHeader title="T" action={<button>Click me</button>} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})



describe('LoadingSpinner', () => {
  it('renders the spinner element', () => {
    const { container } = render(<LoadingSpinner />)
    // The inner spinning div has animate-spin class
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})



describe('EmptyState', () => {
  it('renders emoji, title, description, and action', () => {
    render(
      <EmptyState
        emoji="🎟️"
        title="No tickets"
        description="Buy some tickets"
        action={<button>Go buy</button>}
      />
    )
    expect(screen.getByText('🎟️')).toBeInTheDocument()
    expect(screen.getByText('No tickets')).toBeInTheDocument()
    expect(screen.getByText('Buy some tickets')).toBeInTheDocument()
    expect(screen.getByText('Go buy')).toBeInTheDocument()
  })
})
