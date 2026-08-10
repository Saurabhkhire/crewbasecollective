import type { PersonSubRole } from "@/lib/roles";

/** Checkbox chips for selecting one or more sub-roles. */
export function SubRoleMultiSelect({
  options,
  selected,
  onChange,
  emptyHint = "Add sub-roles under Settings.",
}: {
  options: PersonSubRole[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyHint?: string;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-zinc-500">{emptyHint}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      {options.map((sub) => {
        const isOn = selected.includes(sub.key);
        return (
          <label
            key={sub.key}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ${
              isOn
                ? "bg-emerald-800 text-emerald-100"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={isOn}
              onChange={() => {
                onChange(
                  isOn
                    ? selected.filter((s) => s !== sub.key)
                    : [...selected, sub.key]
                );
              }}
            />
            {sub.key}
            {!sub.visible ? " (admin only)" : ""}
          </label>
        );
      })}
    </div>
  );
}
