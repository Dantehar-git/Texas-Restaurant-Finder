export async function getRestaurants(search = "", city = "Dallas") {
  try {
    const response = await fetch(
      `http://localhost:3000/restaurants?query=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}`,
    );

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getRestaurantDetails(placeId) {
  const res = await fetch(
    `http://localhost:3000/restaurant/${encodeURIComponent(placeId)}`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch restaurant details");
  }

  return res.json();
}
