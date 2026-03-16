import { createContext, useState, useContext, useEffect } from "react";

const RestaurantContext = createContext();

export const useRestaurantContext = () => useContext(RestaurantContext);

export const RestaurantProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedFavs = localStorage.getItem("favorites");

    if (storedFavs) setFavorites(JSON.parse(storedFavs));
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (restaurant) => {
    setFavorites((prev) => {
      // Prevent duplicates
      if (
        prev.some(
          (r) => r.properties.place_id === restaurant.properties.place_id,
        )
      ) {
        return prev;
      }
      return [...prev, restaurant];
    });
  };

  const removeFromFavorites = (placeId) => {
    setFavorites((prev) =>
      prev.filter((restaurant) => restaurant.properties.place_id !== placeId),
    );
  };

  const isFavorite = (placeId) => {
    return favorites.some(
      (restaurant) => restaurant.properties.place_id === placeId,
    );
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
