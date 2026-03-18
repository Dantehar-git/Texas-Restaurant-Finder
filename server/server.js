import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://texas-restaurant-finder.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.get("/", (req, res) => {
  res.send("Texas Restaurant Finder API is running");
});

const GEO_BASE = "https://api.geoapify.com/v2/places";
const GEO_DETAILS_BASE = "https://api.geoapify.com/v2/place-details";
const UNSPLASH_BASE = "https://api.unsplash.com/search/photos";

const GEO_KEY = process.env.GEOAPIFY_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const imageCache = {};
const galleryCache = {};
const restaurantListCache = {};
const restaurantDetailsCache = {};

let unsplashRateLimited = false;

const cityCoords = {
  Dallas: "-96.7970,32.7767",
  Austin: "-97.7431,30.2672",
  Houston: "-95.3698,29.7604",
  "San Antonio": "-98.4936,29.4241",
};

const FALLBACK_IMAGES = {
  mexican:
    "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=80",
  italian:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  chinese:
    "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=900&q=80",
  japanese:
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  indian:
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
  bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  seafood:
    "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=900&q=80",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
};

if (!GEO_KEY || !UNSPLASH_KEY) {
  console.error("Missing API keys");
}

function getCachedValue(cache, key) {
  const entry = cache[key];

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;

  if (isExpired) {
    delete cache[key];
    return null;
  }

  return entry.data;
}

