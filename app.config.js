import 'dotenv/config';

export default {
  expo: {
    name: "Warrantify",
    slug: "Warrantify",
    version: "1.0.0",
    extra: {
      PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL,
	  SERVER_BACKEND_URL: process.env.SERVER_BACKEND_URL,
    },
  },
};