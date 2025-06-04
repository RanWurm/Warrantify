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
        # self.data = pd.read_csv(csv_file_path)
        self.data = pd.read_csv(csv_file_path, dtype={'product_id': str, 'user_id': str}, low_memory=False)
        unique_categories = self.data['category_code'].dropna().unique()
        # print("🧩 Unique category_code values:")
        # for cat in sorted(unique_categories):
        #     print("-", cat)

        # Map event types to weights.
        # You can adjust these weights as needed.
        weight_map = {'purchase': 3, 'cart': 2, 'view': 1}
        self.data['weight'] = self.data['event_type'].map(weight_map).fillna(1)
        
        # Build a user-item matrix (users as rows, products as columns)
        self.user_item_matrix = self.data.pivot_table(
            index='user_id',
            columns='category_code',
            values='weight',
            aggfunc='sum',
            fill_value=0
        )
        self.user_item_matrix.columns = self.user_item_matrix.columns.astype(str)

        
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
        # Extract Category_codes from user products.
        user_categories = set()
        for prod in user_products:
            pname = prod.get('productName')
            if pname:
                category = self.infer_category_code(pname)
                user_categories.add(category)
        
        # Gather latent factor vectors for each category.
        vectors = []
        for category in user_categories:
            if category in self.product_ids:  # product_ids now stores category_codes
                idx = self.product_ids.index(category)
                vectors.append(self.item_factors[idx])

        print("🐋Vectors:" , vectors)
        
        if not vectors:
            print("🐋 No matching categories found in training data.")
            # Fallback to most popular categories by total weight
            popular = self.data.groupby('category_code')['weight'].sum().sort_values(ascending=False)
            recommendations = []
            for cat in popular.index:
                if cat not in user_categories:
                    info = {'category_code': cat}
                    recommendations.append(info)
                    if len(recommendations) >= self.k:
                        break
            print("🦀 Fallback Recommendations:", recommendations)
            return recommendations
        
        # Aggregate the user’s preference by averaging their vectors.
        user_vector = np.mean(vectors, axis=0).reshape(1, -1)
        
        # Compute cosine similarity to all categories
        similarities = cosine_similarity(user_vector, self.item_factors)[0]
        
        # Rank categories by similarity
        sim_df = pd.DataFrame({'category_code': self.product_ids, 'score': similarities})
        sim_df = sim_df[~sim_df['category_code'].isin(user_categories)]
        sim_df = sim_df.sort_values(by='score', ascending=False)
        
        # Take top-k recommended categories
        top_categories = sim_df.head(self.k)['category_code'].tolist()
        recommendations = []
        for cat in top_categories:
            # Find the first matching product in training data with this category
            matching = self.data[self.data['category_code'] == cat]
            if not matching.empty:
                example = matching.iloc[0]  # take the first example
                rec = self.product_info.get(example['product_id'], {}).copy()
                rec['product_id'] = example['product_id']
                rec['category_code'] = cat
                recommendations.append(rec)
        
        print("🦀 Recommendations:", recommendations)
        return recommendations
    

    def infer_category_code(self, product_name: str) -> str:
        name = product_name.lower().replace(' ', '')

        if 'laptop' in name or 'macbook' in name or 'notebook' in name:
            return 'computers.notebook'
        if 'monitor' in name:
            return 'computers.peripherals.monitor'
        if 'mouse' in name:
            return 'computers.peripherals.mouse'
        if 'keyboard' in name:
            return 'computers.peripherals.keyboard'
        if 'printer' in name:
            return 'computers.peripherals.printer'
        if 'scanner' in name:
            return 'computers.peripherals.scanner'
        if 'router' in name:
            return 'computers.network.router'
        if 'camera' in name:
            return 'electronics.camera.photo'
        if 'projector' in name:
            return 'electronics.video.projector'
        if 'tv' in name or 'television' in name or 'smarttv' in name:
            return 'electronics.video.tv'
        if 'tablet' in name or 'ipad' in name:
            return 'electronics.tablet'
        if 'phone' in name or 'iphone' in name or 'android' in name:
            return 'electronics.telephone'
        if 'headphone' in name or 'earbuds' in name or 'airpods' in name:
            return 'electronics.audio.headphone'
        if 'speaker' in name or 'soundbar' in name:
            return 'electronics.audio.acoustic'
        if 'microphone' in name or 'mic' in name:
            return 'electronics.audio.microphone'

        if 'kettle' in name:
            return 'appliances.kitchen.kettle'
        if 'microwave' in name:
            return 'appliances.kitchen.microwave'
        if 'blender' in name or 'mixer' in name or 'juicer' in name:
            return 'appliances.kitchen.blender'
        if 'coffe' in name and 'grinder' in name:
            return 'appliances.kitchen.coffee_grinder'
        if 'coffee' in name or 'espresso' in name:
            return 'appliances.kitchen.coffee_machine'
        if 'toaster' in name or 'toster' in name:
            return 'appliances.kitchen.toster'
        if 'fryer' in name:
            return 'appliances.kitchen.fryer'
        if 'grill' in name:
            return 'appliances.kitchen.grill'
        if 'meatgrinder' in name:
            return 'appliances.kitchen.meat_grinder'
        if 'steamer' in name or 'steamcooker' in name:
            return 'appliances.kitchen.steam_cooker'

        if 'vacuum' in name:
            return 'appliances.environment.vacuum'
        if 'fan' in name:
            return 'appliances.environment.fan'
        if 'heater' in name or 'airconditioner' in name:
            return 'appliances.environment.air_heater'

        if 'shaver' in name or 'haircutter' in name or 'clipper' in name:
            return 'appliances.personal.hair_cutter'
        if 'scales' in name:
            return 'appliances.personal.scales'
        if 'iron' in name or 'straightener' in name:
            return 'appliances.iron'

        if 'joystick' in name or 'controller' in name or 'xbox' in name or 'ps' in name:
            return 'computers.peripherals.joystick'

        if 'gps' in name:
            return 'auto.accessories.gps'
        if 'bike' in name or 'bicycle' in name:
            return 'sport.bicycle'
        if 'drill' in name:
            return 'construction.tools.drill'

        if 'chair' in name:
            return 'furniture.living_room.chair'
        if 'battery' in name:
            return 'stationery.battery'
        if 'paper' in name:
            return 'stationery.paper'
        if 'cartridge' in name or 'cartrige' in name:
            return 'stationery.cartrige'
        if 'stapler' in name:
            return 'stationery.stapler'

        if 'toy' in name:
            return 'kids.toys'
        if 'skates' in name:
            return 'kids.skates'

        if 'souvenir' in name:
            return 'jewelry.souvenir'

        # Default fallback
        return 'other'
