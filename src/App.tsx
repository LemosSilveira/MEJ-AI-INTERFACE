import { useCallback, useEffect, useState } from 'react'
import { ConversationsProvider } from './context/ConversationsContext'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import ChatWindow from './components/Chat/ChatWindow'
import './App.css'

// O layout em si é decidido por media query no CSS. Este matchMedia existe só
// para o que o CSS não resolve: o padrão da sidebar difere por breakpoint
// (aberta e fixa no desktop, fechada no mobile) e o drawer não pode ficar preso
// ao cruzar o corte. Ver PRD §4.1.
const DESKTOP_QUERY = '(min-width: 769px)'

const isDesktopNow = () =>
  typeof window === 'undefined' || window.matchMedia(DESKTOP_QUERY).matches

function App() {
  const [isDesktop, setIsDesktop] = useState(isDesktopNow)
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktopNow)

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    function handleChange(event: MediaQueryListEvent) {
      setIsDesktop(event.matches)
      // Volta ao padrão do layout de destino, em vez de carregar o estado
      // do layout anterior para dentro do novo.
      setIsSidebarOpen(event.matches)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const isDrawer = !isDesktop
  const isDrawerOpen = isDrawer && isSidebarOpen

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])

  // Trava o scroll do body enquanto o drawer estiver aberto (§4.3).
  useEffect(() => {
    if (!isDrawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isDrawerOpen])

  return (
    <ConversationsProvider>
      <div className="app-shell">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <div className="app-body">
          {isDrawerOpen && (
            <div className="app-overlay" onClick={closeSidebar} aria-hidden="true" />
          )}
          <Sidebar open={isSidebarOpen} isDrawer={isDrawer} onClose={closeSidebar} />
          <ChatWindow />
        </div>
      </div>
    </ConversationsProvider>
  )
}

export default App
