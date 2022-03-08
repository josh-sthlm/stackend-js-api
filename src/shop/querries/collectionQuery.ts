import reducedProductQuery from './reducedProductQuery';

export default function collectionQuery(imageMaxWidth: number | null, includeOriginalSrc = false): string {
  return `
  id,
  handle,
  title,
  description,
  descriptionHtml,
  products (first: 100) {
    edges {
      node {
        ${reducedProductQuery(imageMaxWidth, includeOriginalSrc)}
      }
    }
  }
  `;
}
