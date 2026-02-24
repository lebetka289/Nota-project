import { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import MarqueeStrip from './components/sections/MarqueeStrip'
import Slider from './components/sections/Slider'
import CategoryGridAsos from './components/sections/CategoryGridAsos'
import StudioInfo from './components/sections/StudioInfo'
import RecordingSelector from './components/sections/RecordingSelector'
import HomeRecording from './components/sections/HomeRecording'
import PopularBeats from './components/sections/PopularBeats'
import Testimonials from './components/sections/Testimonials'
import Features from './components/sections/Features'
import Stats from './components/sections/Stats'
import RecordingPage from './components/pages/RecordingPage'
import PaymentPage from './components/pages/PaymentPage'
import UserProfile from './components/pages/UserProfile'
import SupportPanel from './components/pages/SupportPanel'
import BeatmakerPanel from './components/pages/BeatmakerPanel'
import BeatsTable from './components/pages/BeatsTable'
import Footer from './components/layout/Footer'
import SupportChat from './components/widgets/SupportChat'
import Auth from './components/pages/Auth'
import ResetPassword from './components/pages/ResetPassword'
import Cart from './components/pages/Cart'
import Favorites from './components/pages/Favorites'
import AdminPanel from './components/pages/AdminPanel'
import NewsPage from './components/pages/NewsPage'
import ReporterPanel from './components/pages/ReporterPanel'
import StudioBookingPage from './components/pages/StudioBookingPage'
import { useAuth } from './context/AuthContext'
import { trackPageView } from './utils/analytics.js'
import './App.css'

const PAGE_TITLES = {
  home: 'Нота бель',
  shop: 'Магазин — Нота бель',
  news: 'Новости — Нота бель',
  'studio-booking': 'Бронирование студии — Нота бель',
  recording: 'Запись — Нота бель',
  auth: 'Вход — Нота бель',
  'reset-password': 'Сброс пароля — Нота бель',
  cart: 'Корзина — Нота бель',
  favorites: 'Избранное — Нота бель',
  profile: 'Профиль — Нота бель',
  support: 'Поддержка — Нота бель',
  beatmaker: 'Кабинет битмейкера — Нота бель',
  admin: 'Админ-панель — Нота бель',
  reporter: 'Панель репортера — Нота бель',
  payment: 'Оплата — Нота бель',
}

function setRobotsMeta(content) {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    if (p.get('page') === 'reset-password' && p.get('token')) return 'reset-password'
    return 'home'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [navState, setNavState] = useState(null)
  const [resetPasswordToken, setResetPasswordToken] = useState(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    if (p.get('page') === 'reset-password') return p.get('token') || null
    return null
  })
  const { loading } = useAuth()

  useEffect(() => {
    const title = PAGE_TITLES[currentPage] || PAGE_TITLES.home
    if (typeof document !== 'undefined') document.title = title

    // Личные/технические разделы лучше закрывать от индексации
    const noindexPages = new Set(['admin', 'profile', 'support', 'cart', 'favorites', 'payment', 'reset-password'])
    setRobotsMeta(noindexPages.has(currentPage) ? 'noindex,nofollow' : 'index,follow')

    trackPageView({ title })
  }, [currentPage])

  if (loading) {
  return (
      <div className="app">
        <div className="loading-screen">Загрузка...</div>
      </div>
    )
  }

  const handleNavigate = (page, searchParam = null, state = null) => {
    setCurrentPage(page)
    if (searchParam !== null) {
      setSearchQuery(searchParam)
    } else {
      setSearchQuery('')
    }
    setNavState(state ?? null)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <Auth onSuccess={setCurrentPage} />
      case 'reset-password':
        return (
          <ResetPassword
            token={resetPasswordToken}
            onSuccess={(page) => {
              setCurrentPage(page)
              setResetPasswordToken(null)
            }}
          />
        )
      case 'shop':
        return <BeatsTable initialSearch={searchQuery} />
      case 'cart':
        return <Cart />
      case 'favorites':
        return <Favorites />
      case 'admin':
        return <AdminPanel />
      case 'recording':
        return <RecordingPage onNavigate={setCurrentPage} />
      case 'payment':
        return <PaymentPage onNavigate={setCurrentPage} />
      case 'profile':
        return <UserProfile />
      case 'support':
        return <SupportPanel />
      case 'beatmaker':
        return <BeatmakerPanel />
      case 'news':
        return (
          <NewsPage
            openNewsId={navState?.openNewsId ?? null}
            onOpenNewsHandled={() => setNavState((s) => (s?.openNewsId ? null : s))}
          />
        )
      case 'reporter':
        return <ReporterPanel />
      case 'studio-booking':
        return <StudioBookingPage onNavigate={handleNavigate} />
      case 'home':
      default:
        return (
          <>
            <MarqueeStrip />
            <Slider />
            <CategoryGridAsos onNavigate={setCurrentPage} />
            <Stats />
            <RecordingSelector onNavigate={setCurrentPage} />
            <Features onNavigate={handleNavigate} />
            <PopularBeats onNavigate={setCurrentPage} />
            <HomeRecording onNavigate={setCurrentPage} />
            <Testimonials />
            <StudioInfo onNavigate={handleNavigate} />
          </>
        )
    }
  }

  return (
    <div className="app">
      <Header onNavigate={handleNavigate} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer onNavigate={setCurrentPage} />
      <SupportChat />
    </div>
  )
}

export default App
