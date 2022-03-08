export default function shippingAddressQuery(): string {
  return `
  firstName,
  lastName,
  phone,
  company,
  address1,
  address2,
  zip,
  city,
  province,
  provinceCode,
  country,
  countryCodeV2
  `;
}
