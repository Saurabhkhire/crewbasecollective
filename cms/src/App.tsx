import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/pages/admin/Layout";
import AdminCompanies from "@/pages/admin/Companies";
import AdminPeople from "@/pages/admin/People";
import AdminEvents from "@/pages/admin/Events";
import AdminEventDetail from "@/pages/admin/EventDetail";
import AdminSettings from "@/pages/admin/Settings";

/** Reuses client admin pages — same /admin/* paths. */
export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/admin/events" replace />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/events" replace />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="people" element={<AdminPeople />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/:id" element={<AdminEventDetail />} />
        <Route path="emails" element={<Navigate to="/admin/settings" replace />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/events" replace />} />
    </Routes>
  );
}
