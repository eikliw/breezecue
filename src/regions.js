export const US_REGIONS = {
  ALL: { name: 'All USA', coords: [39.8283, -98.5795], zoom: 4, areaCodes: [] }, // Empty means no filter
  NORTHEAST: { name: 'Northeast', coords: [42.5, -73.5], zoom: 6, areaCodes: ['ME', 'VT', 'NH', 'MA', 'RI', 'CT', 'NY', 'PA', 'NJ', 'DE', 'MD', 'DC'] },
  SOUTHEAST: { name: 'Southeast', coords: [34.0, -85.0], zoom: 6, areaCodes: ['WV', 'VA', 'KY', 'TN', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'AR', 'LA'] },
  MIDWEST: { name: 'Midwest', coords: [41.5, -93.0], zoom: 5, areaCodes: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'] },
  SOUTHWEST: { name: 'Southwest', coords: [34.5, -106.0], zoom: 6, areaCodes: ['OK', 'TX', 'NM', 'AZ', 'CO', 'UT'] },
  WEST: { name: 'West (CA, NV, HI)', coords: [37.0, -119.0], zoom: 5, areaCodes: ['CA', 'NV', 'HI'] }, 
  NORTHWEST: { name: 'Pacific Northwest', coords: [45.5, -120.0], zoom: 6, areaCodes: ['OR', 'WA', 'ID', 'MT', 'WY'] },
  ALASKA: { name: 'Alaska', coords: [64.0, -152.0], zoom: 4, areaCodes: ['AK'] },
  // Consider adding other regions like HAWAII separately or PUERTO_RICO if needed
  // HAWAII is covered by West for now, can be separated
  // PUERTO_RICO: { name: 'Puerto Rico / USVI', coords: [18.2, -66.5], zoom: 8, areaCodes: ['PR', 'VI'] }
};

export const REGION_OPTIONS = Object.keys(US_REGIONS).map(key => ({
  value: key,
  label: US_REGIONS[key].name
}));
