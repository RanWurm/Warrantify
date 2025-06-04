import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic';

interface GoogleMapViewProps {
  center: { latitude: number; longitude: number };
  markers?: { latitude: number; longitude: number; name?: string }[];
}

export default function GoogleMapView({ center, markers = [] }: GoogleMapViewProps) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Google Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
        <script>
          function initMap() {
            const myLatLng = { lat: ${center.latitude}, lng: ${center.longitude} };

            const map = new google.maps.Map(document.getElementById("map"), {
              zoom: 13,
              center: myLatLng,
            });

            new google.maps.Marker({
              position: myLatLng,
              map,
              title: "You are here",
            });

            ${markers
              .map(
                (m) => `
              new google.maps.Marker({
                position: { lat: ${m.latitude}, lng: ${m.longitude} },
                map,
                title: "${m.name || 'Service Center'}"
              });
            `
              )
              .join('')}
          }
        </script>
      </head>
      <body>
        <div id="map"></div>

        <script
          src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"
          async
          defer
        ></script>
      </body>
    </html>`;

  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={htmlContent}
        style={{ width: '100%', height: '500px', border: 'none' }}
        title="Google Map"
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
