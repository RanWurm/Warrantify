from flask import Flask, request, jsonify
from flask_cors import CORS
from data_handler import load_products, reassign_user_ids, remove_rows_with_missing, process_csv, count_rows_with_missing
from predict_algorithms.trie.generate_trie import load_trie
from predict_algorithms.products.productRecommender import ProductRecommender
from predict_algorithms.products.knnProductRecommender import KNNProductRecommender
import pandas as pd
from pandas.errors import EmptyDataError
from datetime import datetime, timedelta
import random
import base64
import google.generativeai as genai
from PIL import Image
from io import BytesIO
import os
from dotenv import load_dotenv
from collections import Counter
from pymongo import MongoClient
import threading
import time
from cache_manager import WarrantyCacheManager


MONGO_URL ="mongodb+srv://ilanitber:12345679@cluster0.m4fkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URL)
db = client.get_database('test') 
warranty_ads_collection = db['WarrantyAd']

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

api_key = os.getenv("GENAI_API_KEY")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")


trie = None
products_from_db = []
last_trie_update = None
# update trie every 50 hours
TRIE_UPDATE_INTERVAL = 180000000

CSV_PATH = 'data_sets/recommendation_sys_datasets/buying_users.csv'


def fetch_products_from_adboard():
    """Fetch all unique product names from the AdBoard collection"""
    try:
        print("🔄 Fetching products from AdBoard...")
        
        # Get all ads from the WarrantyAd collection
        ads = list(warranty_ads_collection.find({}, {"productName": 1, "_id": 0}))
        
        # Extract unique product names
        product_names = list(set([ad.get("productName", "").lower().strip() 
                                for ad in ads 
                                if ad.get("productName")]))
        
        # Filter out empty strings
        product_names = [name for name in product_names if name]
        
        print(f"📦 Found {len(product_names)} unique products in AdBoard")
        return product_names
        
    except Exception as e:
        print(f"❌ Error fetching products from MongoDB: {e}")
        return []

def build_trie_from_db():
    """Build trie from products in the database"""
    global trie, products_from_db, last_trie_update
    
    try:
        print("🏗️ Building trie from database products...")
        
        # Fetch fresh products from database
        products_from_db = fetch_products_from_adboard()
        
        if not products_from_db:
            print("⚠️ No products found in database, falling back to file-based trie")
            # Fallback to original file-based approach
            folder_path = 'data_sets/words_prediction_datasets'
            file_products = load_products(folder_path)
            unique_prods = sorted(list(set(file_products)))
            trie = load_trie(unique_prods)
        else:
            # Build trie from database products
            unique_prods = sorted(list(set(products_from_db)))
            trie = load_trie(unique_prods)
            print(f"✅ Trie built successfully with {len(unique_prods)} products")
        
        last_trie_update = time.time()
        
    except Exception as e:
        print(f"❌ Error building trie: {e}")
        # Fallback to file-based approach
        try:
            folder_path = 'data_sets/words_prediction_datasets'
            file_products = load_products(folder_path)
            unique_prods = sorted(list(set(file_products)))
            trie = load_trie(unique_prods)
            print("✅ Fallback trie built from files")
        except Exception as fallback_error:
            print(f"❌ Fallback trie building also failed: {fallback_error}")

def should_update_trie():
    """Check if trie should be updated based on time interval"""
    global last_trie_update
    
    if last_trie_update is None:
        return True
    
    return (time.time() - last_trie_update) > TRIE_UPDATE_INTERVAL

def update_trie_if_needed():
    """Update trie if needed"""
    if should_update_trie():
        print("⏰ Trie update interval reached, rebuilding...")
        build_trie_from_db()

def trie_updater():
    """Background thread function to update trie periodically"""
    while True:
        time.sleep(60)  # Check every minute
        update_trie_if_needed()


