import pandas as pd
import glob
from itertools import chain

# Load and preprocess product data
def load_products(dataset):
	res = []
	for file_path in glob.glob(f'{dataset}/*.csv'):
		data = pd.read_csv(file_path)
		products = data['name'].dropna().unique()
		res = list(chain(res, products))
	return [product.lower() for product in res]
	
	

# Autocomplete logic
def get_suggestions(query, products):
	pass
