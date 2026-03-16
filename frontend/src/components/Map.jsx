import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useMap } from "react-leaflet";
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
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeMapView({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center]);

  return null;
}

export default function Map({ restaurants, city }) {
  const center = cityCoords[city] || cityCoords["Dallas"];
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "500px" }}
      className="map-container"
    >
      <ChangeMapView center={center} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {restaurants.map((r) => {
        const lat = r.geometry.coordinates[1];
        const lon = r.geometry.coordinates[0];

        return (
          <Marker key={r.properties.place_id} position={[lat, lon]}>
            <Popup>
              <strong>{r.properties.name}</strong>

              <div>Rating: {r.properties.rating || "N/A"}</div>

              <div>{r.properties.address_line1}</div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
