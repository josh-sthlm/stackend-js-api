/**
 * Sort order
 */
export enum Order {
  ASCENDING = 'ASCENDING',
  DESCENDING = 'DESCENDING',
  UNORDERED = 'UNORDERED'
}

export default Order;

/**
 * Invert the ordering
 * @param order
 * @returns {string}
 */
export function invertOrder(order: Order): Order {
  if (Order.ASCENDING === order) {
    return Order.DESCENDING;
  } else if (Order.DESCENDING === order) {
    return Order.ASCENDING;
  }

  return Order.UNORDERED;
}
