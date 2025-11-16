import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "7169f04063974bbc9167ef7d829cee52", 
  requiresAuth: true // Ensure authentication is required for all operations
});
