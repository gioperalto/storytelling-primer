import json, random
from flask import Flask, jsonify, request
from flask_cors import CORS
import anthropic

app = Flask(__name__)
CORS(app)

# Initialize Anthropic client
# The API key will be automatically loaded from the ANTHROPIC_API_KEY environment variable
client = anthropic.Anthropic()

try:
    with open('data.json', 'r', encoding='utf-8') as f:
        cards_data = json.load(f)
except FileNotFoundError:
    cards_data = []

@app.route('/')
def home():
    return "<h1>Storytelling Primer API</h1><h2>Storytelling Tactics endpoints</h2><p>Use /api/tactics to get all cards.</p><p>Use /api/tactics?category=[category] to filter.</p><p>Use /api/tactics/sample?full=[true/false] to get a random sample of each category.</p><p>Available categories: Concept, Explore, Character, Function, Structure, Style, Organize</p>"

@app.route('/api/tactics')
def get_tactics():
    category = request.args.get('category')
    if category:
        filtered_cards = [card for card in cards_data if card['category'].lower() == category.lower()]
        return jsonify(filtered_cards)
    return jsonify(cards_data)

@app.route('/api/tactics/sample')
def get_sample():
    full = request.args.get('full', 'true').lower() == 'true'
    random_sample = [
        random.choice([card for card in cards_data if card['category'] == 'Concept']),
        random.choice([card for card in cards_data if card['category'] == 'Structure']),
        random.choice([card for card in cards_data if card['category'] == 'Style'])
    ]
    
    if full:
        random_sample.extend([
            random.choice([card for card in cards_data if card['category'] == 'Explore']),
            random.choice([card for card in cards_data if card['category'] == 'Character']),
            random.choice([card for card in cards_data if card['category'] == 'Function']),
            random.choice([card for card in cards_data if card['category'] == 'Organize'])
        ])

    return jsonify(random_sample)

@app.route('/api/tactics/structure/suggest', methods=['POST'])
def get_suggested_structures():
    if request.is_json:
        data = request.get_json()
        structures = [card for card in cards_data if card['category'] == 'Structure']
        summarized_talk_plan = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Convey the information from the attributes and values of the following JSON object in a no more than three sentences:\n{data}"
                    )
                }
            ]
        )
        talk_plan_summary = summarized_talk_plan.content[0].text
        suggestions = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Suggest three storytelling structures based on this summary:\n\n{talk_plan_summary}"
                        "\n\nUse the following structures as inspiration:" 
                        + "".join([f"\n\nTitle: {s['title']}.\nDescription: {s['description']}" for s in structures])
                        + "\n\nProvide the suggestions as a comma separated string of titles only."
                    )
                }
            ]
        )
        suggested_structures = [sugg.strip() for sugg in suggestions.content[0].text.split(',')]
        return jsonify([card for card in structures if card['title'] in suggested_structures])
    else:
        return jsonify({"error": "Content-Type must be application/json"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
