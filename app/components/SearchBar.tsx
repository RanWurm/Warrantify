// app/components/SearchBar.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import debounce from 'lodash.debounce';

interface SearchBarProps {
  variant: 'myWarranties' | string;
  onSearch: (query: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
  placeholder?: string;
  filterOptions?: {
    text: string;
    onPress: () => void;
  };
  autocompleteEndpoint: string;
  additionalStyles?: {
    container?: StyleProp<ViewStyle>;
    searchBar?: StyleProp<ViewStyle>;
    filterButton?: StyleProp<ViewStyle>;
    filterButtonText?: StyleProp<TextStyle>;
    searchInput?: StyleProp<ViewStyle>;
    searchText?: StyleProp<TextStyle>;
    suggestionsList?: StyleProp<ViewStyle>;
    suggestionItem?: StyleProp<ViewStyle>;
    loadingText?: StyleProp<TextStyle>;
    errorText?: StyleProp<TextStyle>;
    noSuggestionsText?: StyleProp<TextStyle>;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  variant,
  onSearch,
  onSelectSuggestion,
  placeholder = 'Search here',
  filterOptions,
  autocompleteEndpoint,
  additionalStyles = {},
}) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  // Function to clear the search input
  const handleClear = () => {
    setQuery('');
    onSearch('');
    setSuggestions([]);
  };

  // Fetch suggestions from the server
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${autocompleteEndpoint}?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: string[] = await response.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        console.warn('Autocomplete response is not an array.');
        setSuggestions([]);
      }
    } catch (err: any) {
      console.error('Autocomplete fetch error:', err);
      setError(err.message || 'Something went wrong');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, 300),
    [autocompleteEndpoint]
  );

  useEffect(() => {
    debouncedFetchSuggestions(query);
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [query, debouncedFetchSuggestions]);

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    onSelectSuggestion(suggestion);
    onSearch(suggestion);
  };

  const handleSearch = () => {
    onSearch(query);
    setSuggestions([]);
  };

  const dynamicStyles = getStyles(variant, screenWidth);

  return (
    <View style={[styles.container, dynamicStyles.container, additionalStyles.container]}>
      <View style={[styles.searchBar, dynamicStyles.searchBar, additionalStyles.searchBar]}>
        {filterOptions && (
          <TouchableOpacity
            style={[styles.filterButton, dynamicStyles.filterButton, additionalStyles.filterButton]}
            onPress={filterOptions.onPress}
          >
            <MaterialCommunityIcons name="tune" size={20} color="#000" />
            <Text style={[styles.filterButtonText, dynamicStyles.filterButtonText, additionalStyles.filterButtonText]}>
              {filterOptions.text}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.searchInput, dynamicStyles.searchInput, additionalStyles.searchInput]}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#666"
            style={[styles.searchText, dynamicStyles.searchText, additionalStyles.searchText]}
            value={query}
            onChangeText={(text) => {
            setQuery(text);
            onSearch(text); 
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={query ? handleClear : handleSearch}>
            <MaterialCommunityIcons name={query ? "close-circle" : "magnify"} size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Suggestions List */}
      {isLoading && (
        <Text
          style={[
            styles.loadingText,
            dynamicStyles.loadingText,
            additionalStyles.loadingText,
          ]}
        >
          Loading...
        </Text>
      )}
      {error && (
        <Text
          style={[
            styles.errorText,
            dynamicStyles.errorText,
            additionalStyles.errorText,
          ]}
        >
          {error}
        </Text>
      )}
      {!isLoading && !error && query.trim() !== '' && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.suggestionItem,
                dynamicStyles.suggestionItem,
                additionalStyles.suggestionItem,
              ]}
              onPress={() => handleSuggestionPress(item)}
            >
              <Text style={{fontFamily: 'InriaSerif-Bold'}}>{item}</Text>
            </TouchableOpacity>
          )}
          style={[
            styles.suggestionsList,
            dynamicStyles.suggestionsList,
            additionalStyles.suggestionsList,
          ]}
          keyboardShouldPersistTaps="handled"
        />
      )}
      {!isLoading && !error && query.trim() !== '' && suggestions.length === 0 && (
        <Text
          style={[
            styles.noSuggestionsText,
            dynamicStyles.noSuggestionsText,
            additionalStyles.noSuggestionsText,
          ]}
        >
          No suggestions found.
        </Text>
      )}
    </View>
  );
};

const getStyles = (variant: string, screenWidth: number) => {
  switch (variant) {
    case 'myWarranties':
      return {
        container: {
          // Container styles if needed specifically for the myWarranties variant
        },
        searchBar: {
          width: '90%',
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f1f1f1',
          padding: 8,
          borderRadius: 8,
          marginVertical: 10,
        },
        filterButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#D2BBA1',
          borderRadius: 4,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        filterButtonText: {
          fontSize: 14,
          color: '#000',
          marginLeft: 5,
          fontFamily: 'InriaSerif-Regular',
        },
        searchInput: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#D2BBA1',
          borderRadius: 4,
          flex: 1,
          marginLeft: 8,
          paddingHorizontal: 8,
        },
        searchText: {
          flex: 1,
          color: '#000',
          fontSize: 14,
          marginRight: 5,
          fontFamily: 'InriaSerif-Regular',
        },
      };
    case 'recommended':
        return {
        container: {
            backgroundColor: '#E9E0D4',
        },
        searchBar: {
          width: '90%',
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f1f1f1',
          padding: 8,
          borderRadius: 8,
        },
        filterButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#D2BBA1',
          borderRadius: 4,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        filterButtonText: {
          fontSize: 14,
          color: '#000',
          marginLeft: 5,
          fontFamily: 'InriaSerif-Regular',
        },
        searchInput: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#D2BBA1',
          borderRadius: 4,
          flex: 1,
          marginLeft: 8,
          paddingHorizontal: 8,
        },
        searchText: {
          flex: 1,
          color: '#000',
          fontSize: 14,
          marginRight: 5,
          fontFamily: 'InriaSerif-Regular',
        },
      };

    default:
      return {};
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
  },
  searchBar: {
    // Base searchBar style (if needed by default)
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    // Base filter button style
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#000',
    fontSize: 14,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f1f1f1',
  },
  searchText: {
    flex: 1,
    height: 40,
    color: '#000',
    fontSize: 16,
  },
  suggestionsList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    maxHeight: 200,
    marginTop: 4,
    marginHorizontal: '5%',
    width: '90%',
    alignSelf: 'center',
    fontFamily: 'InriaSerif-Bold',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: 'red',
    textAlign: 'center',
  },
  noSuggestionsText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});

export default SearchBar;
