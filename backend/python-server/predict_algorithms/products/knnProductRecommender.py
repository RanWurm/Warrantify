import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity


class KNNProductRecommender:
    def __init__(self, csv_file_path, k=5, n_components=50):
        """
        Initializes the AI recommender using a CSV file containing user events.
        
        Args:
            csv_file_path (str): Path to the CSV file with interaction data.
            k (int): Number of recommendations to return.
            n_components (int): Number of latent components for SVD.
        """
        self.k = k
        # Load the CSV into a DataFrame
        self.data = pd.read_csv(csv_file_path)
        
        # Map event types to weights.
        # You can adjust these weights as needed.
        weight_map = {'purchase': 3, 'cart': 2, 'view': 1}
        self.data['weight'] = self.data['event_type'].map(weight_map).fillna(1)
        
        # Build a user-item matrix (users as rows, products as columns)
        self.user_item_matrix = self.data.pivot_table(
            index='user_id',
            columns='product_id',
            values='weight',
            aggfunc='sum',
            fill_value=0
        )
        
        # We want to learn latent item features.
        # Compute SVD on the (transposed) user-item matrix to get product (item) factors.
        n_components = min(n_components, self.user_item_matrix.shape[1] - 1)
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        # Note: The SVD is applied on the transposed matrix so that each row
        # corresponds to a product.
        self.item_factors = svd.fit_transform(self.user_item_matrix.T)
        # Normalize the latent vectors to use cosine similarity later.
        norms = np.linalg.norm(self.item_factors, axis=1, keepdims=True)
        self.item_factors = self.item_factors / (norms + 1e-10)
        
        # Keep track of product IDs in the same order as self.item_factors
        self.product_ids = list(self.user_item_matrix.columns)
        
        # Build a mapping from product_id to a dictionary of product details.
        # Here we take the first occurrence (e.g., category_code, brand) for each product.
        product_info = self.data.drop_duplicates(subset=['product_id'])
        self.product_info = product_info.set_index('product_id').to_dict(orient='index')

    def recommend(self, user_products, event_type="purchase"):
        """
        Returns product recommendations for a user based on their products.
        
        Args:
            user_products (list): List of dicts representing the user’s products.
                Each dict must include at least a "product_id" key.
            event_type (str): Not used in this model but kept for interface compatibility.
            
        Returns:
            List of dicts containing details of the recommended products.
        """
        # Extract the product IDs that the user already interacted with.
        user_product_ids = set()
        for prod in user_products:
            pid = prod.get('product_id')
            if pid:
                user_product_ids.add(pid)
        
        # Gather latent factor vectors for each product in the user's list.
        vectors = []
        for prod in user_products:
            pid = prod.get('product_id')
            if pid in self.product_ids:
                idx = self.product_ids.index(pid)
                vectors.append(self.item_factors[idx])
                
        if not vectors:
            # If none of the user's products exist in our training data,
            # fallback to returning the most popular products (by total weight).
            popular = self.data.groupby('product_id')['weight'].sum().sort_values(ascending=False)
            recommendations = []
            for pid in popular.index:
                if pid not in user_product_ids:
                    info = self.product_info.get(pid, {})
                    info['product_id'] = pid
                    recommendations.append(info)
                    if len(recommendations) >= self.k:
                        break
            return recommendations
        
        # Aggregate the user’s preference by averaging their product vectors.
        user_vector = np.mean(vectors, axis=0).reshape(1, -1)
        
        # Compute cosine similarity between the user's aggregated vector and all item vectors.
        similarities = cosine_similarity(user_vector, self.item_factors)[0]
        
        # Create a DataFrame of product IDs and their similarity scores.
        sim_df = pd.DataFrame({'product_id': self.product_ids, 'score': similarities})
        # Exclude products the user has already interacted with.
        sim_df = sim_df[~sim_df['product_id'].isin(user_product_ids)]
        # Sort by similarity score (descending).
        sim_df = sim_df.sort_values(by='score', ascending=False)
        
        # Select the top k product IDs.
        top_products = sim_df.head(self.k)['product_id'].tolist()
        recommendations = []
        for pid in top_products:
            info = self.product_info.get(pid, {})
            # Ensure that the product ID is included in the output.
            info['product_id'] = pid
            recommendations.append(info)
        
        return recommendations