import { useEffect, useState } from "react";
import { getRestaurants } from "../services/api";
import Map from "../components/Map";
import "../css/Home.css";
import RestaurantCard from "../components/RestaurantCard";

export default function Home() {
  const [city, setCity] = useState("Dallas");
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredRestaurants = restaurants.filter((r) => {
    if (!category) return true;

    return r.properties?.catering?.cuisine === category;
  });

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    const pa = a.properties;
    const pb = b.properties;

    if (sortBy === "rating") {
      return (pb.rating || 0) - (pa.rating || 0);
    }

    if (sortBy === "distance") {
      return (pa.distance || 0) - (pb.distance || 0);
    }

    return (pb.popularity || 0) - (pa.popularity || 0);
  });

  const cuisines = [
    ...new Set(
      restaurants.map((r) => r.properties?.catering?.cuisine).filter(Boolean),
    ),
  ];

  async function loadRestaurants(query = "", selectedCity = city) {
    setLoading(true);
    const restaurants = await getRestaurants(query, selectedCity);
    setRestaurants(restaurants);
    setLoading(false);
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadRestaurants(search, city);
  }

  function LoadingSpinner() {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <LoadingSpinner />
        <Map restaurants={sortedRestaurants} />
      </>
    );
  }

  return (
    <div className="container text-center my-4">
      <h1 className="mb-4">Texas Restaurants</h1>

      <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
        <select
          className="form-select w-auto"
          value={city}
          onChange={(e) => {
            const newCity = e.target.value;
            setCity(newCity);
            loadRestaurants(search, newCity);
          }}
        >
          <option value="Dallas">Dallas</option>
          <option value="Austin">Austin</option>
          <option value="Houston">Houston</option>
          <option value="San Antonio">San Antonio</option>
        </select>
        <select
          className="form-select w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="popularity">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="distance">Closest</option>
        </select>

        <select
          className="form-select w-auto"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All</option>

          {cuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleSearch}
        className="d-flex justify-content-center mb-4"
      >
        <input
          className="form-control w-50 me-2"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>

      <div className="restaurant-grid">
        {sortedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.properties.place_id}
            restaurant={restaurant}
          />
        ))}
      </div>

      <Map restaurants={sortedRestaurants} city={city} />
    </div>
  );
}
