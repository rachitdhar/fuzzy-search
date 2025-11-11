// Fuzzy Search Implementation

/*
DESCRIPTION:

    Settings that will be passed to the fuzzy search function to
    customize how the implementation will perform the search.

USAGE:

    let fuzzyMatchSettings = new FuzzyMatchSettings();

    ---------------------- OR ------------------------

    let fuzzyMatchSettings = new FuzzyMatchSettings(
        minimum_length_for_search,
        minimum_length_for_fuzzy_match,
        percentage_allowed_mismatch,
        case_sensitive_match
    );

IMPORTANT:

    - Choice of settings can impact fuzzy search speed performance
    - If invalid settings are passed, an exception will be thrown.
*/
export class FuzzyMatchSettings {
  // list of settings to configure for fuzzy match
  minimum_length_for_search: number; // for search string length less than this, a blank result is returned
  minimum_length_for_fuzzy_match: number; // for search string length less than this, only exact substring matches are returned
  percentage_allowed_mismatch: number; // the maximum percentage of chars that are allowed to mismatch for substring to be matched fuzzily
  case_sensitive_match: boolean; // if false, case is ignored while matching, else the matching will be case-sensitive

  // internal settings (not controllable)
  private maximum_allowed_mismatch: number = 50;
  private default__minimum_length_for_search: number = 1;
  private default__minimum_length_for_fuzzy_match: number = 5;
  private default__percentage_allowed_mismatch: number = 25;
  private default__case_sensitive_match: boolean = false;

  constructor(
    minimum_length_for_search?: number,
    minimum_length_for_fuzzy_match?: number,
    percentage_allowed_mismatch?: number,
    case_sensitive_match?: boolean
  ) {
    // validations to ensure that the settings being provided are allowed
    if (!minimum_length_for_search) minimum_length_for_search = this.default__minimum_length_for_search;
    if (!minimum_length_for_fuzzy_match) minimum_length_for_fuzzy_match = this.default__minimum_length_for_fuzzy_match;
    if (!percentage_allowed_mismatch) percentage_allowed_mismatch = this.default__percentage_allowed_mismatch;
    if (!case_sensitive_match) case_sensitive_match = this.default__case_sensitive_match;

    if (minimum_length_for_search <= 0) {
      throw new Error('Invalid value provided for minimum_length_for_search in FuzzyMatchSettings');
    }
    if (minimum_length_for_fuzzy_match <= 0) {
      throw new Error('Invalid value provided for minimum_length_for_fuzzy_match in FuzzyMatchSettings');
    }
    if (percentage_allowed_mismatch < 0 || percentage_allowed_mismatch > this.maximum_allowed_mismatch) {
      throw new Error('Invalid value provided for percentage_allowed_mismatch in FuzzyMatchSettings');
    }

    this.minimum_length_for_search = minimum_length_for_search;
    this.minimum_length_for_fuzzy_match = minimum_length_for_fuzzy_match;
    this.percentage_allowed_mismatch = percentage_allowed_mismatch;
    this.case_sensitive_match = case_sensitive_match;
  }
}

/*
DESCRIPTION:

    Takes in a search string and a list of items, and returns
    a filtered list of strings that match fuzzily with any strings 
    in the list of items provided.

    Optionally can take in settings to configure the searching
    logic. If not provided, will use default settings.

USAGE:

    let searchResults: string[] = fuzzySearch(searchString, items);

    ----------------------------- OR -----------------------------

    let fuzzyMatchSettings = new FuzzyMatchSettings(...);
    let searchResults: string[] = fuzzySearch(searchString, items, fuzzyMatchSettings);

IMPORTANT:

    If fuzzySearch() is to be called repeatedly in a short period of time,
    it is recommended to pass your own searchSettings for better performance.
*/
export function fuzzySearch(searchString: string, items: string[], searchSettings?: FuzzyMatchSettings): string[] {
  return fuzzySearchByProperty(searchString, items, null, searchSettings);
}

/*
DESCRIPTION:

    Takes in a search string and a list of objects, and returns
    a filtered list of objects, by performing fuzzy matching on
    the specified property of those objects.

    Optionally can take in settings to configure the searching
    logic. If not provided, will use default settings.

USAGE:

    let searchResults: T[] = fuzzySearchByProperty(searchString, items, "property_name");

    ------------------------------------------ OR -----------------------------------------------

    let fuzzyMatchSettings = new FuzzyMatchSettings(...);
    let searchResults: T[] = fuzzySearchByProperty(searchString, items, "property_name", fuzzyMatchSettings);
*/
export function fuzzySearchByProperty<T, K extends Extract<keyof T, string>>(
  searchString: string,
  items: T[],
  itemProperty: K | null,
  searchSettings?: FuzzyMatchSettings
): T[] {
  if (searchString.length === 0) return [];
  if (items.length === 0) return [];
  if (typeof items[0] !== 'string' && (itemProperty === null || typeof items[0][itemProperty] !== 'string')) {
    throw new Error('A string property must be provided to perform fuzzy search on an object');
  }
  const searchLength: number = searchString.length;

  // if search settings are not provided, set default settings
  if (!searchSettings) searchSettings = new FuzzyMatchSettings();

  if (searchLength < searchSettings.minimum_length_for_search) return [];

  if (searchLength < searchSettings.minimum_length_for_fuzzy_match) {
    // perform direct substring matches
    if (searchSettings.case_sensitive_match) {
      if (typeof items[0] === 'string') items.filter((x) => String(x).includes(searchString));

      return items.filter((x) => String(x[itemProperty]).includes(searchString));
    }

    if (typeof items[0] === 'string') items.filter((x) => String(x).toLowerCase().includes(searchString.toLowerCase()));

    return items.filter((x) => String(x[itemProperty]).toLowerCase().includes(searchString.toLowerCase()));
  }

  // set chars to lowercase if case-insensitive search is to be performed
  if (!searchSettings.case_sensitive_match) {
    searchString = searchString.toLowerCase();
  }

  let result: T[] = [];
  const max_allowed_mismatch_count: number = Math.floor((searchLength * searchSettings.percentage_allowed_mismatch) / 100);

  // perform fuzzy substring matches
  for (const item of items) {
    /*
        We can take a window of size equal to the searchString length,
        and keep scanning the chars in item using this window. As soon as
        we get a mismatch count greater than the max allowed mismatch count,
        we will skip the item. If we get an item that maintains a mismatch
        count less than or equal to the max allowed value, we push that item
        into the result.
        */
    const _item: string =
      typeof item === 'string'
        ? !searchSettings.case_sensitive_match
          ? item.toLowerCase()
          : item
        : !searchSettings.case_sensitive_match
          ? String(item[itemProperty]).toLowerCase()
          : String(item[itemProperty]);

    let left: number = 0;
    let current_mismatch_count: number = 0;

    while (left + searchLength - 1 < _item.length) {
      for (let i: number = left; i < left + searchLength; i++) {
        if (searchString[i - left] !== _item[i] && ++current_mismatch_count > max_allowed_mismatch_count) break;
      }
      if (current_mismatch_count <= max_allowed_mismatch_count) {
        result.push(item);
        break;
      }

      current_mismatch_count = 0;
      left++;
    }
  }
  return result;
}
