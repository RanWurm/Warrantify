import pandas as pd
import glob
import json
import sys
import time
import os
import re
import numpy as np
import csv
from tqdm import tqdm
from collections import Counter,defaultdict
from itertools import chain,islice
from typing import Optional, Tuple
from typing import Optional, Dict, Tuple
from datetime import datetime


# Load and preprocess product data
def load_products(dataset):
	res = []
	for file_path in glob.glob(f'{dataset}/*.csv'):
		data = pd.read_csv(file_path)
		products = data['name'].dropna().unique()
		res = list(chain(res, products))
	return [product.lower() for product in res]

# For very large files, add a streaming version
def process_large_jsonl_fields(input_file, output_file, fields_to_delete, chunk_size=1_000_000):
    """
    Processes large JSONL files in chunks to reduce memory usage.
    
    Args:
    input_file (str): Path to the input JSONL file
    output_file (str): Path to save the modified JSONL file
    fields_to_delete (list): List of field names to remove from each object
    chunk_size (int): Number of lines to process in each chunk
    
    Returns:
    int: Total number of lines processed
    """
    total_lines_processed = 0
    try:
        with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
            while True:
                # Read chunk of lines
                chunk = list(islice(infile, chunk_size))
                if not chunk:
                    break
                
                # Process chunk
                for line in chunk:
                    try:
                        obj = json.loads(line.strip())
                        
                        # Remove specified fields
                        for field in fields_to_delete:
                            obj.pop(field, None)
                        
                        # Write modified object
                        outfile.write(json.dumps(obj) + '\n')
                        total_lines_processed += 1
                    
                    except json.JSONDecodeError:
                        print(f"Warning: Skipping invalid JSON line: {line.strip()}")
        
        print(f"Successfully processed large JSONL file.")
        print(f"Removed fields: {fields_to_delete}")
        print(f"Total lines processed: {total_lines_processed}")
        
        return total_lines_processed
    
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return 0
    except Exception as e:
        print(f"An error occurred: {e}")
        return 0

def filter_large_jsonl_by_timestamp(
    input_file, 
    output_file, 
    timestamp_field='timestamp', 
    chunk_size=1_000_000
):
    """
    Filters large JSONL files by timestamp with minimal memory usage.
    
    Args:
    input_file (str): Path to the input large JSONL file
    output_file (str): Path to save the filtered JSONL file
    timestamp_field (str): Name of the timestamp field to filter on
    chunk_size (int): Number of lines to process in each chunk
    
    Returns:
    tuple: (total_lines_processed, lines_kept)
    """
    print('Filtering start!')
    # Validate input file exists and is not empty
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return 0, 0
    
    # Confirm input file is not empty
    if os.path.getsize(input_file) == 0:
        print("Error: Input file is empty.")
        return 0, 0
    
    # Calculate the timestamp threshold (10 years ago in milliseconds)
    current_time_ms = int(time.time() * 1000)
    ten_years_ago_ms = current_time_ms - (5 * 365 * 24 * 60 * 60 * 1000)
    
    # Variables to track processing
    total_lines_processed = 0
    lines_kept = 0
    
    try:
        with open(input_file, 'r', buffering=1024*1024) as infile, \
             open(output_file, 'w', buffering=1024*1024) as outfile:
            
            while True:
                # Read chunk of lines
                chunk = list(islice(infile, chunk_size))
                
                # Break if no more lines
                if not chunk:
                    break
                
                # Process each line in the chunk
                for line in chunk:
                    total_lines_processed += 1
                    
                    try:
                        # Parse the JSON object
                        obj = json.loads(line.strip())
                        
                        # Check if timestamp field exists and meets the criteria
                        if timestamp_field in obj:
                            # Convert to int, handling potential string input
                            timestamp = int(obj[timestamp_field])
                            
                            # Keep only if timestamp is within the last 10 years
                            if timestamp >= ten_years_ago_ms:
                                outfile.write(line)
                                lines_kept += 1
                    
                    except (json.JSONDecodeError, ValueError, TypeError) as e:
                        print(f"Warning: Skipping invalid line. Error: {e}")
                
                # Optional: print progress for very large files
                if total_lines_processed % (chunk_size * 10) == 0:
                    print(f"Processed {total_lines_processed} lines...")
        
        # Print final processing summary
        print("\nTimestamp Filtering Complete:")
        print(f"Total lines processed: {total_lines_processed}")
        print(f"Lines kept: {lines_kept}")
        print(f"Lines filtered out: {total_lines_processed - lines_kept}")
        print(f"Timestamp threshold: {ten_years_ago_ms}")
        
        return total_lines_processed, lines_kept
    
    except PermissionError:
        print(f"Error: Permission denied when accessing {input_file} or {output_file}")
        return 0, 0
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return 0, 0

def merge_titles(input_file_a, input_file_b, output_file):
    # Load B.jsonl into a dictionary for efficient lookups
    b_data = {}
    with open(input_file_b, 'r') as f_b:
        for line in f_b:
            b_item = json.loads(line)
            # Use both parent_asin and asin as potential keys
            if b_item.get('parent_asin'):
                b_data[b_item['parent_asin']] = b_item.get('title', '')

    # Process A.jsonl and merge titles
    merged_items = []
    with open(input_file_a, 'r') as f_a:
        for line in f_a:
            a_item = json.loads(line)
            
            # Try to find a matching title
            new_title = None
            
            # First, try matching parent_asin
            if a_item.get('parent_asin') in b_data:
                new_title = b_data[a_item['parent_asin']]
            
            # If no match, try matching asin to parent_asin
            elif a_item.get('asin') in b_data:
                new_title = b_data[a_item['asin']]
            
            # Update title if a match is found
            if new_title is not None:
                a_item['title'] = new_title
            
            merged_items.append(a_item)

    # Write merged results to output file
    with open(output_file, 'w') as f_out:
        for item in merged_items:
            f_out.write(json.dumps(item) + '\n')

    # Print some statistics
    total_items = len(merged_items)
    matched_items = sum(1 for item in merged_items if item.get('title') != '')
    print(f"Total items processed: {total_items}")
    print(f"Items with matched titles: {matched_items}")
    print(f"Matching percentage: {matched_items/total_items*100:.2f}%")

