export const PROPERTY_TYPES = ["Condo", "House", "Room"] as const;
export const HOUSING_TYPES = ["Shared", "Private"] as const;
export const LISTING_LEASE_LENGTHS = [
  "Daily",
  "4 Month",
  "8 Months",
  "12 Months",
] as const;
export const PREFERENCE_LEASE_LENGTHS = [
  "4 Month",
  "8 Months",
  "12 Months",
] as const;

const uniqueStrings = (value: string[]) => [...new Set(value)];

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return uniqueStrings(
    value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
    )
  );
};

export const normalizePropertyType = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed) return null;
  if (trimmed === "Studio") return "Room";

  return trimmed;
};

export const normalizeLeaseLength = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  switch (value.trim()) {
    case "Daily":
      return "Daily";
    case "4":
    case "4 Month":
    case "4 Months":
      return "4 Month";
    case "8":
    case "8 Month":
    case "8 Months":
      return "8 Months";
    case "12":
    case "12 Month":
    case "12 Months":
      return "12 Months";
    default:
      return null;
  }
};

const normalizeHousingType = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (trimmed === "Shared" || trimmed === "Private") {
    return trimmed;
  }

  return null;
};

const normalizeSelectionArray = (
  value: unknown,
  normalizer: (item: unknown) => string | null,
  allOptions: readonly string[]
) => {
  const normalized = normalizeStringArray(value)
    .map((item) => normalizer(item))
    .filter((item): item is string => item !== null);

  if (normalized.length === 0) {
    return null;
  }

  const unique = uniqueStrings(normalized).filter((item) =>
    allOptions.includes(item)
  );

  if (unique.length === 0 || unique.length === allOptions.length) {
    return null;
  }

  return unique;
};

const normalizeSingleOrArraySelection = (
  arrayValue: unknown,
  singleValue: unknown,
  normalizer: (item: unknown) => string | null,
  allOptions: readonly string[]
) => {
  const normalizedArray = normalizeSelectionArray(arrayValue, normalizer, allOptions);

  if (normalizedArray !== null) {
    return normalizedArray;
  }

  const single = normalizer(singleValue);

  if (!single || !allOptions.includes(single)) {
    return null;
  }

  return [single];
};

export const getListingLifestylePreferences = (
  value: Record<string, unknown> | null | undefined
): string[] => {
  if (!value) return [];

  const primary = normalizeStringArray(value.lifestylePreferences);

  if (primary.length > 0) {
    return primary;
  }

  return normalizeStringArray(value.lifestyleTags);
};

export const normalizeRenterPreferences = <
  T extends Record<string, unknown> | null | undefined,
>(
  prefs: T
) => {
  if (!prefs) return null;

  const propertyTypes = normalizeSingleOrArraySelection(
    prefs.propertyTypes,
    prefs.propertyType,
    normalizePropertyType,
    PROPERTY_TYPES
  );
  const housingTypes = normalizeSingleOrArraySelection(
    prefs.housingTypes,
    prefs.housingType,
    normalizeHousingType,
    HOUSING_TYPES
  );
  const leaseLengths = normalizeSingleOrArraySelection(
    prefs.leaseLengths,
    prefs.leaseLength,
    normalizeLeaseLength,
    PREFERENCE_LEASE_LENGTHS
  );

  return {
    ...prefs,
    propertyType: propertyTypes?.[0] ?? null,
    propertyTypes,
    housingType: housingTypes?.[0] ?? null,
    housingTypes,
    leaseLength: leaseLengths?.[0] ?? null,
    leaseLengths,
    lifestylePreferences: normalizeStringArray(prefs.lifestylePreferences),
  };
};

export const normalizeListingRecord = <T extends Record<string, unknown>>(listing: T) => ({
  ...listing,
  propertyType: normalizePropertyType(listing.propertyType),
  leaseLength: normalizeLeaseLength(listing.leaseLength),
  lifestylePreferences: getListingLifestylePreferences(listing),
});
