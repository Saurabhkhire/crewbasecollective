import { Plus, Trash2 } from "lucide-react";

type LinkListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function LinkListField({
  label,
  values,
  onChange,
  placeholder = "https://",
}: LinkListFieldProps) {
  const rows = values.length ? values : [""];

  const updateRow = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  };

  const addRow = () => onChange([...rows, ""]);

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : [""]);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-zinc-300">{label}</div>
      <div className="space-y-2">
        {rows.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="input-field min-w-0 flex-1"
              placeholder={placeholder}
              value={value}
              onChange={(e) => updateRow(index, e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary shrink-0 px-3"
              onClick={() => removeRow(index)}
              title="Remove link"
              disabled={rows.length === 1 && !value.trim()}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary inline-flex text-sm" onClick={addRow}>
        <Plus className="mr-1 h-4 w-4" />
        Add link
      </button>
    </div>
  );
}