def count_distinct_fields(input_file, field):
    """
    Counts distinct values of a specified field in a JSONL file and analyzes frequencies.
    
    Parameters:
        input_file (str): Path to the input JSONL file.
        field (str): Field to analyze within the JSONL file.
    
    Returns:
        Counter: Counter object with frequencies of field values.
    """
    # Set to store unique field values
    unique_field = set()
    
    # Counter to track field frequencies
    field_counter = Counter()
    
    # Total number of rows
    total_rows = 0
    
    # Read the JSONL file
    with open(input_file, 'r') as f:
        for line in f:
            total_rows += 1
            try:
                item = json.loads(line)  # Parse the JSON line
                products = item.get('products', [])  # Extract 'products' list
                
                # Iterate through products to find the specified field
                for product in products:
                    value = product.get(field, '')  # Get the field value
                    
                    # Add to unique values set
                    unique_field.add(value)
                    
                    # Count frequencies
                    field_counter[value] += 1
            
            except json.JSONDecodeError:
                print(f"Error decoding JSON in line: {line.strip()}")
    
    # Print results
    print(f"Total rows processed: {total_rows}")
    print(f"Number of distinct '{field}' values: {len(unique_field)}")
    
    # Count fields with frequency <= 1
    fields_with_count_le_1 = sum(1 for count in field_counter.values() if count <= 1)
    for count in field_counter.values():
        if count <= 1:
            print
    
    print(f"There are {fields_with_count_le_1} fields with a count less than or equal to 1.")
    
    return field_counter
    
def aggregate_user_product_ratings(input_file, output_file):
    # Structure to track user product ratings
    user_product_ratings = defaultdict(lambda: defaultdict(list))
    
    # Counter for processing statistics
    total_lines_processed = 0
    skipped_lines = 0
    
    # First pass: Collect ratings
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                total_lines_processed += 1
                
                # Print progress periodically to show activity
                if total_lines_processed % 100000 == 0:
                    print(f"Processed {total_lines_processed} lines...")
                
                try:
                    item = json.loads(line)
                    user_id = item.get('user_id')
                    title = item.get('title')
                    rating = item.get('rating')
                    
                    # Skip items without complete information
                    if not (user_id and title and rating is not None):
                        skipped_lines += 1
                        continue
                    
                    # Store rating for this user and product
                    user_product_ratings[user_id][title].append(rating)
                
                except json.JSONDecodeError:
                    skipped_lines += 1
                    print(f"Error decoding JSON in line: {line.strip()}")
    
    except IOError as e:
        print(f"Error reading input file: {e}")
        sys.exit(1)
    
    # Filter users with multiple products
    multiple_product_users = {
        user_id: products 
        for user_id, products in user_product_ratings.items() 
        if len(products) > 1
    }
    
    # Write output
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for user_id, product_ratings in multiple_product_users.items():
                output_item = {
                    "user_id": user_id,
                    "products": [
                        {
                            "title": title,
                            "ratings": ratings
                        } for title, ratings in product_ratings.items()
                    ]
                }
                f.write(json.dumps(output_item) + '\n')
    
    except IOError as e:
        print(f"Error writing output file: {e}")
        sys.exit(1)
    
    # Print detailed statistics
    print("\n--- Processing Statistics ---")
    print(f"Total lines processed: {total_lines_processed}")
    print(f"Lines skipped (invalid data): {skipped_lines}")
    print(f"Total unique users: {len(user_product_ratings)}")
    print(f"Users with multiple products: {len(multiple_product_users)}")
    print(f"Percentage of users retained: {len(multiple_product_users)/len(user_product_ratings)*100:.2f}%")

def print_user_with_low_ratings(input_file, field):
    """
    Prints one user where the specified field has a count of ratings <= 1.
    
    Parameters:
        input_file (str): Path to the input JSONL file.
        field (str): Field to analyze within the JSONL file.
    
    Returns:
        None
    """
    # Read the JSONL file
    with open(input_file, 'r') as f:
        for line in f:
            try:
                item = json.loads(line)  # Parse the JSON line
                user_id = item.get("user_id", "Unknown")  # Extract user ID
                products = item.get('products', [])  # Extract 'products' list
                
                # Count products with ratings <= 1
                low_rating_count = sum(1 for product in products if sum(product.get("ratings", [])) <= 1)
                
                if low_rating_count > 0:  # Check if user has products with low ratings
                    print(f"User ID: {user_id} has {low_rating_count} products with ratings <= 1.")
                    return  # Stop after printing the first user
            
            except json.JSONDecodeError:
                print(f"Error decoding JSON in line: {line.strip()}")

    print("No user with products having ratings <= 1 found.")
    
