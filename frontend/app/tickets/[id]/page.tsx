import TicketDetail from './TicketDetail'

// Capacitor : la navigation est 100% client-side dans la WebView.
// Le placeholder génère un shell HTML (état de chargement) ; à l'exécution,
// useParams() retourne le vrai id et useEffect charge les données réelles.
export function generateStaticParams() {
  return [{ id: '__placeholder__' }]
}

export default function Page() {
  return <TicketDetail />
}
