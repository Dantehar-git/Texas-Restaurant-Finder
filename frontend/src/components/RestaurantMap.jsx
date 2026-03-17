import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";

const cityCoords = {
  Dallas: [32.7767, -96.797],
  Austin: [30.2672, -97.7431],
  Houston: [29.7604, -95.3698],
  "San Antonio": [29.4241, -98.4936],
};

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeMapView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  return null;
}

export default function RestaurantMap({ restaurants = [], city, loading }) {
  const center = cityCoords[city] || cityCoords["Dallas"];

  const validRestaurants = restaurants.filter(
    (r) =>
      r?.geometry?.coordinates &&
      Array.isArray(r.geometry.coordinates) &&
      r.geometry.coordinates.length >= 2 &&
      typeof r.geometry.coordinates[0] === "number" &&
      typeof r.geometry.coordinates[1] === "number",
  );

  return (
    <div
      style={{
        position: "relative",
        height: "500px",
        marginTop: "2rem",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div className="spinner"></div>
          <p style={{ margin: 0, fontWeight: 600 }}>Updating map...</p>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeMapView center={center} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MarkerClusterGroup chunkedLoading>
          {validRestaurants.map((r) => {
            const lon = r.geometry.coordinates[0];
            const lat = r.geometry.coordinates[1];

            return (
              <Marker
                key={
                  r.properties.place_id || `${r.properties.name}-${lat}-${lon}`
                }
                position={[lat, lon]}
              >
                <Popup>
                  <strong>{r.properties.name}</strong>
                  <div>Rating: {r.rating || "N/A"}</div>
                  <div>
                    {r.properties.address_line1 ||
                      r.properties.formatted ||
                      "Address not available"}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
