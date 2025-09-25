import json, random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

try:
    with open('data.json', 'r', encoding='utf-8') as f:
        cards_data = json.load(f)
except FileNotFoundError:
    cards_data = []

@app.route('/')
def home():
    return "<h1>Storyteller Tactics API</h1><p>Use /api/tactics to get all cards.</p><p>Use /api/tactics?category=[category] to filter.</p><p>Available categories: Concept, Explore, Character, Function, Structure, Style, Organize</p>"

@app.route('/api/tactics')
def get_tactics():
    category = request.args.get('category')
    if category:
        filtered_cards = [card for card in cards_data if card['category'].lower() == category.lower()]
        return jsonify(filtered_cards)
    return jsonify(cards_data)

@app.route('/api/sample')
def get_sample():
    random_sample = [
        random.choice([card for card in cards_data if card['category'] == 'Concept']),
        random.choice([card for card in cards_data if card['category'] == 'Explore']),
        random.choice([card for card in cards_data if card['category'] == 'Character']),
        random.choice([card for card in cards_data if card['category'] == 'Function']),
        random.choice([card for card in cards_data if card['category'] == 'Structure']),
        random.choice([card for card in cards_data if card['category'] == 'Style']),
        random.choice([card for card in cards_data if card['category'] == 'Organize'])
    ]

    return jsonify(random_sample)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
