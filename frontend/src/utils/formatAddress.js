export const formatAddress = (address) => {
  if (!address) return '';
  const parts = [];
  if (address.fullName) parts.push(address.fullName);
  if (address.phone) parts.push(`📞 ${address.phone}`);

  const locationParts = [];
  if (address.building) locationParts.push(`Bldg ${address.building}`);
  if (address.apartment) locationParts.push(`Apt ${address.apartment}`);
  if (address.addressLine) locationParts.push(address.addressLine);
  if (address.district) locationParts.push(address.district);
  if (address.city) locationParts.push(address.city);
  if (address.state) locationParts.push(address.state);
  if (address.zipCode) locationParts.push(address.zipCode);
  if (address.country) locationParts.push(address.country);

  if (locationParts.length > 0) parts.push(locationParts.join(', '));
  if (address.notes) parts.push(`Note: ${address.notes}`);

  return parts.join(' | ');
};

export const formatAddressShort = (address) => {
  if (!address) return '';
  const parts = [];
  if (address.building) parts.push(address.building);
  if (address.addressLine) parts.push(address.addressLine);
  if (address.city) parts.push(address.city);
  return parts.join(', ');
};

export const formatAddressMultiLine = (address) => {
  if (!address) return [];
  const lines = [];
  if (address.fullName) lines.push(address.fullName);

  const addrLine = [];
  if (address.building) addrLine.push(`Bldg ${address.building}`);
  if (address.apartment) addrLine.push(`Apt ${address.apartment}`);
  if (address.addressLine) addrLine.push(address.addressLine);
  if (address.district) addrLine.push(address.district);
  if (addrLine.length > 0) lines.push(addrLine.join(', '));

  const cityLine = [];
  if (address.city) cityLine.push(address.city);
  if (address.state) cityLine.push(address.state);
  if (address.zipCode) cityLine.push(address.zipCode);
  if (cityLine.length > 0) lines.push(cityLine.join(', '));

  if (address.country) lines.push(address.country);
  if (address.phone) lines.push(`📞 ${address.phone}`);
  if (address.notes) lines.push(`📝 ${address.notes}`);

  return lines;
};
