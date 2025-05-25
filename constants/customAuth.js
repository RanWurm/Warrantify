// customAuth.js - Drop-in replacement for Firebase Auth
import * as SecureStore from 'expo-secure-store';

// Your server URL - update this to match your server
const SERVER_URL = 'http://192.168.1.245:3000';

// Custom User class to mimic Firebase User
class CustomUser {
  constructor(userData, token) {
    this.uid = userData.id?.toString() || userData._id?.toString();
    this.email = userData.email;
    this.displayName = `${userData.firstname} ${userData.lastname}`;
    this.photoURL = userData.image || null;
    this.emailVerified = true; // Assuming verified for simplicity
    this.isAnonymous = false;
    this.metadata = {
      creationTime: userData.createdAt,
      lastSignInTime: new Date().toISOString()
    };
    this.providerData = [{
      providerId: 'password',
      uid: this.uid,
      displayName: this.displayName,
      email: this.email,
      photoURL: this.photoURL
    }];
    
    // Store the full user data and token for internal use
    this._userData = userData;
    this._token = token;
  }

  // Method to get user token (similar to Firebase getIdToken)
  async getIdToken(forceRefresh = false) {
    return this._token;
  }
}

// Event emitter for auth state changes
class AuthStateManager {
  constructor() {
    this.listeners = [];
    this.currentUser = null;
  }

  addListener(callback) {
    this.listeners.push(callback);
    // Delay the initial call to ensure router is ready
    setTimeout(() => {
      callback(this.currentUser);
    }, 100);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(user) {
    this.currentUser = user;
    this.listeners.forEach(callback => callback(user));
  }
}

const authStateManager = new AuthStateManager();

// Custom Auth class to mimic Firebase Auth
class CustomAuth {
  constructor() {
    this.currentUser = null;
    this._initializeAuth();
  }

  async _initializeAuth() {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        // Verify token is still valid by calling userdata endpoint
        const response = await fetch(`${SERVER_URL}/userdata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
        
        const result = await response.json();
        
        if (result.Status === 'Ok') {
          const user = new CustomUser(result.data, token);
          this.currentUser = user;
          authStateManager.notifyListeners(user);
          return;
        } else {
          // Token invalid, clear storage
          await this._clearAuthData();
        }
      }
      
      // No valid auth found
      authStateManager.notifyListeners(null);
    } catch (error) {
      console.error('Auth initialization error:', error);
      authStateManager.notifyListeners(null);
    }
  }

  async _clearAuthData() {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    this.currentUser = null;
  }

  // Sign in method (you'll need to add this to your components)
  async signInWithEmailAndPassword(email, password) {
    try {
      const response = await fetch(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      
      if (result.status === 'ok' && result.data) {
        const token = result.data;
        
        // Get user data
        const userDataResponse = await fetch(`${SERVER_URL}/userdata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });
        
        const userDataResult = await userDataResponse.json();
        
        if (userDataResult.Status === 'Ok') {
          // Store auth data
          await SecureStore.setItemAsync('userToken', token);
          await SecureStore.setItemAsync('userData', JSON.stringify(userDataResult.data));
          
          // Create user object
          const user = new CustomUser(userDataResult.data, token);
          this.currentUser = user;
          
          // Notify listeners
          authStateManager.notifyListeners(user);
          
          return { user };
        }
      }
      
      throw new Error(result.data || 'Login failed');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Create user method (you'll need to add this to your components)
  async createUserWithEmailAndPassword(email, password, firstname, lastname) {
    try {
      const response = await fetch(`${SERVER_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstname, lastname, email, password })
      });

      const result = await response.json();
      
      if (result.status === 'ok') {
        // After successful registration, sign in the user
        return await this.signInWithEmailAndPassword(email, password);
      }
      
      throw new Error(result.data || 'Registration failed');
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
}

// Create auth instance
export const auth = new CustomAuth();

// Export User type for TypeScript compatibility
export const User = CustomUser;

// onAuthStateChanged function - mimics Firebase exactly
export const onAuthStateChanged = (authInstance, callback) => {
  return authStateManager.addListener(callback);
};

// signOut function - mimics Firebase exactly
export const signOut = async (authInstance) => {
  try {
    await authInstance._clearAuthData();
    authStateManager.notifyListeners(null);
  } catch (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

// Additional exports for compatibility
export const getAuth = () => auth;

// Helper function to get current user token (for API calls)
export const getCurrentUserToken = async () => {
  return await SecureStore.getItemAsync('userToken');
};