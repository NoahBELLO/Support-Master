import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home page', () => {
  beforeEach(() => {
    render(<Home />)
  })

  it('affiche le titre Support Master', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: /support master/i })
    ).toBeInTheDocument()
  })

  it('affiche la description de l\'application', () => {
    expect(
      screen.getByText(/tickets d('|')assistance/i)
    ).toBeInTheDocument()
  })

  it('affiche le lien "Voir les tickets" pointant vers /tickets', () => {
    const link = screen.getByRole('link', { name: /voir les tickets/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/tickets')
  })

  it('affiche le lien "Créer un ticket" pointant vers /tickets/new', () => {
    const link = screen.getByRole('link', { name: /créer un ticket/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/tickets/new')
  })

  it('affiche l\'icône de la page', () => {
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
