import { useEffect, useState } from "react";
import { getRestaurants } from "../services/api";
import RestaurantMap from "../components/RestaurantMap";
import "../css/Home.css";
import RestaurantCard from "../components/RestaurantCard";
import { formatCuisine } from "../utils/formatCuisine";

export default function Home() {
  const [city, setCity] = useState("Dallas");
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [category, setCategory] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const filteredRestaurants = restaurants.filter((r) => {
    if (!category) return true;
    const cuisineList = (r.properties?.catering?.cuisine || "")
      .split(";")
      .map((c) => c.trim());

    return cuisineList.includes(category);
  });

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    }

    if (sortBy === "distance") {
      return (a.properties?.distance || 0) - (b.properties?.distance || 0);
    }

    return (b.properties?.popularity || 0) - (a.properties?.popularity || 0);
  });

  const cuisines = [
    ...new Set(
      restaurants.flatMap((r) =>
        (r.properties?.catering?.cuisine || "")
          .split(";")
          .map((c) => c.trim())
          .filter(Boolean),
      ),
    ),
  ].sort();

  async function loadRestaurants(
    query = "",
    selectedCity = city,
    isInitial = false,
  ) {
    try {
      if (isInitial) setInitialLoading(true);
      else setUpdating(true);

      const data = await getRestaurants(query, selectedCity);
      setRestaurants(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setInitialLoading(false);
      else setUpdating(false);
    }
  }

  useEffect(() => {
    loadRestaurants("", city, true);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    loadRestaurants(search, city, false);
  }

  function LoadingSpinner() {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container text-center my-4">
      <h1 className="mb-4">Texas Restaurants</h1>

      {/* Controls */}
      <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
        <select
          className="form-select w-auto"
          value={city}
          onChange={(e) => {
            const newCity = e.target.value;
            setCity(newCity);
            setCategory("");
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
              {formatCuisine(cuisine)}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
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

        <button className="btn btn-primary" disabled={updating}>
          {updating ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Cards with overlay */}
      <div style={{ position: "relative" }}>
        {updating && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.55)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "0.75rem",
              borderRadius: "12px",
            }}
          >
            <div className="spinner"></div>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Updating restaurants...
            </p>
          </div>
        )}

        <div className="restaurant-grid">
          {sortedRestaurants.map((r) => (
            <RestaurantCard
              key={r.properties.place_id || r.properties.name}
              restaurant={r}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <RestaurantMap
        restaurants={sortedRestaurants}
        city={city}
        loading={updating}
      />
    </div>
  );
}
