import "../css/RestaurantCard.css";
import { useRestaurantContext } from "../contexts/RestaurantContext";

function RestaurantCard({ restaurant }) {
  const { isFavorite, addToFavorites, removeFromFavorites } =
    useRestaurantContext();

  const favorite = isFavorite(restaurant.properties.place_id);

  function onFavoriteClick(e) {
    e.preventDefault();

    if (favorite) removeFromFavorites(restaurant.properties.place_id);
    else addToFavorites(restaurant);
  }

  const images =
    restaurant.images?.length > 0
      ? restaurant.images
      : ["https://images.unsplash.com/photo-1504674900247-0877df9cc836"];

  return (
    <div className="restaurant-card">
      <div className="restaurant-poster">
        <img src={images[0]} alt={restaurant.properties.name} />

        <button
          className={`favorite-btn ${favorite ? "active" : ""}`}
          onClick={onFavoriteClick}
        >
          ♥
        </button>

        <div className="rating-badge">⭐ {restaurant.rating}</div>

        <div className="restaurant-overlay">
          <h3>{restaurant.properties.name}</h3>
          <p>{restaurant.properties.address_line2}</p>
        </div>
      </div>
    </div>
  );
}

export default RestaurantCard;
