//@flow

export default function imageQuery(imageMaxSize: number | null | undefined, includeOriginalSrc = false): string {
  return `
    altText,
    ${imageMaxSize ? 'url(transform: { maxWidth: ' + imageMaxSize + ' })' : 'url'}
    ${includeOriginalSrc ? ',url__originalSrc: url' : ''}
  `;
}
