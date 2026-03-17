import "../css/RestaurantCard.css";
import { useRestaurantContext } from "../contexts/RestaurantContext";
import { Link } from "react-router-dom";

function RestaurantCard({ restaurant }) {
  const { isFavorite, addToFavorites, removeFromFavorites } =
    useRestaurantContext();

  const placeId = restaurant.properties.place_id;
  const favorite = isFavorite(placeId);

  function onFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (favorite) {
      removeFromFavorites(placeId);
    } else {
      addToFavorites(restaurant);
    }
  }

  if (!restaurant.image?.imageUrl) return null;

  return (
    <Link
      to={`/restaurant/${placeId}`}
      state={{ restaurant }}
      className="restaurant-card-link"
    >
      <div className="restaurant-card">
        <div className="restaurant-poster">
          <img
            src={restaurant.image.imageUrl}
            alt={restaurant.image.alt || restaurant.properties.name}
          />

          <button
            className={`favorite-btn ${favorite ? "active" : ""}`}
            onClick={onFavoriteClick}
            type="button"
          >
            ♥
          </button>

          <div className="rating-badge">⭐ {restaurant.rating}</div>

          <div className="restaurant-overlay">
            <h3>{restaurant.properties.name}</h3>
            <p>
              {restaurant.properties.address_line1 ||
                restaurant.properties.formatted ||
                "Address not available"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default RestaurantCard;
