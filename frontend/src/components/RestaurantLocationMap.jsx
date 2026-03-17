import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function RestaurantLocationMap({ lat, lon, name, rating, address }) {
  return (
    <div className="details-map-wrapper">
      <MapContainer
        center={[lat, lon]}
        zoom={16}
        style={{ height: "420px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[lat, lon]}>
          <Popup>
            <strong>{name}</strong>
            <div>Rating: {rating || "N/A"}</div>
            <div>{address}</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default RestaurantLocationMap;
