import os
import re # Import the regular expression library
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-pro')
    print("Gemini model configured successfully.")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

def is_domain_green(domain):
    """Checks a domain against The Green Web Foundation API."""
    try:
        response = requests.get(f"https://api.thegreenwebfoundation.org/api/v3/greencheck/{domain}")
        if response.ok:
            return response.json().get('green', False)
    except Exception as e:
        print(f"Error checking green status for {domain}: {e}")
    return False

@app.route('/find-alternative', methods=['POST'])
def find_alternative():
    if not model:
        return jsonify({"error": "Gemini model is not configured"}), 500
        
    data = request.get_json()
    if not data or 'domain' not in data:
        return jsonify({"error": "Domain not provided"}), 400

    domain_to_check = data['domain']
    failed_suggestions = []
    
    for attempt in range(3):
        print(f"AI Suggestion Attempt #{attempt + 1} for {domain_to_check}")
        
        base_prompt = f"You are an expert in sustainable web development. Suggest one popular, direct, green-hosted alternative for the website '{domain_to_check}'. Return only the domain name of the alternative (e.g., 'ecosia.org') and nothing else."
        
        if failed_suggestions:
            exclusions = ", ".join(failed_suggestions)
            prompt = f"{base_prompt} Do not suggest any of the following domains: {exclusions}."
        else:
            prompt = base_prompt

        try:
            response = model.generate_content(prompt)
            ai_response_text = response.text.strip()

            # --- ROBUST PARSING LOGIC ---
            # Use regex to find the first valid domain in the AI's response
            match = re.search(r'[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', ai_response_text)
            
            if not match:
                print(f"AI returned text with no valid domain: {ai_response_text}")
                continue # Try again

            suggested_domain = match.group(0).lower()

            print(f"AI suggested '{suggested_domain}'. Verifying with Green Web API...")
            if is_domain_green(suggested_domain):
                print(f"SUCCESS: '{suggested_domain}' is a verified green alternative.")
                return jsonify({"alternative": suggested_domain})
            else:
                print(f"FAILED: '{suggested_domain}' is not a verified green site. Retrying...")
                failed_suggestions.append(suggested_domain)

        except Exception as e:
            print(f"An error occurred during AI suggestion or verification: {e}")
            continue

    print("All attempts to find a verified green alternative failed.")
    return jsonify({"error": "Failed to find a verified green alternative"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)