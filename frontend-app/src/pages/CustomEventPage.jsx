import Navbar from '../components/landing/Navbar.jsx'
import CustomEventForm from '../components/landing/CustomEventForm.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function CustomEventPage() {
  return (
    <main className="website">
      <Navbar
        onStart={() => {
          window.location.href = '/#templates'
        }}
      />

      <CustomEventForm />

      <Footer />
    </main>
  )
}