export type Country = { iso3: string; name: string; population: number };

export type Group = {
  id: string;
  name: string;
  aliases: string[];
  countries: Country[];
  primaryCountries: string[];
  continent: string;
  region: string;
  lat: number;
  lon: number;
  population: number;
  religion: string;
  language: { name: string; iso639_3: string | null };
  languageFamily: string | null;
  languageBranch: string | null;
  photo: { url: string; credit: string; license: string; creditUrl?: string } | null;
};

export type DailyEntry = {
  groupId: string;
  blurb: string;
  clues: { greeting: string; dress: string; food: string; music: string; symbols: string };
};
