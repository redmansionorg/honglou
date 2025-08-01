import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6871a6385a6d991a55f71bf0", 
  requiresAuth: true // Ensure authentication is required for all operations
});
