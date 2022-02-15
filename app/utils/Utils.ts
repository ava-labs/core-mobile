export const truncateAddress = (address: string, size = 6): string => {
  const firstChunk = address.substring(0, size);
  const lastChunk = address.substr(-(size / 2));

  return `${firstChunk}...${lastChunk}`;
};