@app.route('/scan_recepit', methods=['POST'])
def scan_receipt(): 
    print("in scan")
    try:
        data = request.get_json()
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        # 1. Decode the base64 string to an image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_bytes))  # Use BytesIO to create a file-like object

        # 2. Create the prompt
        prompt = f"""
        Extract the following information from the attached receipt image and return it as a string where each field is separated by a pipe symbol (|).  If a piece of information cannot be found, leave that field blank.  The order of the fields *must* be:

        productName|model|purchaseDate|manufacturer|expirationDate|price

        For example, if only the productName and price are found, the output should be:

        ProductNameValue|||ManufacturerValue||PriceValue

        Do not include any other text or explanations. Return *only* the pipe-delimited string. If no information at all can be extracted, return a string with empty values for all fields, like this:

        |||||

        """  # Improved prompt
        print("in talk with gemini")
        response = model.generate_content([prompt, image])
        extracted_text = response.text.strip() # Remove leading/trailing whitespace

        # 1. Split the string by the pipe delimiter
        extracted_list = extracted_text.split("|")

        # 2. Create a dictionary (which can easily be converted to JSON)
        extracted_dict = {
            "productName": extracted_list[0] if len(extracted_list) > 0 else "",
            "model": extracted_list[1] if len(extracted_list) > 1 else "",
            "purchaseDate": extracted_list[2] if len(extracted_list) > 2 else "",
            "manufacturer": extracted_list[3] if len(extracted_list) > 3 else "",
            "expirationDate": extracted_list[4] if len(extracted_list) > 4 else "",
            "price": extracted_list[5] if len(extracted_list) > 5 else ""
        }

        print("scan ok")
        return jsonify(extracted_dict), 200  # Return the dictionary as JSON


    except Exception as e:
        print("scan bad  here error")
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

    
# # Load product data and initialize trie
# folder_path = 'data_sets/words_prediction_datasets'
# products = load_products(folder_path)
# unique_prods = sorted(list(set(products)))
# trie = load_trie(unique_prods)

print("🚀 Initializing trie on startup...")
build_trie_from_db()

# Start background thread
trie_thread = threading.Thread(target=trie_updater, daemon=True)
trie_thread.start()
data_file_path = 'data_sets/recommendation_sys_datasets/buying_users.csv'

recommender = KNNProductRecommender(data_file_path,k=5)

icon_defaults = {
    "cpu": "chip",
    "gpu": "chip",
    "soundcard": "developer-board",
    "sound_card": "developer-board",
    'videocards':"developer-board",
    "motherboard": "developer-board",
    "ram": "memory",
    "storage": "storage_icon",
    "network": "network_icon",
    "power": "power_icon",
    "cartrige":"printer",
    "hdd":"harddisk",
    "tv":"television-classic",
}

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    query = request.args.get('query', '').lower()
    if not query:
        return jsonify([])
    
    # Update trie if needed before serving autocomplete
    update_trie_if_needed()
    
    # Get suggestions from trie
    if trie is None:
        print("⚠️ Trie is None, rebuilding...")
        build_trie_from_db()
    
    if trie is not None:
        suggestions = trie.autocomplete(query, max_suggestions=5)
        return jsonify(suggestions)
    else:
        print("❌ Trie is still None after rebuild attempt")
        return jsonify([])

@app.route('/health', methods=['GET'])
def health():
    return "Python server is running!"

DATA_CSV = 'data_sets/user_warranties.csv'
try:
    warranties_df = pd.read_csv(DATA_CSV)
except (EmptyDataError, FileNotFoundError):
    warranties_df = pd.DataFrame(columns=['user_id','product_id','category_code','brand'])

@app.route('/get_recommendation', methods=['POST'])
def get_recommendation():
    # Parse the JSON payload.
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Expecting a payload with keys "products" and "event_type".
    user_products = data.get('products')
    event_type = data.get('event_type')
    user_id = data.get('user_id') 
    
    print(f"[🐚] User_products={user_products}")
    print(f"[🐚] Event_type={event_type}")
    print(f"[🐚] User_id={user_id} \n")
        
    if not event_type or (not user_products and user_id is None):
        print("im here")
        return jsonify({'error': 'Missing required field: userId'}), 400

    # Get recommendations using your KNN recommender.
    recommendations = recommender.recommend(user_products, event_type)
    
    # Return the recommendations as JSON.
    return jsonify({'recommendations': recommendations}), 200
    
