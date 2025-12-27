
# MECDA - Localhost Setup Instructions

Follow these steps to run the application on your computer:

### 1. Install Node.js
If you haven't already, download and install Node.js from [nodejs.org](https://nodejs.org/).

### 2. Prepare the Project
1. Create a new folder on your computer.
2. Copy all the project files (index.html, index.tsx, types.ts, etc.) into that folder.

### 3. Install Dependencies
Open your terminal (Command Prompt or VS Code Terminal) in the project folder and run:
```bash
npm install
```

### 4. Start the Application
Run the following command to start the local development server:
```bash
npm run dev
```

### 5. Open in Browser
Once the command finishes, open your browser and go to:
**http://localhost:5173**

---

### Local Database Information
This application uses **IndexedDB** for data persistence. 
- Your data is stored locally in your browser's internal database.
- Even if you refresh or close the browser, your records will remain.
- To clear the database, you can use the "Application" tab in Chrome DevTools.
