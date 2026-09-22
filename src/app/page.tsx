import { redirect } from 'next/navigation'

/** The game lives at /game/index.html (static, single-file client). */
export default function Home() {
  redirect('/game/index.html')
}
