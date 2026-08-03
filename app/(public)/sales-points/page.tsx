import { permanentRedirect } from 'next/navigation'

// The locator now lives on the home page (``/``); keep this route as a
// permanent redirect so previously-published links keep working.
export default function SalesPointsPage() {
  permanentRedirect('/')
}
