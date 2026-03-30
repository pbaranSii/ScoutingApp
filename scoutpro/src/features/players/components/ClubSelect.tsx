import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useClubs } from "../hooks/usePlayers";

type ClubSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional names to show first in the list (e.g. Gospodarz, Gość from match header). */
  priorityNames?: string[];
};

export function ClubSelect({ value, onChange, placeholder, disabled, priorityNames = [] }: ClubSelectProps) {
  const { data: clubs = [], isLoading, isError } = useClubs();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputValue = isOpen ? query : value;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchingClubs = !normalized
      ? clubs
      : clubs.filter((club) => club.name.toLowerCase().includes(normalized));
    const matchingPriority = !normalized
      ? priorityNames.filter((n) => n.trim())
      : priorityNames.filter(
          (n) => n.trim() && n.toLowerCase().includes(normalized)
        );
    const prioritySet = new Set(matchingPriority);
    const restClubs = matchingClubs.filter((c) => !prioritySet.has(c.name));
    return [...matchingPriority, ...restClubs.map((c) => c.name)];
  }, [clubs, query, priorityNames]);

  const handleChange = (next: string) => {
    setQuery(next);
    onChange(next);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setQuery(value);
          setIsOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120);
        }}
        onChange={(event) => handleChange(event.target.value)}
      />
      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1 text-sm">
            {isLoading && (
              <div className="px-3 py-2 text-slate-500">Ładowanie klubów...</div>
            )}
            {isError && (
              <div className="px-3 py-2 text-red-600">Nie udało się pobrać klubów.</div>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="px-3 py-2 text-slate-500">Brak wyników.</div>
            )}
            {!isLoading &&
              !isError &&
              filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(name);
                    setQuery(name);
                    setIsOpen(false);
                  }}
                >
                  {name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