def count_distinct_titles(input_file):
    # Set to store unique titles
    unique_titles = set()
    
    # Counter to track title frequencies
    title_counter = Counter()
    
    # Counters for processing statistics
    total_lines_processed = 0
    skipped_lines = 0
    
    # Process the file
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                total_lines_processed += 1
                
                # Print progress periodically
                if total_lines_processed % 10000 == 0:
                    print(f"Processed {total_lines_processed} lines...")
                
                try:
                    item = json.loads(line)
                    
                    # Extract titles from the products list
                    product_titles = [
                        product['title'].strip() 
                        for product in item.get('products', []) 
                        if product.get('title')
                    ]
                    
                    # Skip if no titles found
                    if not product_titles:
                        skipped_lines += 1
                        continue
                    
                    # Add titles to unique set and counter
                    for title in product_titles:
                        unique_titles.add(title)
                        title_counter[title] += 1
                
                except json.JSONDecodeError:
                    skipped_lines += 1
                    print(f"Error decoding JSON in line: {line.strip()}")
    
    except IOError as e:
        print(f"Error reading input file: {e}")
        return None, None
    
    # Print detailed statistics
    print("\n--- Distinct Titles Statistics ---")
    print(f"Total lines processed: {total_lines_processed}")
    print(f"Lines skipped (invalid data): {skipped_lines}")
    print(f"Number of distinct titles: {len(unique_titles)}")
    
    # Print top 20 most common titles
    print("\nTop 20 most common titles:")
    # for title, count in title_counter.most_common(20):
    #     print(f"{count:6d} times: {title}")
    
    return unique_titles, title_counter

def filter_titles_by_frequency(input_file, output_file):
    
    # Counter to track title frequencies
    title_counter = Counter()
    
    # Counters for processing statistics
    total_lines_processed = 0
    skipped_lines = 0
    
    # First pass: Count title frequencies
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            total_lines_processed += 1
            
            # Print progress periodically
            if total_lines_processed % 10000 == 0:
                print(f"Processed {total_lines_processed} lines...")
            
            try:
                item = json.loads(line)
                
                # Extract titles from the products list
                product_titles = [
                    product['title'].strip() 
                    for product in item.get('products', []) 
                    if product.get('title')
                ]
                
                # Count unique titles in this user's products
                unique_product_titles = set(product_titles)
                for title in unique_product_titles:
                    title_counter[title] += 1
            
            except json.JSONDecodeError:
                skipped_lines += 1
                print(f"Error decoding JSON in line: {line.strip()}")
    
    # Filter out titles that appear only once
    multi_occurrence_titles = {
        title for title, count in title_counter.items() if count > 1
    }
    
    # Second pass: Write filtered data
    total_output_lines = 0
    total_filtered_lines = 0
    
    with open(output_file, 'w', encoding='utf-8') as out_f:
        with open(input_file, 'r', encoding='utf-8') as in_f:
            for line in in_f:
                try:
                    item = json.loads(line)
                    
                    # Filter products with titles appearing more than once
                    filtered_products = [
                        product for product in item.get('products', [])
                        if product.get('title', '').strip() in multi_occurrence_titles
                    ]
                    
                    # Only write if there are multiple products after filtering
                    if len(filtered_products) > 1:
                        item['products'] = filtered_products
                        out_f.write(json.dumps(item) + '\n')
                        total_output_lines += 1
                    else:
                        total_filtered_lines += 1
                
                except json.JSONDecodeError:
                    skipped_lines += 1
    
    # Print statistics
    print("\n--- Title Filtering Statistics ---")
    print(f"Total lines processed: {total_lines_processed}")
    print(f"Lines skipped (invalid data): {skipped_lines}")
    print(f"Total unique titles: {len(title_counter)}")
    print(f"Titles appearing more than once: {len(multi_occurrence_titles)}")
    print(f"Output lines: {total_output_lines}")
    print(f"Filtered out lines: {total_filtered_lines}")
    
    # Write filtered titles to a file
    with open('filtered_titles.txt', 'w', encoding='utf-8') as f:
        for title in sorted(multi_occurrence_titles):
            f.write(f"{title_counter[title]} times: {title}\n")
    
    print("\nFiltered titles have been written to 'filtered_titles.txt'")
    
def filter_large_jsonl(input_file, output_file):
    """
    Efficiently filter large JSONL files with minimal memory usage.
    
    :param input_file: Path to the input large JSONL file
    :param output_file: Path to the output filtered JSONL file
    """
    filtered_count = 0
    total_count = 0

    with open(input_file, 'r', buffering=1024*1024) as infile, \
         open(output_file, 'w', buffering=1024*1024) as outfile:
        
        for line in infile:
            total_count += 1
            try:
                user_data = json.loads(line)
                
                # Check if all ratings are above 1.0
                if all(max(product.get('ratings', [0])) > 1.0 for product in user_data.get('products', [])):
                    json.dump(user_data, outfile)
                    outfile.write('\n')
                    filtered_count += 1
            
            except json.JSONDecodeError:
                # Skip any malformed lines
                print(f"Skipping malformed line: {line.strip()}")
    
    print(f"Total records processed: {total_count}")
    print(f"Records in filtered file: {filtered_count}")
    print(f"Filtered out: {total_count - filtered_count} records")

