import { Link } from "react-router-dom";
import { Calendar, Building2, Users, Inbox } from "lucide-react";

export default function AdminDashboard() {
  const cards = [
    { href: "/admin/events", label: "Events", icon: Calendar, desc: "Create and manage events" },
    { href: "/admin/companies", label: "Companies", icon: Building2, desc: "Manage sponsor companies" },
    { href: "/admin/people", label: "People", icon: Users, desc: "Manage speakers, judges, hosts" },
    { href: "/admin/requests", label: "Requests", icon: Inbox, desc: "View form submissions" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
      <p className="mt-1 text-zinc-400">Welcome to Crewbase Collective admin panel.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            to={card.href}
            className="card group transition hover:border-brand-300 hover:shadow-md"
          >
            <card.icon className="h-8 w-8 text-brand-600" />
            <h2 className="mt-3 font-semibold text-zinc-100 group-hover:text-brand-600">
              {card.label}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
