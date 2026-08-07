import { useState } from 'react'
import { ConversationsProvider } from './context/ConversationsContext'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import ChatWindow from './components/Chat/ChatWindow'
import './App.css'

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <ConversationsProvider>
      <div className="app-shell">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <div className="app-body">
          <Sidebar collapsed={isSidebarCollapsed} />
          <ChatWindow />
        </div>
      </div>
    </ConversationsProvider>
  )
}

export default App
