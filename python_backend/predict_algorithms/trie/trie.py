class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
        self.all_words = set()  # Store all words for substring matching
    
    def insert(self, word: str) -> None:
        # Insert word normally for prefix matching
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
        
        # Store word for substring matching
        self.all_words.add(word)
    
    def _find_node(self, prefix: str) -> tuple[TrieNode, str, int]:
        """
        Returns:
            - The last matching node
            - The longest matching prefix
            - Length of the matching prefix
        """
        node = self.root
        matched_prefix = ""
        matched_len = 0
        
        for i, char in enumerate(prefix):
            if char in node.children:
                node = node.children[char]
                matched_prefix += char
                matched_len = i + 1
            else:
                break
                
        return node, matched_prefix, matched_len
    
    def _collect_words(self, node: TrieNode, prefix: str, words: list) -> None:
        """Collects all words starting from given node with given prefix"""
        if node.is_end:
            words.append(prefix)
            
        for char, child in node.children.items():
            self._collect_words(child, prefix + char, words)
    
    def autocomplete(self, pattern: str, max_suggestions: int = 5) -> list[str]:
        """
        Returns words that either:
        1. Have the input as their prefix
        2. Have the input as a substring
        3. If no such words exist, returns words sharing the longest possible prefix
        """
        suggestions = []
        
        # First, try prefix matching
        node, matched_prefix, matched_len = self._find_node(pattern)
        if matched_len == len(pattern):
            self._collect_words(node, matched_prefix, suggestions)
        
        # Then, try substring matching
        if not suggestions:
            substring_matches = [word for word in self.all_words if pattern in word]
            suggestions.extend(substring_matches)
        
        # If still no matches and we have a partial prefix match, 
        # collect words with the longest matching prefix
        if not suggestions and matched_len > 0:
            self._collect_words(node, matched_prefix, suggestions)
            
        return sorted(set(suggestions))[:max_suggestions]