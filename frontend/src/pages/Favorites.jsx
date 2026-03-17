import "../css/Favorites.css";
import { useRestaurantContext } from "../contexts/RestaurantContext";
import RestaurantCard from "../components/RestaurantCard";

function Favorite() {
  const { favorites } = useRestaurantContext();

  if (favorites.length) {
    return (
      <div className="favorites">
        <h2>Your Favorites</h2>

        <div className="favorites-grid">
          {favorites.map((restaurant) => (
            <RestaurantCard
              restaurant={restaurant}
              key={restaurant.properties?.place_id || restaurant.id}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-empty">
      <h2>No Favorite Restaurants Yet</h2>
      <p>
        Start adding restaurants to your favorites and they will appear here!
      </p>
    </div>
  );
}

export default Favorite;
