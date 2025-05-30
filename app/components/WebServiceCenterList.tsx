import React from 'react';

interface Center {
  name: string;
  address: string;
  isOpen?: boolean;
  closeTime?: string;
  phone?: string;
  distanceKm?: number;
}

interface Props {
  centers: Center[];
}

export default function WebServiceCenterList({ centers }: Props) {
  return (
    <div style={styles.container}>
      {centers.map((center, index) => (
        <div key={index} style={styles.card}>
          <h2 style={styles.name}>{center.name}</h2>
          <p style={styles.city}>{center.address}</p>
          <p style={styles.notes}>
            {center.isOpen !== undefined
              ? center.isOpen
                ? `Open now, closes at ${center.closeTime || 'unknown'}`
                : 'Closed now'
              : ''}
          </p>
          {center.phone && <p style={styles.phone}>📞 {center.phone}</p>}
          {center.distanceKm !== undefined && (
            <p style={styles.distance}>
              📍 {center.distanceKm.toFixed(1)} km away
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    padding: '16px',
    border: '1px solid #ccc',
    borderRadius: '12px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  name: {
    margin: '0 0 8px',
    fontSize: '20px',
  },
  city: {
    margin: '0 0 4px',
    fontWeight: 'bold',
  },
  notes: {
    margin: '4px 0',
    color: '#555',
  },
  phone: {
    margin: '4px 0',
    fontStyle: 'italic',
  },
  distance: {
    margin: '4px 0',
    color: '#888',
  },
};
