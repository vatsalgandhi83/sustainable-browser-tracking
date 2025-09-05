import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

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

@app.route('/find-alternative', methods=['POST'])
def find_alternative():
    if not model:
        return jsonify({"error": "Gemini model is not configured"}), 500
        
    data = request.get_json()
    if not data or 'domain' not in data:
        return jsonify({"error": "Domain not provided"}), 400

    domain_to_check = data['domain']
    
    prompt = f"You are an expert in sustainable web development. Suggest one popular, direct, green-hosted alternative for the website '{domain_to_check}'. Return only the domain name of the alternative (e.g., 'ecosia.org') and nothing else."
    
    try:
        response = model.generate_content(prompt)
        alternative = response.text.strip().lower()
        
        if '.' not in alternative or ' ' in alternative or len(alternative) > 255:
             print(f"AI returned an invalid domain: {alternative}")
             return jsonify({"error": "AI did not return a valid domain"}), 500

        print(f"AI suggested '{alternative}' as an alternative for '{domain_to_check}'")
        return jsonify({"alternative": alternative})
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"error": "Failed to get AI suggestion"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)