# fuzzy-search

An ultra small, highly customizable fuzzy search library.

## fuzzySearch

### Description

Takes in a search string and a list of items, and returns
a filtered list of strings that match fuzzily with any strings 
in the list of items provided.

Optionally can take in settings to configure the searching
logic. If not provided, will use default settings.

### Usage

```ts
let searchResults: string[] = fuzzySearch(searchString, items);

/*----------------------------- OR -----------------------------*/

let fuzzyMatchSettings = new FuzzyMatchSettings(...);
let searchResults: string[] = fuzzySearch(searchString, items, fuzzyMatchSettings);
```

### Note

If fuzzySearch() is to be called repeatedly in a short period of time,
it is recommended to pass your own searchSettings for better performance.

## fuzzySearchByProperty

### Description

Takes in a search string and a list of objects, and returns
a filtered list of objects, by performing fuzzy matching on
the specified property of those objects.

Optionally can take in settings to configure the searching
logic. If not provided, will use default settings.

### Usage

```ts
let searchResults: T[] = fuzzySearchByProperty(searchString, items, "property_name");

/*------------------------------------------ OR -----------------------------------------------*/

let fuzzyMatchSettings = new FuzzyMatchSettings(...);
let searchResults: T[] = fuzzySearchByProperty(searchString, items, "property_name", fuzzyMatchSettings);
```

## FuzzyMatchSettings

### Description

Settings that will be passed to the fuzzy search function to
customize how the implementation will perform the search.

### Usage

```ts
let fuzzyMatchSettings = new FuzzyMatchSettings();

/*---------------------- OR ------------------------*/

let fuzzyMatchSettings = new FuzzyMatchSettings(
    minimum_length_for_search,
    minimum_length_for_fuzzy_match,
    percentage_allowed_mismatch,
    case_sensitive_match
);
```

### Note

- Choice of settings can impact fuzzy search speed performance
- If invalid settings are passed, an exception will be thrown.
