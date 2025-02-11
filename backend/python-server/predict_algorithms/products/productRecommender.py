import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from collections import defaultdict

class ProductRecommender:
    def __init__(self, n_neighbors=6):  # 6 to get 5 recommendations (excluding the item itself)
        self.n_neighbors = n_neighbors
        self.model = NearestNeighbors(metric='cosine', n_neighbors=n_neighbors)
        self.product_user_matrix = None
        self.products_dict = None
        self.product_ids = None
        self.product_idx = None
        self.df = None

    def preprocess_data(self, df):
        """Preprocess the input dataframe."""
        self.df = df  # Store the original dataframe
        
        # Create user-product interaction matrix
        user_product_interactions = df.groupby(['user_id', 'product_id']).size().reset_index(name='interactions')
        
        # Create pivot table: users x products
        self.product_user_matrix = user_product_interactions.pivot(
            index='product_id', 
            columns='user_id', 
            values='interactions'
        ).fillna(0)

        # Create product mapping dictionaries
        self.product_ids = self.product_user_matrix.index
        self.product_idx = {pid: idx for idx, pid in enumerate(self.product_ids)}

        # Create products dictionary with additional information
        self.products_dict = df.groupby('product_id').agg({
            'category_id': 'first',
            'category_code': 'first',
            'brand': 'first'
        }).to_dict('index')

    def fit(self, df):
        """Fit the recommendation model."""
        self.preprocess_data(df)
        self.model.fit(self.product_user_matrix.values)
        return self

    def get_user_history(self, user_id):
        """Get the viewing history for a specific user."""
        user_history = self.df[self.df['user_id'] == user_id].drop_duplicates(subset=['product_id'])
        history_records = []
        for _, row in user_history.iterrows():
            cat_code = row['category_code']
            if not cat_code:
                cat_code = 0
            
            history_records.append({
                'product_id': row['product_id'],
                'category_id': row['category_id'],
                'category_code': row['category_code'],
                'brand': row['brand']
            })
        return history_records

    def get_recommendations(self, product_id, n_recommendations=5):
        """Get recommendations for a specific product."""
        if product_id not in self.product_idx:
            return []
        
        idx = self.product_idx[product_id]
        distances, indices = self.model.kneighbors(
            self.product_user_matrix.iloc[idx, :].values.reshape(1, -1)
        )
        
        similar_products = []
        for i in range(1, len(indices[0])):  # Skip the first result as it's the product itself
            idx = indices[0][i]
            pid = self.product_ids[idx]
            product_info = self.products_dict[pid]
            similar_products.append({
                'category_code': product_info['category_code'].split('.')[-1],
                'brand': product_info['brand'],
            })
        
        return similar_products[:n_recommendations]

