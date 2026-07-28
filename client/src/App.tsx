import { Routes, Route, Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WireAmbient } from "@/components/WireAmbient";
import HomePage from "@/pages/Home";
import EventsPage from "@/pages/Events";
import EventDetailPage from "@/pages/EventDetail";
import SponsorsPage from "@/pages/Sponsors";
import PeoplePage from "@/pages/People";

function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <WireAmbient />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/people" element={<PeoplePage />} />
      </Route>
    </Routes>
  );
}
