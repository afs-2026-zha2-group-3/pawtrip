export type DemoPetSearch = { breed?: string };

export function demoBreedFromSearch(search: DemoPetSearch | undefined): string | null {
  const breed = search?.breed?.trim();
  return breed ? breed : null;
}
