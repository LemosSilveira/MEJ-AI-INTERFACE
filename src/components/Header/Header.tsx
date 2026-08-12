import { EXTERNAL_LINKS } from '../../constants/links'
import mascotHeader from '../../assets/mascot-header.png'
import ufcInovaLogo from '../../assets/ufc-inova-logo.svg'
import './Header.css'

interface HeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <button
        type="button"
        className="header__sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? 'Recolher barra lateral' : 'Mostrar barra lateral'}
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
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
      <a
        href={EXTERNAL_LINKS.ufcInova}
        target="_blank"
        rel="noopener noreferrer"
        className="header__inova-link"
        aria-label="Site do UFC Inova"
      >
        <img src={ufcInovaLogo} alt="UFC Inova" className="header__inova-logo" />
      </a>
    </header>
  )
}

export default Header
