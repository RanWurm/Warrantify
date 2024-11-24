from flask import Flask, request, jsonify
from flask_cors import CORS
from autocomplete_logic import load_products
from predict_algorithms.trie.generate_trie import load_trie

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load product data and initialize trie
folder_path = 'data_sets/'
products = load_products(folder_path)
unique_prods = sorted(list(set(products)))
trie = load_trie(unique_prods)

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    query = request.args.get('query', '').lower()
    if not query:
        return jsonify([])
    
    # Get suggestions from trie
    suggestions = trie.autocomplete(query, max_suggestions=10)
    return jsonify(suggestions)

if __name__ == '__main__':
    app.run(debug=True, port=5000)