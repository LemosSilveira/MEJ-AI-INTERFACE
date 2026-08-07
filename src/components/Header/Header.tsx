import mascotHeader from '../../assets/mascot-header.png'
import './Header.css'

interface HeaderProps {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}

function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <button
        type="button"
        className="header__sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={isSidebarCollapsed ? 'Mostrar barra lateral' : 'Recolher barra lateral'}
        aria-pressed={isSidebarCollapsed}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="header__brand">
        <div className="header__mascot" aria-hidden="true">
          <img src={mascotHeader} alt="" className="header__mascot-img" />
        </div>
        <span className="header__wordmark">MEJ IA</span>
      </div>
    </header>
  )
}

export default Header
