declare function isAddressUsedX(addr: string): Promise<boolean>;
declare function getAddressDetailX(addr: string): Promise<any>;
declare function getAddressChains(addrs: string[]): Promise<any>;
export { getAddressDetailX, isAddressUsedX, getAddressChains };