PRODUCT_TYPES = {
    # Computing
    'laptop': ['laptop', 'notebook', 'macbook'],
    'pc': ['desktop', 'pc', 'computer', 'workstation'],
    'monitor': ['monitor', 'display'],
    'keyboard': ['keyboard'],
    'mouse': ['mouse', 'mice'],
    'tablet': ['tablet', 'ipad'],
    
    # Accessories
    'monitor mount': ['monitor mount', 'monitor stand', 'monitor arm', 'screen mount', 'screen stand'],
    'laptop stand': ['laptop stand', 'notebook stand', 'laptop cooling stand', 'laptop riser'],
    'keyboard stand': ['keyboard stand', 'keyboard tray'],
    'phone mount': ['phone mount', 'phone holder', 'phone stand'],
    'tablet mount': ['tablet mount', 'tablet stand', 'tablet holder'],
    'headphone stand': ['headphone stand', 'headphone holder', 'headset stand'],
    
    # Audio
    'headphones': ['headphones', 'headphone', 'headset', 'earphones', 'earbuds', 'airpods'],
    'speakers': ['speaker', 'speakers', 'soundbar'],
    'microphone': ['microphone', 'mic'],
    
    # Storage
    'hard drive': ['hard drive', 'hdd', 'external drive'],
    'ssd': ['ssd', 'solid state drive'],
    'flash drive': ['flash drive', 'thumb drive', 'usb drive'],
    'memory card': ['memory card', 'sd card', 'sdhc', 'sdxc', 'microsd', 'micro sd', 'tf card', 'compact flash', 'cf card', 'memory stick'],
    
    # Networking
    'router': ['router', 'wifi router', 'wireless router'],
    'modem': ['modem'],
    'network switch': ['network switch', 'ethernet switch'],
    'access point': ['access point', 'wifi extender'],
    
    # Cables & Adapters
    'cable': ['cable', 'cord', 'wire'],
    'adapter': ['adapter', 'converter', 'dongle'],
    'hub': ['hub', 'usb hub', 'dock', 'docking station'],
    
    # Power
    'power supply': ['power supply', 'psu'],
    'battery': ['battery', 'battery pack'],
    'charger': ['charger', 'charging','Type C Charger'],
    'power bank': ['power bank', 'portable charger'],
    
    # TV & Video
    'tv': ['tv', 'television', 'smart tv'],
    'tv mount': ['tv mount', 'tv wall mount', 'television mount'],
    'projector': ['projector'],
    'projector mount': ['projector mount'],
    'streaming device': ['fire stick', 'roku', 'chromecast', 'apple tv'],
    
    # Input/Output
    'webcam': ['webcam', 'web camera'],
    'printer': ['printer'],
    'scanner': ['scanner'],
    
    # Gaming
    'console': ['playstation', 'xbox', 'nintendo', 'ps4', 'ps5'],
    'controller': ['controller', 'gamepad', 'joystick'],
    
    # Smart Home
    'smart speaker': ['echo', 'alexa speaker', 'google home', 'homepod'],
    'smart display': ['echo show', 'nest hub'],
    'smart plug': ['smart plug', 'wifi plug'],
    'smart bulb': ['smart bulb', 'smart light'],
    'security camera': ['security camera', 'surveillance camera'],
    'video doorbell': ['video doorbell','Smart video doorbell'],
    
    # Mobile
    'phone': ['phone', 'iphone', 'smartphone'],
    'phone case': ['phone case', 'iphone case'],
    'screen protector': ['screen protector', 'tempered glass'],
    
    # Remote Controls
    'remote': ['remote', 'remote control'],
    
    # Camera Equipment
    'camera': ['camera', 'dslr', 'mirrorless'],
    'camera lens': ['camera lens', 'lens'],
    'tripod': ['tripod'],
    'camera mount': ['camera mount'],
    
    # Wearables
    'smartwatch': ['smartwatch', 'smart watch', 'watch', 'apple watch', 'galaxy watch', 'fitness tracker', 'fitbit'],
    'fitness band': ['fitness band', 'smart band', 'mi band', 'fitness tracker'],
        
    # Tablet Accessories
    'stylus': ['stylus', 'pencil', 'apple pencil', 's pen', 'digital pen', 'tablet pen'],

    # Tracking Devices
    'tracker': ['airtag', 'tracker', 'tile tracker', 'bluetooth tracker', 'smart tracker', 'tracking device', 'samsung smarttag', 'galaxy smarttag'],
}

BRANDS = {
    # Computing
    'dell': 'Dell', 'hp': 'HP', 'lenovo': 'Lenovo', 'asus': 'Asus', 'acer': 'Acer',
    'microsoft': 'Microsoft', 'apple': 'Apple', 'msi': 'MSI', 'razer': 'Razer',
    
    # Audio/Video
    'sony': 'Sony', 'bose': 'Bose', 'samsung': 'Samsung', 'lg': 'LG', 'vizio': 'Vizio',
    'jbl': 'JBL', 'jabra': 'Jabra', 'sennheiser': 'Sennheiser', 'beats': 'Beats',
    'polk': 'Polk', 'klipsch': 'Klipsch', 'yamaha': 'Yamaha',
    
    # Phones & Tablets
    'samsung': 'Samsung',  # Already listed above but also makes phones/tablets
    'apple': 'Apple',      # Already listed above but also makes phones/tablets
    'google': 'Google',    # Pixel phones
    'oneplus': 'OnePlus',
    'xiaomi': 'Xiaomi',
    'huawei': 'Huawei',
    'oppo': 'OPPO',
    'vivo': 'Vivo',       # Different from VIVO mounts
    'realme': 'Realme',
    'motorola': 'Motorola',
    'nokia': 'Nokia',
    'zte': 'ZTE',
    'tcl': 'TCL',
    'honor': 'Honor',
    'blackberry': 'BlackBerry',
    
    # Accessories
    'logitech': 'Logitech', 'corsair': 'Corsair', 'anker': 'Anker', 'vivo': 'VIVO',
    'belkin': 'Belkin', 'tp-link': 'TP-Link', 'netgear': 'Netgear',
    
    # Storage
    'seagate': 'Seagate', 'wd': 'Western Digital', 'sandisk': 'SanDisk', 
    'kingston': 'Kingston', 'crucial': 'Crucial',
    
    # Camera
    'canon': 'Canon', 'nikon': 'Nikon', 'fujifilm': 'Fujifilm', 'gopro': 'GoPro',
    
    # Mobile Accessories
    'otterbox': 'OtterBox', 'spigen': 'Spigen', 'mophie': 'Mophie',
    
    # Wearables
    'fitbit': 'Fitbit',
    'garmin': 'Garmin', 
    'fossil': 'Fossil',
    'amazfit': 'Amazfit',
    'withings': 'Withings',
    'polar': 'Polar',
    'suunto': 'Suunto',
    
    # Tracking Device Manufacturers
    'tile': 'Tile',  # For Tile trackers
    'chipolo': 'Chipolo',  # Another tracker manufacturer
    'apple': 'Apple',      # Already exists but makes AirTags
    'samsung': 'Samsung',  # Already exists but makes SmartTags
    
    #stylus
    'wacom': 'Wacom',     # Popular stylus/tablet manufacturer
    'adonit': 'Adonit',   # Makes third-party styluses
    
    #video door bells
    'ring' :'Ring',
    'blink': 'Blink'
}

