import mascotHeader from '../../assets/mascot-header.png'
import './Header.css'

function Header() {
  return (
    <header className="header">
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
