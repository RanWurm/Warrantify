import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { AddWarrantyForm } from '../app/components/AddWarrantyForm';
import { WarrantyCard } from '../app/components/WarrantyCard';
import { ServiceCenterMap } from '../app/components/ServiceCenterMap';
import { ServiceCenterList } from '../app/components/ServiceCenterList';
import { ProductRecommendations } from '../app/components/ProductRecommendations';
import { ProductInformation } from '../app/(tabs)/productInformation';
import { EditWarrantyForm } from '../app/components/EditWarrantyForm';
import { MyWarranties } from '../app/(tabs)/myWarranties';

// Mock expo-location
jest.mock('expo-location');

describe('User Story Tests', () => {
  // 1. Store Warranty Documents Digitally
  describe('Warranty Document Storage', () => {
    it('should allow users to upload warranty documents', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        type: 'application/pdf',
        name: 'warranty.pdf'
      };

      const { getByTestId } = render(<AddWarrantyForm onClose={() => {}} />);
      
      const uploadButton = getByTestId('upload-button');
      fireEvent.press(uploadButton);
      
      const fileInput = getByTestId('file-input');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(getByTestId('file-list')).toHaveTextContent('warranty.pdf');
      });
    });
  });

  // 2. Track Warranty Progress
  describe('Warranty Progress Tracking', () => {
    it('should display correct progress percentage', () => {
      const mockWarranty = {
        productId: '123',
        title: 'Test Product',
        purchaseDate: '2023-01-01',
        expirationDate: '2024-01-01',
        progress: 50
      };

      const { getByTestId } = render(<WarrantyCard {...mockWarranty} />);
      
      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.progress).toBe(0.5);
    });

    it('should show correct color based on progress', () => {
      const mockWarranty = {
        productId: '123',
        title: 'Test Product',
        purchaseDate: '2023-01-01',
        expirationDate: '2024-01-01',
        progress: 80
      };

      const { getByTestId } = render(<WarrantyCard {...mockWarranty} />);
      
      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.color).toBe('#AF6F6F'); // Red color for high progress
    });
  });

  // 3. Find Nearest Service Center
  describe('Service Center Location', () => {
    it('should find nearest service center', async () => {
      const mockLocation = {
        coords: {
          latitude: 32.0853,
          longitude: 34.7818
        }
      };

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

      const { getByTestId } = render(<ServiceCenterMap />);
      
      const findNearestButton = getByTestId('find-nearest-button');
      fireEvent.press(findNearestButton);

      await waitFor(() => {
        expect(getByTestId('nearest-center')).toHaveTextContent('Nearest Service Center');
      });
    });
  });

  // 4. View Service Centers by Distance
  describe('Service Center Distance View', () => {
    it('should sort service centers by distance', () => {
      const mockCenters = [
        { id: 1, name: 'Center A', distance: 5 },
        { id: 2, name: 'Center B', distance: 2 },
        { id: 3, name: 'Center C', distance: 8 }
      ];

      const { getByTestId, getAllByTestId } = render(
        <ServiceCenterList centers={mockCenters} />
      );

      const sortButton = getByTestId('sort-distance-button');
      fireEvent.press(sortButton);

      const centerItems = getAllByTestId('center-item');
      expect(centerItems[0]).toHaveTextContent('Center B');
      expect(centerItems[1]).toHaveTextContent('Center A');
      expect(centerItems[2]).toHaveTextContent('Center C');
    });
  });

  // 5. Product Recommendations
  describe('Product Recommendations', () => {
    it('should display recommended products based on user history', async () => {
      const mockUserProducts = [
        { productName: 'Laptop', category: 'computers.notebook' },
        { productName: 'Mouse', category: 'computers.peripherals.mouse' }
      ];

      const { getByTestId, getAllByTestId } = render(
        <ProductRecommendations userProducts={mockUserProducts} />
      );

      await waitFor(() => {
        const recommendations = getAllByTestId('recommendation-item');
        expect(recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  // 6. Upload and Extract Warranty Details
  describe('Warranty Document Extraction', () => {
    it('should extract warranty details from uploaded document', async () => {
      const mockPdf = {
        uri: 'file://warranty.pdf',
        type: 'application/pdf',
        name: 'warranty.pdf'
      };

      const { getByTestId } = render(<AddWarrantyForm onClose={() => {}} />);
      
      const uploadButton = getByTestId('upload-button');
      fireEvent.press(uploadButton);
      
      // Mock OCR extraction
      const extractedData = {
        productName: 'Test Product',
        purchaseDate: '2023-01-01',
        expirationDate: '2024-01-01'
      };

      await waitFor(() => {
        expect(getByTestId('product-name-input')).toHaveValue(extractedData.productName);
        expect(getByTestId('purchase-date-input')).toHaveValue(extractedData.purchaseDate);
        expect(getByTestId('expiration-date-input')).toHaveValue(extractedData.expirationDate);
      });
    });
  });

  // 7. Warranty Breakdown View
  describe('Warranty Breakdown View', () => {
    it('should display detailed warranty information', () => {
      const mockWarranty = {
        productName: 'Test Product',
        purchaseDate: '2023-01-01',
        expirationDate: '2024-01-01',
        model: 'XYZ-123',
        price: '999.99',
        serviceCenter: 'Test Center'
      };

      const { getByTestId } = render(<ProductInformation {...mockWarranty} />);
      
      expect(getByTestId('warranty-details')).toHaveTextContent('Test Product');
      expect(getByTestId('time-remaining')).toHaveTextContent('Time Remaining');
      expect(getByTestId('service-center')).toHaveTextContent('Test Center');
    });
  });

  // 8. Map View of Service Centers
  describe('Service Center Map View', () => {
    it('should display service centers on map', () => {
      const mockCenters = [
        { id: 1, name: 'Center A', latitude: 32.0853, longitude: 34.7818 },
        { id: 2, name: 'Center B', latitude: 32.0753, longitude: 34.7718 }
      ];

      const { getByTestId, getAllByTestId } = render(
        <ServiceCenterMap centers={mockCenters} />
      );

      const map = getByTestId('service-center-map');
      const markers = getAllByTestId('map-marker');
      
      expect(markers.length).toBe(2);
    });
  });

  // 9. Edit Warranty Information
  describe('Warranty Editing', () => {
    it('should update warranty information', async () => {
      const mockWarranty = {
        id: '123',
        productName: 'Original Product',
        purchaseDate: '2023-01-01',
        expirationDate: '2024-01-01'
      };

      const { getByTestId } = render(<EditWarrantyForm warranty={mockWarranty} />);
      
      const productNameInput = getByTestId('product-name-input');
      fireEvent.changeText(productNameInput, 'Updated Product');
      
      const saveButton = getByTestId('save-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('success-message')).toBeTruthy();
      });
    });
  });

  // 10. Search and Filter Warranties
  describe('Warranty Search and Filter', () => {
    it('should filter warranties based on search query', () => {
      const mockWarranties = [
        { id: 1, productName: 'Laptop', category: 'computers' },
        { id: 2, productName: 'Mouse', category: 'peripherals' },
        { id: 3, productName: 'Keyboard', category: 'peripherals' }
      ];

      const { getByTestId, getAllByTestId } = render(
        <MyWarranties initialWarranties={mockWarranties} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Mouse');

      const filteredItems = getAllByTestId('warranty-item');
      expect(filteredItems.length).toBe(1);
      expect(filteredItems[0]).toHaveTextContent('Mouse');
    });
  });
}); 