def find_product_type(title: str) -> Optional[str]:
    """Find the most specific product type in the title."""
    title_lower = title.lower()
    
    # Sort product types by length of matching terms (longer matches first)
    matches = []
    for product_type, keywords in PRODUCT_TYPES.items():
        for keyword in keywords:
            if keyword in title_lower:
                matches.append((len(keyword), product_type))
    
    # Return the product type with the longest matching keyword
    if matches:
        return sorted(matches, reverse=True)[0][1]
    return None

def find_brand(title: str) -> Optional[str]:
    """Find brand in the title."""
    title_lower = title.lower()
    for brand_key, brand_value in BRANDS.items():
        if brand_key in title_lower:
            return brand_value
    return None

def extract_key_specs(title: str, product_type: str) -> list:
    """Extract key specifications based on product type."""
    specs = []
    title_lower = title.lower()
    
    # Size specifications
    size_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:inch|"|inches|′′|″)', title_lower)
    if size_match:
        specs.append(f"{size_match.group(1)}inch")
    
    # Quantity specifications
    quantity_words = {
        'dual': '2', 'triple': '3', 'quad': '4',
        'double': '2', 'single': '1', 'two': '2', 'three': '3', 'four': '4'
    }
    for word, number in quantity_words.items():
        if word in title_lower:
            specs.append(f"{number}-way")
            break
    
    return specs

def simplify_title(title: str) -> str:
    """Simplify a product title to brand + specs + type."""
    # Find product type
    product_type = find_product_type(title)
    if not product_type:
        return "UNKNOWN"  # Instead of falling back to "product"
    
    # Find brand
    brand = find_brand(title)
    
    # Extract specifications
    specs = extract_key_specs(title, product_type)
    
    # Build simplified title
    components = []
    if brand:
        components.append(brand)
    if specs:
        components.extend(specs)
    components.append(product_type)
    
    return " ".join(components)

def simplify_data(input_file: str, output_file: str, unknown_file: str = None, batch_size: int = 1000):
    """
    Process the JSONL file and write results to output file.
    Tracks and displays the most common UNKNOWN products.
    """
    buffer = []
    unknown_buffer = []
    unknown_counter = {}  # Dictionary to track frequency of unknown products
    
    try:
        with open(input_file, "r", encoding="utf-8") as in_f, \
             open(output_file, "w", encoding="utf-8") as out_f:
            
            # Open unknown_file only if specified
            unknown_f = open(unknown_file, "w", encoding="utf-8") if unknown_file else None
            
            for i, line in enumerate(in_f):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    if "products" in data:
                        for product in data["products"]:
                            if "title" in product:
                                original_title = product["title"]
                                simplified_title = simplify_title(original_title)
                                
                                if simplified_title == "UNKNOWN":
                                    # Track frequency of unknown products
                                    unknown_counter[original_title] = unknown_counter.get(original_title, 0) + 1
                                    
                                    if unknown_f:
                                        unknown_buffer.append(json.dumps({
                                            "original_title": original_title,
                                            "user_id": data.get("user_id", "")
                                        }, ensure_ascii=False))
                                        
                                product["title"] = simplified_title
                    
                    buffer.append(json.dumps(data, ensure_ascii=False))
                    
                    if len(buffer) >= batch_size:
                        out_f.write("\n".join(buffer) + "\n")
                        buffer.clear()
                    
                    if unknown_f and len(unknown_buffer) >= batch_size:
                        unknown_f.write("\n".join(unknown_buffer) + "\n")
                        unknown_buffer.clear()
                    
                    if (i + 1) % 10000 == 0:
                        print(f"Processed {i + 1} lines...")
                        
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line {i + 1}: {e}")
                    continue
            
            # Write remaining buffers
            if buffer:
                out_f.write("\n".join(buffer) + "\n")
            if unknown_f and unknown_buffer:
                unknown_f.write("\n".join(unknown_buffer) + "\n")
            
            # Close unknown_file if it was opened
            if unknown_f:
                unknown_f.close()
            
            # Print statistics about unknown products
            print("\nTop 10 most common UNKNOWN products:")
            top_unknowns = sorted(unknown_counter.items(), key=lambda x: x[1], reverse=True)[:10]
            total_unknowns = sum(unknown_counter.values())
            
            print(f"\nTotal UNKNOWN products: {total_unknowns}")
            print("\nMost common UNKNOWN products:")
            for title, count in top_unknowns:
                print(f"'{title}': {count} times")
                
    except Exception as e:
        print(f"An error occurred: {e}")
        
