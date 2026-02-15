export { DICTIONARIES, getDictionaryById, getDictionaryByRoute } from "./config";
export type { DictionaryConfig, DictionaryId } from "./config";
export {
  useCreateDictionaryEntry,
  useDeleteDictionaryEntry,
  useDictionaryCounts,
  useDictionaryEntries,
  usePlayerSources,
  useRegions,
  useToggleDictionaryEntryActive,
  useUpdateDictionaryEntry,
} from "./hooks/useDictionaries";
export type { DictionaryRow } from "./api/dictionaries.api";
