import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useClubs } from "../hooks/usePlayers";

type ClubSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function ClubSelect({ value, onChange, placeholder, disabled }: ClubSelectProps) {
  const { data: clubs = [], isLoading, isError } = useClubs();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clubs;
    return clubs.filter((club) => club.name.toLowerCase().includes(normalized));
  }, [clubs, query]);

  const handleChange = (next: string) => {
    setQuery(next);
    onChange(next);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="relative">
      <Input
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setQuery(value);
          setIsOpen(true);
        }}
        onBlur={() => {
          setQuery(value);
          setTimeout(() => setIsOpen(false), 120);
        }}
        onChange={(event) => handleChange(event.target.value)}
      />
      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1 text-sm">
            {isLoading && (
              <div className="px-3 py-2 text-slate-500">Ladowanie klubow...</div>
            )}
            {isError && (
              <div className="px-3 py-2 text-red-600">Nie udalo sie pobrac klubow.</div>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="px-3 py-2 text-slate-500">Brak wynikow.</div>
            )}
            {!isLoading &&
              !isError &&
              filtered.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(club.name);
                    setQuery(club.name);
                    setIsOpen(false);
                  }}
                >
                  {club.name}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
