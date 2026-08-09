import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WireAmbient } from "@/components/WireAmbient";
import HomePage from "@/pages/Home";
import EventsPage from "@/pages/Events";
import EventDetailPage from "@/pages/EventDetail";
import SponsorsPage from "@/pages/Sponsors";
import PeoplePage from "@/pages/People";
import GetInvolvedPage from "@/pages/GetInvolved";
import NotFoundPage from "@/pages/NotFound";

function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ScrollToTop />
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
        <Route path="/join" element={<Navigate to="/get-involved" replace />} />
        <Route path="/get-involved" element={<GetInvolvedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
