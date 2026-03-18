import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRestaurantDetails } from "../services/api";
import RestaurantLocationMap from "../components/RestaurantLocationMap";
import "../css/RestaurantDetails.css";
import { formatCuisine } from "../utils/formatCuisine";

function RestaurantDetails() {
  const { placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const starterRestaurant = location.state?.restaurant || null;

  const [restaurant, setRestaurant] = useState(starterRestaurant);
  const [selectedImage, setSelectedImage] = useState(
    starterRestaurant?.image || null,
  );
  const [loading, setLoading] = useState(!starterRestaurant);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");

        const data = await getRestaurantDetails(placeId);

        if (!ignore) {
          setRestaurant(data);
          setSelectedImage(data.image || data.images?.[0] || null);
        }
      } catch (err) {
        if (!ignore) {
          setError("Could not load restaurant details.");
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      ignore = true;
    };
  }, [placeId]);

  if (loading && !restaurant) {
    return (
      <div className="restaurant-details-page">
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="restaurant-details-page">
        <button className="back-btn" onClick={() => navigate(-1)} type="button">
          ← Back
        </button>
        <p>{error}</p>
      </div>
    );
  }

  const props = restaurant?.properties || {};

  const images = restaurant?.images?.length
    ? restaurant.images
    : restaurant?.image
      ? [restaurant.image]
      : [];

  const mainImage = selectedImage || images[0] || null;

  const address =
    props.address_line2 ||
    [props.housenumber, props.street].filter(Boolean).join(" ") ||
    (props.formatted && props.formatted !== props.name
      ? props.formatted
      : "") ||
    "Address not available";

  const lat = Number(props.lat ?? props.latitude);
  const lon = Number(props.lon ?? props.longitude);

  return (
    <div className="restaurant-details-page">
      <button className="back-btn" onClick={() => navigate(-1)} type="button">
        ← Back
      </button>

      <div className="restaurant-details-hero">
        <div className="restaurant-details-gallery">
          {mainImage && (
            <img
              className="restaurant-details-image"
              src={mainImage.imageUrl}
              alt={mainImage.alt || props.name}
            />
          )}

          {images.length > 0 && (
            <div className="restaurant-thumbnails">
              {images.map((img, index) => (
                <button
                  key={`${img.thumbUrl || img.imageUrl}-${index}`}
                  className={`thumbnail-btn ${
                    mainImage?.imageUrl === img.imageUrl ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img.thumbUrl || img.imageUrl}
                    alt={img.alt || `${props.name} view ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="restaurant-details-content">
          <h1>{props.name || "Restaurant"}</h1>

          <p className="details-rating">⭐ {restaurant?.rating || "N/A"}</p>

          <p>
            <strong>Address:</strong> {address}
          </p>

          {props.website && (
            <p>
              <strong>Website:</strong>{" "}
              <a href={props.website} target="_blank" rel="noreferrer">
                Visit website
              </a>
            </p>
          )}

          {props.opening_hours && (
            <p>
              <strong>Hours:</strong> {props.opening_hours}
            </p>
          )}

          {(props.contact?.phone || props.phone) && (
            <p>
              <strong>Phone:</strong> {props.contact?.phone || props.phone}
            </p>
          )}

          {props.catering?.cuisine && (
            <p>
              <strong>Cuisine:</strong>{" "}
              {props.catering.cuisine
                ?.split(";")
                .map((c) => formatCuisine(c))
                .join(", ")}
            </p>
          )}

          {props.categories?.length > 0 && (
            <p>
              <strong>Categories:</strong> {props.categories.join(", ")}
            </p>
          )}

          {mainImage?.photographer && mainImage?.photographerLink && (
            <p className="photo-credit">
              Photo by{" "}
              <a
                href={mainImage.photographerLink}
                target="_blank"
                rel="noreferrer"
              >
                {mainImage.photographer}
              </a>{" "}
              on{" "}
              <a href={mainImage.unsplashLink} target="_blank" rel="noreferrer">
                Unsplash
              </a>
            </p>
          )}
        </div>
      </div>

      {Number.isFinite(lat) && Number.isFinite(lon) && (
        <div className="restaurant-details-map">
          <h2>Location</h2>
          <RestaurantLocationMap
            lat={lat}
            lon={lon}
            name={props.name}
            rating={restaurant?.rating}
            address={address}
          />
        </div>
      )}
    </div>
  );
}

export default RestaurantDetails;
