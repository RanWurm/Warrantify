import pandas as pd
import glob
from itertools import chain
from .trie import Trie

def load_products(dataset):
	res = []
	for file_path in glob.glob(f'{dataset}/*.csv'):
		data = pd.read_csv(file_path)
		products = data['Product'].dropna().unique()
		res = list(chain(res, products))
	return [product.lower() for product in res]

def load_trie(word_list = None):
	trie = Trie()
	if word_list is not  None:
		for word in word_list:
			trie.insert(word)
	return trie
	
			
	
	
def mark_end_of_word():
	folder_path = 'data_sets/'
	products = load_products(folder_path)
	unique_prods = sorted(set(products))
	Trie(unique_prods)
	return [word + '#' for word in unique_prods]
