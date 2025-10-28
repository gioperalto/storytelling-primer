import json, random
from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import anthropic

app = Flask(__name__)
CORS(app)

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Storytelling Primer API",
        "description": "API for managing storytelling tactics and structures. This API provides endpoints to retrieve storytelling cards by category, get random samples, and get AI-powered structure suggestions.",
        "version": "1.0.0",
        "contact": {
            "name": "Storytelling Primer"
        }
    },
    "basePath": "/",
    "schemes": [
        "http",
        "https"
    ],
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

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
    """
    Home page endpoint
    ---
    tags:
      - Home
    responses:
      200:
        description: Welcome message with API information
        content:
          text/html:
            schema:
              type: string
    """
    return "<h1>Storytelling Primer API</h1><h2>Storytelling Tactics endpoints</h2><p>Use /api/tactics to get all cards.</p><p>Use /api/tactics?category=[category] to filter.</p><p>Use /api/tactics/sample?full=[true/false] to get a random sample of each category.</p><p>Available categories: Concept, Explore, Character, Function, Structure, Style, Organize</p><p>Visit <a href='/api/docs'>/api/docs</a> for Swagger documentation.</p>"

@app.route('/api/tactics')
def get_tactics():
    """
    Get all storytelling tactics or filter by category
    ---
    tags:
      - Tactics
    parameters:
      - name: category
        in: query
        type: string
        required: false
        description: Filter tactics by category
        enum: [Concept, Explore, Character, Function, Structure, Style, Organize]
    responses:
      200:
        description: List of storytelling tactics
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                description: Unique identifier for the tactic
              title:
                type: string
                description: Title of the tactic
              category:
                type: string
                description: Category of the tactic
              description:
                type: string
                description: Detailed description of the tactic
              example:
                type: string
                description: Example usage of the tactic
    """
    category = request.args.get('category')
    if category:
        filtered_cards = [card for card in cards_data if card['category'].lower() == category.lower()]
        return jsonify(filtered_cards)
    return jsonify(cards_data)

@app.route('/api/tactics/sample')
def get_sample():
    """
    Get a random sample of storytelling tactics from different categories
    ---
    tags:
      - Tactics
    parameters:
      - name: full
        in: query
        type: string
        required: false
        default: "true"
        description: If true, returns 7 random cards (one from each category). If false, returns 3 random cards (Concept, Structure, Style)
        enum: ["true", "false"]
    responses:
      200:
        description: Random sample of storytelling tactics
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                description: Unique identifier for the tactic
              title:
                type: string
                description: Title of the tactic
              category:
                type: string
                description: Category of the tactic
              description:
                type: string
                description: Detailed description of the tactic
              example:
                type: string
                description: Example usage of the tactic
    """
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
    """
    Get AI-powered suggestions for storytelling structures based on a talk plan
    ---
    tags:
      - Structure Suggestions
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        description: Talk plan details to get structure suggestions for
        required: true
        schema:
          type: object
          properties:
            topic:
              type: string
              description: The main topic or subject of the talk
              example: "Climate change and its impact"
            audience:
              type: string
              description: The target audience
              example: "General public"
            goals:
              type: string
              description: The goals or objectives of the talk
              example: "Raise awareness and inspire action"
            duration:
              type: string
              description: Expected duration of the talk
              example: "20 minutes"
    responses:
      200:
        description: AI-generated structure suggestions
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: integer
                description: Unique identifier for the structure
              title:
                type: string
                description: Title of the suggested structure
              category:
                type: string
                description: Category (always "Structure")
              description:
                type: string
                description: Detailed description of the structure
              example:
                type: string
                description: Example usage of the structure
      400:
        description: Invalid request - Content-Type must be application/json
        schema:
          type: object
          properties:
            error:
              type: string
              example: "Content-Type must be application/json"
    """
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