function setCachedValue(cache, key, data) {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

function getStableRating(seed = "") {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const normalized = Math.abs(hash % 20) / 10; // 0.0 - 1.9
  return Number((3 + normalized).toFixed(1)); // 3.0 - 4.9
}

function getCuisine(place) {
  return (
    place.properties?.catering?.cuisine ||
    place.properties?.categories?.find((c) => c.includes("catering")) ||
    place.properties?.datasource?.raw?.cuisine ||
    "restaurant"
  );
}

function getFallbackImage(cuisine, name) {
  const c = String(cuisine || "").toLowerCase();

  let url = FALLBACK_IMAGES.restaurant;

  if (c.includes("mex")) url = FALLBACK_IMAGES.mexican;
  else if (c.includes("ital")) url = FALLBACK_IMAGES.italian;
  else if (c.includes("chin")) url = FALLBACK_IMAGES.chinese;
  else if (c.includes("japan") || c.includes("sushi")) {
    url = FALLBACK_IMAGES.japanese;
  } else if (c.includes("indian")) {
    url = FALLBACK_IMAGES.indian;
  } else if (c.includes("bbq") || c.includes("barbecue")) {
    url = FALLBACK_IMAGES.bbq;
  } else if (c.includes("burger")) {
    url = FALLBACK_IMAGES.burger;
  } else if (c.includes("seafood")) {
    url = FALLBACK_IMAGES.seafood;
  }

  return {
    imageUrl: url,
    thumbUrl: url,
    alt: `${name} ${cuisine} restaurant`,
    photographer: null,
    photographerLink: null,
    unsplashLink: null,
    matchType: "fallback",
  };
}

function buildImageData(photo, name, matchType) {
  return {
    imageUrl: `${photo.urls.raw}&w=1200&h=800&fit=crop&crop=entropy&auto=format&q=80`,
    thumbUrl: photo.urls.small,
    alt: photo.alt_description || `${name} restaurant`,
    photographer: photo.user?.name || "Unknown",
    photographerLink: photo.user?.links?.html
      ? `${photo.user.links.html}?utm_source=texas_restaurant_finder&utm_medium=referral`
      : null,
    unsplashLink:
      "https://unsplash.com/?utm_source=texas_restaurant_finder&utm_medium=referral",
    matchType,
  };
}

async function searchUnsplash(query, perPage = 1) {
  const url =
    `${UNSPLASH_BASE}?query=${encodeURIComponent(query)}` +
    `&per_page=${perPage}` +
    `&orientation=landscape` +
    `&content_filter=high`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_KEY}`,
      "Accept-Version": "v1",
    },
  });

  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");

  if (limit || remaining) {
    console.log(`Unsplash rate status: limit=${limit}, remaining=${remaining}`);
  }

  if (response.status === 403) {
    unsplashRateLimited = true;
    const text = await response.text();
    throw new Error(`Unsplash fetch failed: 403 - ${text}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Unsplash fetch failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function getRestaurantImage(name, city, cuisine) {
  const cacheKey = `${name}-${city}-${cuisine}`;

  const cached = getCachedValue(imageCache, cacheKey);
  if (cached) return cached;

  if (unsplashRateLimited) {
    const fallback = getFallbackImage(cuisine, name);
    setCachedValue(imageCache, cacheKey, fallback);
    return fallback;
  }

  try {
    const exactQuery = `"${name}" ${city} restaurant`;
    const exactResults = await searchUnsplash(exactQuery, 1);

    if (exactResults[0]?.urls?.raw) {
      const imageData = buildImageData(exactResults[0], name, "exact");
      setCachedValue(imageCache, cacheKey, imageData);
      return imageData;
    }

    const fallbackQuery = `${name} ${city} ${cuisine} restaurant`;
    const fallbackResults = await searchUnsplash(fallbackQuery, 1);

    if (fallbackResults[0]?.urls?.raw) {
      const imageData = buildImageData(
        fallbackResults[0],
        name,
        "name-city-cuisine",
      );
      setCachedValue(imageCache, cacheKey, imageData);
      return imageData;
    }

    const backup = getFallbackImage(cuisine, name);
    setCachedValue(imageCache, cacheKey, backup);
    return backup;
  } catch (err) {
    console.error(`Unsplash image error for ${name}:`, err.message);

    const backup = getFallbackImage(cuisine, name);
    setCachedValue(imageCache, cacheKey, backup);
    return backup;
  }
}

async function getRestaurantGallery(name, city, cuisine) {
  const cacheKey = `${name}-${city}-${cuisine}-gallery`;

  const cached = getCachedValue(galleryCache, cacheKey);
  if (cached) return cached;

  if (unsplashRateLimited) {
    const fallback = getFallbackImage(cuisine, name);
    const gallery = [fallback];
    setCachedValue(galleryCache, cacheKey, gallery);
    return gallery;
  }

  try {
    const exactQuery = `"${name}" ${city} restaurant`;
    const exactResults = await searchUnsplash(exactQuery, 4);

    const exactGallery = exactResults
      .filter((photo) => photo?.urls?.raw)
      .map((photo) => buildImageData(photo, name, "exact-gallery"));

    if (exactGallery.length) {
      setCachedValue(galleryCache, cacheKey, exactGallery);
      return exactGallery;
    }

    const fallbackQuery = `${name} ${city} ${cuisine} restaurant`;
    const fallbackResults = await searchUnsplash(fallbackQuery, 4);

    const fallbackGallery = fallbackResults
      .filter((photo) => photo?.urls?.raw)
      .map((photo) => buildImageData(photo, name, "fallback-gallery"));

    if (fallbackGallery.length) {
      setCachedValue(galleryCache, cacheKey, fallbackGallery);
      return fallbackGallery;
    }

    const backup = [getFallbackImage(cuisine, name)];
    setCachedValue(galleryCache, cacheKey, backup);
    return backup;
  } catch (err) {
    console.error(`Unsplash gallery error for ${name}:`, err.message);

    const backup = [getFallbackImage(cuisine, name)];
    setCachedValue(galleryCache, cacheKey, backup);
    return backup;
  }
}

function normalizeRestaurantAddress(properties = {}) {
  return {
    ...properties,
    address_line1:
      properties.address_line1 || properties.name || "Address not available",
    address_line2:
      properties.address_line2 ||
      [
        properties.housenumber,
        properties.street,
        properties.city,
        properties.state,
        properties.postcode,
      ]
        .filter(Boolean)
        .join(", "),
  };
}

async function enrichRestaurant(place, city) {
  const name = place.properties?.name;
  if (!name) return null;

  const cuisine = getCuisine(place);
  const image = await getRestaurantImage(name, city, cuisine);

  return {
    ...place,
    properties: normalizeRestaurantAddress(place.properties),
    image,
    rating: getStableRating(
      place.properties?.place_id || place.properties?.name || "",
    ),
  };
}

async function collectRestaurantsWithImages(places, city, targetCount = 15) {
  const results = [];
  const batchSize = 5;

  for (
    let i = 0;
    i < places.length && results.length < targetCount;
    i += batchSize
  ) {
    const batch = places.slice(i, i + batchSize);

    const enrichedBatch = await Promise.all(
      batch.map((place) => enrichRestaurant(place, city)),
    );

    results.push(...enrichedBatch.filter(Boolean));
  }

  return results.slice(0, targetCount);
}

app.get("/restaurants", async (req, res) => {
  const query = req.query.query || "restaurant";
  const city = req.query.city || "Dallas";
  const cacheKey = `${city}::${query}`;

  const cached = getCachedValue(restaurantListCache, cacheKey);
  if (cached) {
    res.set("Cache-Control", "public, max-age=1800");
    return res.json(cached);
  }

  const ll = cityCoords[city] || cityCoords.Dallas;

  const geoUrl =
    `${GEO_BASE}?categories=catering.restaurant` +
    `&filter=circle:${ll},20000` +
    `&limit=15` +
    `&text=${encodeURIComponent(query)}` +
    `&apiKey=${GEO_KEY}`;

  try {
    const response = await fetch(geoUrl);

    if (!response.ok) {
      const text = await response.text();
      console.error(`Geoapify fetch failed: ${response.status} - ${text}`);
      return res.status(500).json({ error: "Geoapify request failed" });
    }

    const data = await response.json();
    const places = data.features || [];

    const restaurantsWithImages = await collectRestaurantsWithImages(
      places,
      city,
      15,
    );

    setCachedValue(restaurantListCache, cacheKey, restaurantsWithImages);

    res.set("Cache-Control", "public, max-age=1800");
    res.json(restaurantsWithImages);
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/restaurant/:placeId", async (req, res) => {
  const { placeId } = req.params;

  const cached = getCachedValue(restaurantDetailsCache, placeId);
  if (cached) {
    res.set("Cache-Control", "public, max-age=1800");
    return res.json(cached);
  }

  try {
    const detailsUrl =
      `${GEO_DETAILS_BASE}?id=${encodeURIComponent(placeId)}` +
      `&features=details,geometry` +
      `&apiKey=${GEO_KEY}`;

    const detailsResponse = await fetch(detailsUrl);

    if (!detailsResponse.ok) {
      const text = await detailsResponse.text();
      console.error(
        `Geoapify details failed: ${detailsResponse.status} - ${text}`,
      );
      return res.status(500).json({ error: "Geoapify details request failed" });
    }

    const detailsData = await detailsResponse.json();

    const feature =
      detailsData.features?.[0] ||
      detailsData.feature ||
      detailsData.result ||
      null;

    if (!feature) {
      return res.status(404).json({ error: "Restaurant details not found" });
    }

    const rawProps = feature.properties || {};
    const props = normalizeRestaurantAddress(rawProps);

    const name = props.name || "Restaurant";
    const city = props.city || props.county || props.state || "Texas";
    const cuisine =
      props.catering?.cuisine ||
      props.categories?.find((c) => c.includes("catering")) ||
      props.datasource?.raw?.cuisine ||
      "restaurant";

    const [image, images] = await Promise.all([
      getRestaurantImage(name, city, cuisine),
      getRestaurantGallery(name, city, cuisine),
    ]);

    const result = {
      ...feature,
      properties: props,
      image,
      images,
      rating: getStableRating(placeId || name),
    };

    setCachedValue(restaurantDetailsCache, placeId, result);

    res.set("Cache-Control", "public, max-age=1800");
    res.json(result);
  } catch (err) {
    console.error("Restaurant details error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
