// Temporarily disabled for standalone app
export const useNetworkAccess = () => {
  return {
    currentNetwork: null,
    isAuthorized: true,
    accessLevel: 'full',
    authorizedNetworks: [],
    networkStats: null,
    registerCurrentNetwork: async () => true,
    addNetwork: async () => '',
    removeNetwork: async () => true,
    refreshNetworks: async () => {},
    isLoading: false,
  };
}; 