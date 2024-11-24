# Warrantify - Product Search Application

This project consists of a Flask backend for autocomplete functionality and a React Native frontend for the user interface. Below are the instructions to set up and run both parts of the application.

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn
- Expo CLI
- Git (optional)

## Backend Setup (Python/Flask)

1. Navigate to the backend directory:
```bash
cd projectgamr/python_backend
```

2. Create and activate a virtual environment (recommended):
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install required Python packages:
```bash
pip install flask flask-cors
```

4. Ensure you have your data files in the `data_sets/` directory
   - The application expects product data files in this directory
   - Create the directory if it doesn't exist

5. Run the Flask application:
```bash
python app.py
```

The backend server will start running on `http://localhost:5000`

## Frontend Setup (React Native/Expo)

1. Navigate to the frontend directory:
```bash
cd projectgamr/warrantify
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install specific required packages:
```bash
npm install expo-linear-gradient
# or
yarn add expo-linear-gradient
```

4. Start the Expo development server:
```bash
npx expo start
```

## Running the Application

1. Ensure both the backend and frontend are running:
   - Backend should be running on `http://localhost:5000`
   - Expo development server should be running (typically on port 19000)

2. To run on different devices:
   - iOS Simulator: Press 'i' in the Expo CLI
   - Android Emulator: Press 'a' in the Expo CLI
   - Physical Device: Scan the QR code with the Expo Go app

## Troubleshooting

### Backend Issues:
- Ensure all required Python packages are installed
- Check if the `data_sets/` directory exists and contains the required data files
- Verify that port 5000 is not in use by another application

### Frontend Issues:
- Make sure all Node.js dependencies are properly installed
- For iOS development, ensure you have Xcode installed
- For Android development, ensure you have Android Studio and an emulator set up
- If getting network errors, verify that the backend URL is correctly configured

### CORS Issues:
- The backend has CORS enabled by default
- If experiencing CORS issues, verify that the frontend is making requests to the correct backend URL

## Project Structure

```
projectgamr/
├── python_backend/
│   ├── app.py
│   ├── autocomplete_logic.py
│   └── data_sets/
└── warrantify/
    └── app/
        └── tabs/
            └── index.tsx
```

## Additional Notes

- The backend uses Flask for serving autocomplete suggestions
- The frontend is built with React Native and Expo for cross-platform compatibility
- The application uses a Trie data structure for efficient autocomplete functionality
- The UI includes animated suggestions and a gradient header

## Development

To modify the autocomplete behavior:
- Adjust the `max_suggestions` parameter in `app.py`
- Modify the Trie implementation in the backend
- Update the debounce timeout (currently 300ms) in the frontend

To modify the UI:
- Styles are defined at the bottom of `index.tsx`
- The color scheme can be adjusted in the LinearGradient component
- Animation timings can be modified in the useEffect hook
