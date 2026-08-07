import { ConversationsProvider } from './context/ConversationsContext'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import ChatWindow from './components/Chat/ChatWindow'
import './App.css'

function App() {
  return (
    <ConversationsProvider>
      <div className="app-shell">
        <Header />
        <div className="app-body">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </ConversationsProvider>
  )
}

export default App
