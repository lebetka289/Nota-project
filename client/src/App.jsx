import { useState } from 'react'
import Header from './components/layout/Header'
import Slider from './components/sections/Slider'
import StudioInfo from './components/sections/StudioInfo'
import RecordingSelector from './components/sections/RecordingSelector'
import HomeRecording from './components/sections/HomeRecording'
import RecordingPage from './components/pages/RecordingPage'
import PaymentPage from './components/pages/PaymentPage'
import UserProfile from './components/pages/UserProfile'
import SupportPanel from './components/pages/SupportPanel'
import BeatmakerPanel from './components/pages/BeatmakerPanel'
import BeatsTable from './components/pages/BeatsTable'
import Footer from './components/layout/Footer'
import SupportChat from './components/widgets/SupportChat'
import Auth from './components/pages/Auth'
import Cart from './components/pages/Cart'
import Favorites from './components/pages/Favorites'
import AdminPanel from './components/pages/AdminPanel'
import { useAuth } from './context/AuthContext'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const { loading } = useAuth()

  if (loading) {
  return (
      <div className="app">
        <div className="loading-screen">Загрузка...</div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <Auth onSuccess={setCurrentPage} />
      case 'shop':
        return <BeatsTable />
      case 'cart':
        return <Cart />
      case 'favorites':
        return <Favorites />
      case 'admin':
        return <AdminPanel />
      case 'recording':
        return <RecordingPage onNavigate={setCurrentPage} />
      case 'payment':
        return <PaymentPage />
      case 'profile':
        return <UserProfile />
      case 'support':
        return <SupportPanel />
      case 'beatmaker':
        return <BeatmakerPanel />
      case 'home':
      default:
        return (
          <>
            <Slider />
            <RecordingSelector onNavigate={setCurrentPage} />
            <HomeRecording onNavigate={setCurrentPage} />
            <StudioInfo />
          </>
        )
    }
  }

  return (
    <div className="app">
      <Header onNavigate={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer onNavigate={setCurrentPage} />
      <SupportChat />
    </div>
  )
}

export default App
