import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PeopleList, type Person } from "@/components/PeopleList";
import { loadData } from "@/lib/api";

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData<{ people: Person[] }>("/data/people.json")
      .then((data) => {
        setPeople(data.people || []);
        setError("");
      })
      .catch(() => {
        setPeople([]);
        setError("Could not load people. Please try again shortly.");
      })
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mx-auto w-[90%] max-w-6xl pb-20 pt-[130px]">
      <div className="eyebrow">The collective</div>
      <h1 className="section-title">Community</h1>
      <p className="section-subtitle">
        {loaded && people.length > 0
          ? `${people.length} people — click anyone to see which events they hosted, judged, spoke at, and more.`
          : "Click anyone to see which events they hosted, judged, spoke at, and more."}
      </p>
      <div className="mt-10">
        {!loaded ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--cyan)]" />
          </div>
        ) : error ? (
          <p className="text-[var(--muted)]">{error}</p>
        ) : (
          <PeopleList people={people} />
        )}
      </div>
    </div>
  );
}
