/**
 * Configuration of dictionaries shown in Settings.
 * "Preferowana noga" and "Decyzje rekrutacyjne" are not shown (managed elsewhere).
 */
export type DictionaryId =
  | "positions"
  | "player_sources"
  | "regions"
  | "clubs"
  | "categories"
  | "strengths"
  | "weaknesses"
  | "team_roles";

export interface DictionaryConfig {
  id: DictionaryId;
  table: string;
  namePl: string;
  nameEn: string;
  /** Column used as unique code (for display in list). */
  codeColumn: string;
  /** Primary display column (PL name). */
  nameColumn: string;
  /** Optional second name column (EN). */
  nameEnColumn?: string;
  /** Column for sort order. */
  orderColumn: string;
  /** Column for soft-delete / active flag. */
  activeColumn: string;
  /** Route segment for this dictionary. */
  route: string;
}

export const DICTIONARIES: DictionaryConfig[] = [
  {
    id: "positions",
    table: "positions",
    namePl: "Pozycje zawodników",
    nameEn: "Player positions",
    codeColumn: "code",
    nameColumn: "name",
    orderColumn: "display_order",
    activeColumn: "id",
    route: "positions",
  },
  {
    id: "player_sources",
    table: "dict_player_sources",
    namePl: "Źródła pozyskania",
    nameEn: "Player sources",
    codeColumn: "source_code",
    nameColumn: "name_pl",
    nameEnColumn: "name_en",
    orderColumn: "display_order",
    activeColumn: "is_active",
    route: "player-sources",
  },
  {
    id: "regions",
    table: "regions",
    namePl: "Województwa",
    nameEn: "Voivodeships",
    codeColumn: "code",
    nameColumn: "name",
    orderColumn: "display_order",
    activeColumn: "is_active",
    route: "regions",
  },
  {
    id: "clubs",
    table: "clubs",
    namePl: "Kluby piłkarskie",
    nameEn: "Football clubs",
    codeColumn: "id",
    nameColumn: "name",
    orderColumn: "id",
    activeColumn: "is_active",
    route: "clubs",
  },
  {
    id: "categories",
    table: "categories",
    namePl: "Kategorie wiekowe",
    nameEn: "Age categories",
    codeColumn: "id",
    nameColumn: "name",
    orderColumn: "id",
    activeColumn: "id",
    route: "categories",
  },
  {
    id: "strengths",
    table: "dict_strengths",
    namePl: "Mocne strony",
    nameEn: "Strengths",
    codeColumn: "code",
    nameColumn: "name_pl",
    nameEnColumn: "name_en",
    orderColumn: "display_order",
    activeColumn: "is_active",
    route: "strengths",
  },
  {
    id: "weaknesses",
    table: "dict_weaknesses",
    namePl: "Słabe strony",
    nameEn: "Weaknesses",
    codeColumn: "code",
    nameColumn: "name_pl",
    nameEnColumn: "name_en",
    orderColumn: "display_order",
    activeColumn: "is_active",
    route: "weaknesses",
  },
  {
    id: "team_roles",
    table: "dict_team_roles",
    namePl: "Rola w drużynie",
    nameEn: "Team role",
    codeColumn: "code",
    nameColumn: "name_pl",
    nameEnColumn: "name_en",
    orderColumn: "display_order",
    activeColumn: "is_active",
    route: "team-roles",
  },
];

export function getDictionaryByRoute(route: string): DictionaryConfig | undefined {
  return DICTIONARIES.find((d) => d.route === route);
}

export function getDictionaryById(id: DictionaryId): DictionaryConfig | undefined {
  return DICTIONARIES.find((d) => d.id === id);
}
