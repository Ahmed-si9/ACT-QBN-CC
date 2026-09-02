import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import AdminPage from "@/pages/AdminPage";

const Landing = () => (
  <div data-testid="landing-page" className="bg-[#0B1320] min-h-screen text-[#E0F2FE] overflow-x-hidden">
    <Navbar />
    <Hero />
    <Services />
    <Gallery />
    <Reviews />
    <Contact />
    <Footer />
  </div>
);

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
