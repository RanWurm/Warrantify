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
# from scripts.export_warranties import export_warranties

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

api_key = os.getenv("GENAI_API_KEY")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

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

    
# Load product data and initialize trie
folder_path = 'data_sets/words_prediction_datasets'
products = load_products(folder_path)
unique_prods = sorted(list(set(products)))
trie = load_trie(unique_prods)

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
    
    # Get suggestions from trie
    suggestions = trie.autocomplete(query, max_suggestions=5)
    
    return jsonify(suggestions)

@app.route('/health', methods=['GET'])
def health():
    return "Python server is running!"


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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
    

   ########################################## process the data sets to have a managable dataset ######################################################
   
   # 1) removed all 5+ years old data
   # 2) replace all of the products id with their real product name by crossing the data from reviews datasets and meta data
   # 3) remove uncessary fileds such as imgs videos texts and etc
   # 4) aggragate all the users so instead of each use will have x lines now for each user we have 1 row that contains all of products and their reviews
   # 5) removed all of the users with 1 review
   # 6) removed all of the products the purchesd only once
   # 7) we are ready for creating the matrix factorization / collaborati filltering model we are left with 96k dirrent useres and 72k diffrent items

    # fileds_to_remove = ["timestamp","parent_asin","asin"]
    # print('start to merge titles')
    # filter_large_jsonl_by_timestamp('data_sets/recommendation_sys_datasets/c.jsonl', 'data_sets/recommendation_sys_datasets/filterd_electronics_by_timestmp.jsonl')
    # process_large_jsonl_fields('data_sets/recommendation_sys_datasets/merged_files.jsonl','data_sets/recommendation_sys_datasets/a.jsonl',fileds_to_remove)
    # merge_titles('data_sets/recommendation_sys_datasets/filterd_electronics_reviews_text.jsonl','data_sets/recommendation_sys_datasets/filtered_meta_electronics.jsonl','data_sets/recommendation_sys_datasets/merged_files.jsonl')
    # count_distinct_fields('data_sets/recommendation_sys_datasets/c.jsonl','title')
    # count_distinct_titles('data_sets/recommendation_sys_datasets/e.jsonl')
    # filter_large_jsonl('data_sets/recommendation_sys_datasets/d.jsonl','data_sets/recommendation_sys_datasets/e.jsonl')
    # aggregate_user_product_ratings('data_sets/recommendation_sys_datasets/a.jsonl','data_sets/recommendation_sys_datasets/c.jsonl')
    # print('filter the meta_electronics is done')
    
    ## note this is'nt the full data processing that occoured , i've deleted many many parts in the process
    
   ####################################################################################################################################################
    #csv_input_path = 'data_sets/recommendation_sys_datasets/buying_users.csv'
    #missing_rows_csv_output_path = 'data_sets/recommendation_sys_datasets/data_with_missing_rows.csv'
    #csv_output_path = 'data_sets/recommendation_sys_datasets/bu.csv'
    # process_csv(csv_input_path,missing_rows_csv_output_path)
    # remove_rows_with_missing(missing_rows_csv_output_path,csv_output_path)
   
    
    
    #analyze_recommendation_potential(csv_output_path)
    # recommender = load_and_test_recommender(path, sample_size=1000)
    #load_csv_data_and_test_recommender(csv_output_path)
    
    #reassign_user_ids(csv_input_path,csv_output_path)
    
    