@app.route('/get_warranties', methods=['GET'])
def get_warranties():
    row = request.args.get('user_id', type=int)
    user_id = df.loc[row - 1, 'user_id']
    print("user id is :" , user_id)
    if user_id is None:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Filter events for the given user_id
    user_events = df[df['user_id'] == user_id]
    
    warranties = []
    today = datetime.now()
    
    for _, event in user_events.iterrows():
        # Extract last word from category_code
        category_code = event['category_code']
        title = category_code.split('.')[-1] if '.' in category_code else category_code
        
        # Subtitle is the brand
        subtitle = event['brand']
        
        # Generate a random date within the last year
        random_days = random.randint(0, 365)
        warranty_date = today - timedelta(days=random_days)
        date_str = warranty_date.strftime('%d/%m/%Y')
        
        # Calculate timeAgo
        days_diff = (today - warranty_date).days
        if days_diff < 30:
            timeAgo = f"{days_diff} days ago"
        elif days_diff < 365:
            months = days_diff // 30
            timeAgo = f"in {months} months" if random.choice([True, False]) else f"{months} months ago"
        else:
            years = days_diff // 365
            timeAgo = f"{years} year ago" if years == 1 else f"{years} years ago"
        
        # Icon name based on title (assuming iconName matches title)
        iconName = title.lower()
        if iconName in icon_defaults:
            iconName = icon_defaults[iconName]
        
        
        # Calculate progress percentage (0% to 100%)
        progress = (days_diff / 365) * 100
        progress = min(max(progress, 0), 100)  # Ensure progress is between 0 and 100
        
        warranty_item = {
            'title': title,
            'subtitle': subtitle,
            'date': date_str,
            'timeAgo': timeAgo,
            'iconName': iconName,
            'progress': progress,  # Represented as a percentage (0 to 100)
        }
        
        warranties.append(warranty_item)
    
    return jsonify({'warranties': warranties})

@app.route('/top_products', methods=['GET'])
def top_products():
    # Count categories from the entire dataset, not just recommendations
    all_categories = [
        row.split('.')[-1].capitalize() 
        for row in recommender.data['category_code'].dropna()
    ]
    
    # Count top 5
    counter = Counter(all_categories)
    top = counter.most_common(5)
    
    # Split into labels and values
    labels = [item[0] for item in top]
    values = [item[1] for item in top]
    
    return jsonify({'labels': labels, 'values': values})


def handle_warranty_flush(warranty_batch):
    if not warranty_batch:
        print("⚠️ No warranties to flush.")
        return

    print(f"\n🚿 Auto-flush triggered: Flushing {len(warranty_batch)} warranties to CSV: {CSV_PATH} \n")

    for i, item in enumerate(warranty_batch, 1):
        print(f"📦 Warranty {i}:")
        print(f"  - user_id: {item.get('user_id')}")
        print(f"  - productName: {item.get('productName')}")
        print(f"  - product_id:{item.get('warranty_id')} ")
        print("")

    rows = []
    for item in warranty_batch:
        rows.append({
            "event_type": "purchase",
            "product_id": item.get('warranty_id'),
            "category_id": " ",  
            "category_code": " ", 
            "brand": " ",
            "user_id": item.get('user_id')
        })

    df = pd.DataFrame(rows)
    print("✅" + df.head())  

    print("-----------------------------------------------------")
    print("DEBUG full batch:", warranty_batch)

    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    df.to_csv(CSV_PATH, mode='a', header=not os.path.exists(CSV_PATH), index=False)

warranty_cache = WarrantyCacheManager(flush_callback=handle_warranty_flush,flush_threshold=2)

@app.route('/add_warranty', methods=['POST'])
def add_warranty():
    data = request.json
    warranty_cache.add_warranty(data)
    return jsonify({"status": "warranty cached", "current_count": warranty_cache.get_counter()})

@app.route('/flush_warranty_cache', methods=['GET'])
def flush_warranty_cache():
    cache_data = warranty_cache.get_and_clear_cache()
    return jsonify({"cached_warranties": cache_data})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    
 