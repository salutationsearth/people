# peoPLE

A daily guessing game: which people group is today's person from? Six guesses.

```sh
pnpm install
pnpm dev
```

## Data

`public/data/groups.json` is generated, not committed. `pnpm dev` and `pnpm build` run `scripts/build-data.mts` first, which:

- fetches every people-group-in-country row from the [Joshua Project API](https://api.joshuaproject.net/) (needs `JOSHUA_PROJECT_API_KEY`), caching raw pages in `.cache/joshua-project/` (delete it to refresh),
- merges rows by PeopleID3 into one `Group` per people group (see `src/lib/types.ts`),
- adds language family and branch from [Glottolog](https://glottolog.org/) and continent/region from the UN M49 scheme, both precomputed in `scripts/data/` by `pnpm data:refs`,
- keeps a photo only when Joshua Project lists it under a Creative Commons licence that allows reuse (no ND licences), with its credit.

Without the key or a cache, the build falls back to `scripts/data/groups.sample.json`, the daily answers only. `public/data/daily.json` is the hand-written daily pool and is committed. `pnpm test` checks both files against the contract.

### Attribution

Data provided by [Joshua Project](https://joshuaproject.net/). Joshua Project data is for non-commercial use and must not be republished in bulk, which is why the generated file stays out of this repository. Language classification from [Glottolog](https://glottolog.org/) (CC BY 4.0). Photos are credited individually with their licence.
