import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));

const BASE = "https://api.geoapify.com/v2/places";

const GEO_KEY = process.env.GEOAPIFY_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_KEY;

// image cache
const imageCache = {};

const cityCoords = {
  Dallas: "-96.7970,32.7767",
  Austin: "-97.7431,30.2672",
  Houston: "-95.3698,29.7604",
  "San Antonio": "-98.4936,29.4241",
};

// async function getRestaurantImages(name, city) {
//   const cacheKey = `${name}-${city}`;

//   if (imageCache[cacheKey]) {
//     return imageCache[cacheKey];
//   }

//   try {
//     const response = await fetch(
//       `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
//         name + " " + city + " restaurant",
//       )}&orientation=landscape&per_page=3&client_id=${UNSPLASH_KEY}`,
//     );

//     const data = await response.json();

//     const images = data.results?.map((img) => img.urls.regular) || [];

//     imageCache[cacheKey] = images;

//     return images;
//   } catch {
//     return [];
//   }
// }

async function getUnsplashImages(name, city) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        name + " " + city + " restaurant",
      )}&orientation=landscape&per_page=3&client_id=${process.env.UNSPLASH_KEY}`,
    );

    const data = await response.json();

    return data.results?.map((img) => img.urls.regular) || [];
  } catch (err) {
    console.error("Unsplash error:", err);
    return [];
  }
}

async function getRestaurantImages(name, city) {
  const cacheKey = `${name}-${city}`;

  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  let images = await getFoursquareImages(name, city);

  if (images.length === 0) {
    images = await getUnsplashImages(name, city);
  }

  imageCache[cacheKey] = images;

  return images;
}

async function getFoursquareImages(name, city) {
  try {
    const searchRes = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(
        name,
      )}&near=${encodeURIComponent(city)}&limit=1`,
      {
        headers: {
          Authorization: process.env.FOURSQUARE_API_KEY,
        },
      },
    );

    const searchData = await searchRes.json();

    const fsqId = searchData.results?.[0]?.fsq_id;

    if (!fsqId) return [];

    const photoRes = await fetch(
      `https://api.foursquare.com/v3/places/${fsqId}/photos`,
      {
        headers: {
          Authorization: process.env.FOURSQUARE_API_KEY,
        },
      },
    );

    const photoData = await photoRes.json();

    return photoData
      .slice(0, 3)
      .map((img) => `${img.prefix}original${img.suffix}`);
  } catch (err) {
    console.error("Foursquare error:", err);
    return [];
  }
}

app.get("/restaurants", async (req, res) => {
  const query = req.query.query || "restaurant";
  const city = req.query.city || "Dallas";

  const ll = cityCoords[city] || cityCoords["Dallas"];

  const url =
    `${BASE}?categories=catering.restaurant` +
    `&filter=circle:${ll},20000` +
    `&limit=25` +
    `&text=${encodeURIComponent(query)}` +
    `&apiKey=${GEO_KEY}`;

  try {
    const response = await fetch(url);

    const data = await response.json();

    const restaurants = await Promise.all(
      (data.features || []).map(async (place) => {
        const name = place.properties.name || "Restaurant";
        const images = await getRestaurantImages(name, city);

        return {
          ...place,
          images,
          rating: (Math.random() * 2 + 3).toFixed(1), // fake rating 3–5 stars
        };
      }),
    );

    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