def count_unique_titles_efficient(input_file: str, sample_size: Optional[int] = None) -> Tuple[int, int, Dict[str, int]]:
    """
    Memory-efficient function to count unique titles in large JSONL database.
    Uses a generator approach and processes data in chunks.
    
    Args:
        input_file (str): Path to input JSONL file
        sample_size (Optional[int]): If provided, only process this many titles (for testing)
        
    Returns:
        Tuple[int, int, Dict]: (total_titles, unique_titles, top_10_titles)
    """
    # Use defaultdict to avoid key errors
    title_count = defaultdict(int)
    total_titles = 0
    processed_lines = 0
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if "products" in data:
                        for product in data["products"]:
                            if "title" in product:
                                title = product["title"]
                                title_count[title] += 1
                                total_titles += 1
                                
                                # Free up memory by removing rare titles periodically
                                if total_titles % 100000 == 0:
                                    # Keep only titles that appear more than once
                                    title_count = defaultdict(int, {
                                        k: v for k, v in title_count.items() 
                                        if v > 1
                                    })
                    
                    processed_lines += 1
                    if processed_lines % 10000 == 0:
                        print(f"Processed {processed_lines} lines... Current memory usage: {sys.getsizeof(title_count) / (1024*1024):.2f} MB")
                    
                    # Break if we've reached the sample size
                    if sample_size and total_titles >= sample_size:
                        break
                        
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line {processed_lines + 1}: {e}")
                    continue
                    
        # Get final statistics
        unique_titles = len(title_count)
        
        # Get top 10 most common titles
        top_10 = sorted(title_count.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Print summary
        print("\nSummary:")
        print(f"Total product titles: {total_titles}")
        print(f"Unique product titles: {unique_titles}")
        print("\nTop 10 most common titles:")
        for title, count in top_10:
            print(f"'{title}': {count} times")
        
        return total_titles, unique_titles, dict(top_10)
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return 0, 0, {}


def clean_dataset(input_file: str, output_file: str, batch_size: int = 1000):
    """
    Clean the dataset by:
    1. Removing all products with title "UNKNOWN"
    2. Removing users who have 1 or fewer products after cleaning
    
    Args:
        input_file (str): Path to input JSONL file
        output_file (str): Path to output JSONL file
        batch_size (int): Number of lines to process before writing
    """
    buffer = []
    total_users = 0
    removed_users = 0
    removed_products = 0
    
    try:
        with open(input_file, "r", encoding="utf-8") as in_f, \
             open(output_file, "w", encoding="utf-8") as out_f:
            
            for i, line in enumerate(in_f):
                line = line.strip()
                if not line:
                    continue
                
                try:
                    data = json.loads(line)
                    total_users += 1
                    
                    if "products" in data:
                        # Remove UNKNOWN products
                        original_product_count = len(data["products"])
                        data["products"] = [
                            product for product in data["products"] 
                            if product.get("title") != "UNKNOWN"
                        ]
                        removed_products += original_product_count - len(data["products"])
                        
                        # Only keep users with more than 1 product
                        if len(data["products"]) > 1:
                            buffer.append(json.dumps(data, ensure_ascii=False))
                        else:
                            removed_users += 1
                    
                    # Write in batches
                    if len(buffer) >= batch_size:
                        out_f.write("\n".join(buffer) + "\n")
                        buffer.clear()
                    
                    # Log progress
                    if (i + 1) % 10000 == 0:
                        print(f"Processed {i + 1} lines...")
                        
                except json.JSONDecodeError as e:
                    print(f"Error decoding JSON on line {i + 1}: {e}")
                    continue
            
            # Write remaining buffer
            if buffer:
                out_f.write("\n".join(buffer) + "\n")
        
        # Print summary statistics
        print("\nCleaning Summary:")
        print(f"Total users processed: {total_users}")
        print(f"Users removed (≤1 product): {removed_users}")
        print(f"Users remaining: {total_users - removed_users}")
        print(f"Unknown products removed: {removed_products}")
        print(f"Clean dataset saved to: {output_file}")
                
    except Exception as e:
        print(f"An error occurred: {e}")



def process_user_ids_to_jsonl(input_file, output_file, batch_size=10000):
    """
    Read JSON lines file, replace user_ids with sequential numbers,
    and write to a new JSONL file in batches.
    
    Args:
        input_file (str): Path to input JSONL file
        output_file (str): Path where the new JSONL file will be created
        batch_size (int): Number of lines to process in each batch (default: 10000)
    """
    with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', encoding='utf-8') as outfile:
        batch = []
        for i, line in enumerate(infile, 1):  # Start counting from 1
            # Parse the JSON object
            data = json.loads(line.strip())
            
            # Replace the user_id with the sequential number
            data['user_id'] = i
            
            # Add the modified JSON object to the batch
            batch.append(data)
            
            # Write the batch to the output file when batch size is reached
            if len(batch) == batch_size:
                for obj in batch:
                    json.dump(obj, outfile, ensure_ascii=False)
                    outfile.write('\n')  # Add newline between JSON objects
                batch = []  # Reset the batch
        
        # Write the remaining objects in the batch
        for obj in batch:
            json.dump(obj, outfile, ensure_ascii=False)
            outfile.write('\n')  # Add newline between JSON objects
        
        print(f"Processed {i} records")
        print(f"New JSONL file created at: {output_file}") 
        
def analyze_large_recommender_data(input_file, sample_size=None):
    # Initialize counters
    user_count = 0
    products_set = set()
    rating_counts = defaultdict(int)
    product_rating_counts = defaultdict(int)
    ratings_per_user = []
    
    # First pass: collect basic statistics
    print("Analyzing data...")
    with open(input_file, 'r', encoding='utf-8') as f:  # Added UTF-8 encoding
        for line in tqdm(f):
            user_count += 1
            data = json.loads(line.strip())
            
            # Count ratings for this user
            user_ratings = len(data['products'])
            ratings_per_user.append(user_ratings)
            
            # Process each product
            for product in data['products']:
                title = product['title'].lower().strip()
                rating = product['ratings'][0]
                
                products_set.add(title)
                rating_counts[rating] += 1
                product_rating_counts[title] += 1
            
            if sample_size and user_count >= sample_size:
                break
    
    # Calculate metrics
    total_ratings = sum(rating_counts.values())
    sparsity = (1 - (total_ratings / (user_count * len(products_set)))) * 100
    
    print("\n=== Recommender System Dataset Analysis ===")
    print(f"\nScale Metrics:")
    print(f"Number of Users: {user_count:,}")
    print(f"Number of Unique Products: {len(products_set):,}")
    print(f"Total Number of Ratings: {total_ratings:,}")
    print(f"Sparsity: {sparsity:.2f}%")
    
    print(f"\nRating Distribution:")
    for rating in sorted(rating_counts.keys()):
        percentage = (rating_counts[rating] / total_ratings) * 100
        print(f"Rating {rating}: {rating_counts[rating]:,} ratings ({percentage:.1f}%)")
    
    print(f"\nUser Engagement:")
    print(f"Average ratings per user: {np.mean(ratings_per_user):.2f}")
    print(f"Median ratings per user: {np.median(ratings_per_user):.2f}")
    print(f"Min ratings per user: {min(ratings_per_user)}")
    print(f"Max ratings per user: {max(ratings_per_user)}")
    
    print(f"\nProduct Coverage:")
    cold_start_products = sum(1 for count in product_rating_counts.values() if count < 5)
    print(f"Products with <5 ratings: {cold_start_products:,} ({(cold_start_products/len(products_set))*100:.1f}%)")
    print(f"Average ratings per product: {total_ratings/len(products_set):.2f}")
    
    # Additional insights
    print(f"\nTop 10 Most Rated Products:")
    top_products = sorted(product_rating_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    for product, count in top_products:
        print(f"{product}: {count:,} ratings")
    
    return {
        'n_users': user_count,
        'n_products': len(products_set),
        'sparsity': sparsity,
        'rating_distribution': dict(rating_counts),
        'avg_ratings_per_user': np.mean(ratings_per_user),
        'cold_start_products': cold_start_products
    }


def analyze_recommendation_potential(csv_path):
    """
    Analyze a CSV file to determine its suitability for recommendation systems.
    
    Parameters:
    csv_path (str): Path to the CSV file
    """
    try:
        # Read the CSV file
        print("Loading the CSV file...")
        df = pd.read_csv(csv_path)
        
        # Basic dataset statistics
        total_users = df['user_id'].nunique()
        total_records = len(df)
        
        print("\n=== Basic Statistics ===")
        print(f"Total unique users: {total_users:,}")
        print(f"Total records: {total_records:,}")
        print(f"Average records per user: {total_records/total_users:.2f}")
        
        # Analyze user engagement
        user_activity = df['user_id'].value_counts()
        print("\n=== User Engagement Analysis ===")
        print(f"Users with one interaction: {(user_activity == 1).sum():,} ({(user_activity == 1).sum()/total_users*100:.2f}%)")
        print(f"Users with two  interaction: {(user_activity == 2).sum():,} ({(user_activity == 2).sum()/total_users*100:.2f}%)")
        print(f"Users with three  interaction: {(user_activity == 3).sum():,} ({(user_activity == 3).sum()/total_users*100:.2f}%)")
        print(f"Users with four interaction: {(user_activity == 4).sum():,} ({(user_activity == 4).sum()/total_users*100:.2f}%)")
        print(f"Most active user interactions: {user_activity.max():,}")
        print(f"Median interactions per user: {user_activity.median():.2f}")
        
        # Data sparsity analysis
        if 'item_id' in df.columns:
            total_items = df['item_id'].nunique()
            possible_interactions = total_users * total_items
            actual_interactions = total_records
            sparsity = (1 - actual_interactions/possible_interactions) * 100
            print(f"\nData sparsity: {sparsity:.2f}%")
            
            # Distribution of interactions per item
            item_popularity = df['item_id'].value_counts()
            print(f"\n=== Item Interaction Statistics ===")
            print(f"Items with only one interaction: {(item_popularity == 1).sum():,}")
            print(f"Median interactions per item: {item_popularity.median():.2f}")
        
        # Analyze temporal aspects if timestamp exists
        timestamp_columns = [col for col in df.columns if 'time' in col.lower() or 'date' in col.lower()]
        if timestamp_columns:
            print("\n=== Temporal Analysis ===")
            time_col = timestamp_columns[0]
            df[time_col] = pd.to_datetime(df[time_col])
            time_span = df[time_col].max() - df[time_col].min()
            print(f"Data timespan: {time_span.days} days")
            
        # Recommendation suitability score (0-100)
        suitability_score = 0
        
        # Scoring criteria
        if total_users > 1000:
            suitability_score += 20
        elif total_users > 100:
            suitability_score += 10
            
        if 'item_id' in df.columns and sparsity < 99.9:
            suitability_score += 20
        
        avg_interactions = total_records/total_users
        if avg_interactions > 10:
            suitability_score += 30
        elif avg_interactions > 5:
            suitability_score += 15
            
        if timestamp_columns:
            suitability_score += 15
            
        if (user_activity == 1).sum()/total_users < 0.5:  # Less than 50% users with single interaction
            suitability_score += 15
            
        print(f"\n=== Recommendation System Suitability ===")
        print(f"Suitability Score: {suitability_score}/100")
        
        # Recommendations based on analysis
        print("\n=== Recommendations ===")
        if suitability_score >= 70:
            print("✓ Dataset appears suitable for recommendation systems")
        else:
            print("⚠ Dataset may need improvements for optimal recommendation performance")
            
        if total_users < 1000:
            print("⚠ Consider collecting more user data")
        if 'item_id' not in df.columns:
            print("⚠ Add item identifiers for better recommendations")
        if not timestamp_columns:
            print("⚠ Add timestamp information to enable temporal analysis")
        if avg_interactions < 5:
            print("⚠ Work on increasing user engagement")
            
        # Print available features for recommendation
        print("\n=== Available Features for Recommendation ===")
        for column in df.columns:
            print(f"- {column}: {df[column].dtype}")
            
    except Exception as e:
        print(f"Error analyzing file: {str(e)}")

# def process_csv(input_file, output_file):
#     # Read the CSV file
#     print("Reading CSV file...")
#     df = pd.read_csv(input_file)
    
#     # Keep only the specified columns
#     columns_to_keep = [
#         'event_type',
#         'product_id',
#         'category_id',
#         'category_code',
#         'brand',
#         'user_id'
#     ]
    
#     print("Filtering columns...")
#     df = df[columns_to_keep]
    
#     # Sort by user_id
#     print("Sorting by user_id...")
#     df = df.sort_values('user_id')
    
#     # Count occurrences of each user_id
#     print("Counting user occurrences...")
#     user_counts = df['user_id'].value_counts()
    
#     # Filter to keep only users who appear more than once
#     print("Filtering users with multiple appearances...")
#     users_to_keep = user_counts[user_counts > 4].index
#     df = df[df['user_id'].isin(users_to_keep)]
    
#     # Save the processed data
#     print("Saving processed data...")
#     df.to_csv(output_file, index=False)
    
#     print(f"Processing complete! Output saved to {output_file}")
#     print(f"Original number of rows: {len(df)}")
#     print(f"Number of unique users remaining: {len(users_to_keep)}")


def process_csv(input_file, output_file):
    # Read the CSV file
    print("Reading CSV file...")
    df = pd.read_csv(input_file)
    
    # Keep only the specified columns
    columns_to_keep = [
        'event_type',
        'product_id',
        'category_id',
        'category_code',
        'brand',
        'user_id'
    ]
    
    print("Filtering columns...")
    df = df[columns_to_keep]
    
    # Sort by user_id
    print("Sorting by user_id...")
    df = df.sort_values('user_id')
    
    # Count occurrences of each user_id
    print("Counting user occurrences...")
    user_counts = df['user_id'].value_counts()
    
    # Filter to keep only users who appear more than once
    print("Filtering users with multiple appearances...")
    users_to_keep = user_counts[user_counts > 4].index
    df = df[df['user_id'].isin(users_to_keep)]
    
    # Create a mapping of old user IDs to new sequential IDs
    print("Reassigning user IDs sequentially...")
    unique_users = sorted(df['user_id'].unique())
    user_id_mapping = {old_id: new_id + 1 for new_id, old_id in enumerate(unique_users)}
    
    # Apply the mapping to create new user IDs
    df['user_id'] = df['user_id'].map(user_id_mapping)
    
    # Save the processed data
    print("Saving processed data...")
    df.to_csv(output_file, index=False)
    
    print(f"Processing complete! Output saved to {output_file}")
    print(f"Original number of rows: {len(df)}")
    print(f"Number of unique users remaining: {len(users_to_keep)}")
    print(f"User IDs now range from 1 to {len(unique_users)}")

def remove_rows_with_missing(input_csv_path, output_csv_path):
    # Read the CSV file
    df = pd.read_csv(input_csv_path)
    
    # Get initial count of rows
    initial_rows = len(df)
    
    # Remove rows with any missing values
    df_cleaned = df.dropna()
    
    user_counts = df_cleaned['user_id'].value_counts()
    # Filter to keep only users who appear more than once
    print("Filtering users with multiple appearances...")
    users_to_keep = user_counts[user_counts > 3].index
    df_cleaned= df_cleaned[df_cleaned['user_id'].isin(users_to_keep)]
    
    # Get count of remaining rows
    remaining_rows = len(df_cleaned)
    removed_rows = initial_rows - remaining_rows
    
    # Save the cleaned dataset to a new CSV file
    df_cleaned.to_csv(output_csv_path, index=False)
    
    # Print summary
    print(f"Initial number of rows: {initial_rows}")
    print(f"Rows removed: {removed_rows}")
    print(f"Remaining rows: {remaining_rows}")
    print(f"Percentage of data retained: {(remaining_rows/initial_rows*100):.2f}%")
    print(f"\nCleaned data has been saved to: {output_csv_path}")


def count_rows_with_missing(csv_path):
    # Read the CSV file
    df = pd.read_csv(csv_path)
    
    # Count rows with at least one missing value
    missing_rows = df.isna().any(axis=1).sum()
    
    # Get total number of rows for context
    total_rows = len(df)
    
    print(f"Number of rows with missing data: {missing_rows}")
    print(f"Total number of rows: {total_rows}")
    print(f"Percentage of rows with missing data: {(missing_rows/total_rows*100):.2f}%")
    
    return missing_rows

def reassign_user_ids(input_file: str, output_file: str) -> None:
    """
    Reads a CSV file, reassigns user IDs sequentially starting from 1, 
    and writes the updated data to a new CSV file.

    The CSV is assumed to have the following columns:
    event_type, product_id, category_id, category_code, brand, user_id

    Parameters:
        input_file (str): The path to the input CSV file.
        output_file (str): The path to the output CSV file.
    """
    user_mapping = {}
    current_new_id = 1

    with open(input_file, mode='r', newline='', encoding='utf-8') as infile, \
         open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # Process header
        header = next(reader)
        writer.writerow(header)
        
        # Process each row and update the user_id (assumed to be in the 6th column)
        for row in reader:
            original_user_id = row[5]
            if original_user_id not in user_mapping:
                user_mapping[original_user_id] = current_new_id
                current_new_id += 1
            row[5] = str(user_mapping[original_user_id])
            writer.writerow(row)