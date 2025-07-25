// Temporarily disabled for standalone app
export const useRealTimeCollaboration = () => {
  return {
    connectedUsers: [],
    currentPageUsers: [],
    isConnected: false,
    broadcastUpdate: async () => {},
    updateUserStatus: async () => {},
    subscribe: () => () => {},
  };
}; 