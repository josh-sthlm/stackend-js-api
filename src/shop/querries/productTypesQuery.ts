export default function productTypesQuery(first: number): string {
  return `productTypes (first: ${first || 100}) {
    edges {
      node
    }
  }`;
}
