import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic';

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
        const myLatLng = { lat: 31.78496, lng: 34.7078656 };

        const map = new google.maps.Map(document.getElementById("map"), {
          zoom: 13,
          center: myLatLng,
        });

        new google.maps.Marker({
          position: myLatLng,
          map,
          title: "מחסני חשמל",
        });
      }
    </script>
  </head>
  <body>
    <div id="map"></div>

    <script
      src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCn-qqKYulPv-Ken38MtqimNa1AiJFluic&callback=initMap"
      async
      defer
    ></script>
  </body>
</html>`;

export default function GoogleMapView() {
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
