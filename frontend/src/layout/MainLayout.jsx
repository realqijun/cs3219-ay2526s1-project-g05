import { Navbar } from "@/components/Navbar"
import { Footer } from '@/components/Footer'
import { Toaster } from "sonner";

function MainLayout({ children }) {
  return (
    <div>
      <Navbar />
      <div>{children}</div>
      <Footer />
      <Toaster />
    </div>
  )
}

export default MainLayout
