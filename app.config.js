import 'dotenv/config';

export default {
  expo: {
    name: "Warrantify",
    slug: "Warrantify",
    version: "1.0.0",
    extra: {
      PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL,
	    SERVER_BACKEND_URL: process.env.SERVER_BACKEND_URL,
      GOOGLE_MAPS_API_KEY: "AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic",
      eas: {
       projectId: "bca12ca4-2486-4f34-9b60-305e7646965a"
    }
  },

    // "orientation": "portrait",
    // "icon": "./assets/images/icon.png",
    // "scheme": "myapp",
    // "userInterfaceStyle": "automatic",
    // "newArchEnabled": true,

    // "plugins": [
    //   "expo-router",
    //   "expo-font",
    //   "expo-secure-store",
    //   [
    //     "expo-splash-screen",
    //     {
    //       "image": "./assets/images/splash-icon.png",
    //       "imageWidth": 200,
    //       "resizeMode": "contain",
    //       "backgroundColor": "#ffffff"
    //     }
    //   ],
    //   [
    //     "expo-location",
    //     {
    //       "locationAlwaysAndWhenInUsePermission": "We use your location to find the nearest service centers.",
    //       "locationWhenInUsePermission": "We use your location to find the nearest service centers."
    //     }
    //   ]
    // ],

    // "ios": {
    //   "supportsTablet": true,
    //   "config": {
    //     "googleMapsApiKey": "AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic"
    //   },
    //   "infoPlist": {
    //     "NSLocationWhenInUseUsageDescription": "We use your location to find the nearest service centers.",
    //     "NSLocationAlwaysAndWhenInUseUsageDescription": "We use your location to find the nearest service centers."
    //   }
    // },

    // "android": {
    //   "googleServicesFile": "./google-services.json",
    //   "adaptiveIcon": {
    //     "foregroundImage": "./assets/images/adaptive-icon.png",
    //     "backgroundColor": "#ffffff"
    //   },
    //   "package": "com.ranwurm.Warrantify",
    //   "config": {
    //     "googleMaps": {
    //       "apiKey": "AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic"
    //     }
    //   },
    //   "permissions": ["ACCESS_FINE_LOCATION"]
    // },

    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },

    "experiments": {
      "typedRoutes": true
    },

    // "extra": {
    //   "router": {
    //     "origin": false
    //   },
    //   "eas": {
    //     "projectId": "bca12ca4-2486-4f34-9b60-305e7646965a"
    //   },
    //   "GOOGLE_MAPS_API_KEY": "AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic"
    // }
  },
};