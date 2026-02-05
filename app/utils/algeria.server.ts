import algeria from '../../data/algeria-locations.json';

export type AlgeriaLocation = {
  name: string;
  code: string;
  baladiyas: string[];
};

export function getAlgeriaLocations(): AlgeriaLocation[] {
  return algeria as AlgeriaLocation[];
}
