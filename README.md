# 🍃 Sustainable Browsing Tracker

A browser extension designed to help you understand and reduce the environmental impact of your internet usage. Get real-time feedback on websites, track your digital carbon footprint, and discover greener alternatives, all while earning points and badges for your eco-friendly habits.

## ✨ Features

-   **Eco-Dashboard**: A sleek popup that summarizes your daily impact, including estimated CO2 emissions, green sites visited, and your current points total.
-   **Green Hosting Detection**: Instantly see if the website you're visiting is powered by renewable energy, using data from The Green Web Foundation.
-   **AI-Powered Suggestions**: For sites not running on green energy, get an intelligent, AI-generated recommendation for a sustainable alternative.
-   **Gamification System**: Earn points for visiting green sites and making sustainable choices. Unlock badges like "Eco Starter" and "Eco Warrior" to mark your progress.
-   **Low Power Mode**: Activate a grayscale filter on any webpage with a single click to reduce your device's energy consumption.
-   **Real-time Notifications**: Get notified when you land on a non-green site and receive suggestions for better alternatives.

## 🚀 How It Works

The project is a combination of a browser extension and a lightweight backend server.

1.  **Browser Extension**: The core of the experience.
    -   `background.js`: A service worker that runs constantly, listening for page loads. It communicates with The Green Web Foundation API to check a domain's green status and updates your usage statistics.
    -   `popup.html` & `popup.js`: The user interface you see when you click the extension icon. It fetches and displays your latest stats from storage.
    -   `content.js`: A script injected into web pages to enable features that interact with the page's content, like the Low Power (grayscale) mode.
2.  **Backend Server**: A simple Python Flask server.
    -   `app.py`: Provides a single API endpoint (`/find-alternative`). The extension sends a non-green domain to this endpoint, and the server uses the Google Gemini API to generate a creative, sustainable alternative.

## 🛠️ Tech Stack

-   **Frontend (Browser Extension)**:
    -   HTML5
    -   JavaScript (ES6 Modules)
    -   Tailwind CSS for styling
    -   Lucide Icons for a clean, modern look
    -   `esbuild` for bundling JavaScript

-   **Backend (AI Server)**:
    -   Python 3
    -   Flask
    -   Google Generative AI (Gemini)

-   **APIs & Services**:
    -   The Green Web Foundation API
    -   Chrome Extension APIs (Storage, Tabs, Notifications)

## ⚙️ Installation and Setup

To get this project running locally, you'll need to set up both the backend server and the browser extension.

### Prerequisites

-   [Node.js](https://nodejs.org/) (which includes `npm`)
-   [Python 3](https://www.python.org/downloads/) and `pip`

---

### 1. Backend Server Setup

The server handles the AI suggestions.

```bash
# 1. Navigate to the server directory
cd server

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create an environment file
touch .env

# 4. Add your Gemini API key to the .env file
#    Get your key from Google AI Studio
echo "GEMINI_API_KEY='YOUR_API_KEY_HERE'" > .env

# 5. Run the server
python app.py

# The server will now be running on [http://127.0.0.1:5000](http://127.0.0.1:5000)