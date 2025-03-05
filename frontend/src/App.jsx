import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });

  // On mount: set deviceId cookie if not present.
  useEffect(() => {
    const cookie = document.cookie.split("; ").find(row => row.startsWith("deviceId="));
    if (!cookie) {
      const newId = uuidv4();
      // Set cookie for the whole site; adjust expiration as needed.
      document.cookie = `deviceId=${newId}; path=/;`;
      console.log("Set deviceId cookie:", newId);
    }
  }, []);

  // On mount: ask for location permissions.
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error obtaining location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  // Helper: Returns the variant with the lowest discounted price from an array.
  const getLowestVariant = (variants) => {
    if (!variants || variants.length === 0) return null;
    return variants.reduce((prev, curr) =>
      Number(curr.discounted_price) < Number(prev.discounted_price) ? curr : prev
    );
  };

  // Helper: Returns the overall lowest variant among all price sources (used to choose an image).
  const getOverallLowestVariant = (prices) => {
    let overall = null;
    prices.forEach((priceInfo) => {
      const variant = getLowestVariant(priceInfo.variants);
      if (variant) {
        if (!overall || Number(variant.discounted_price) < Number(overall.discounted_price)) {
          overall = variant;
        }
      }
    });
    return overall;
  };

  // Helper: Returns the index of the query in the product name (lower index = better match).
  const getMatchIndex = (name, query) => {
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    return idx === -1 ? Infinity : idx;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Append lat and lng if available.
      const locParams =
        location.lat && location.lng
          ? `&lat=${location.lat}&lng=${location.lng}`
          : "";
      const response = await fetch(
        `https://grocery-api.comparely.co.in/search?q=${encodeURIComponent(query)}${locParams}`
      );
      const data = await response.json();
      // Sort products by:
      // 1. Descending order by number of sources (prices array length)
      // 2. For products with only one source, sort by the match index in the product name.
      const sortedProducts = data.sort((a, b) => {
        const aCount = a.prices.length;
        const bCount = b.prices.length;
        if (aCount !== bCount) {
          return bCount - aCount;
        }
        if (aCount === 1) {
          const aMatch = getMatchIndex(a.name, query);
          const bMatch = getMatchIndex(b.name, query);
          return aMatch - bMatch;
        }
        return 0;
      });
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fixed order for displaying sources in each card.
  const sources = ["blinkit", "zepto", "instamart"];

  return (
    <div className="App">
      <header className="App-header">
        <h1>QuickCommerce Grocery</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>
      <main className="product-grid">
        {loading ? (
          <p>Loading...</p>
        ) : products.length > 0 ? (
          products.map((product) => {
            const overallVariant = getOverallLowestVariant(product.prices);
            return (
              <div key={product.id} className="product-card">
                {overallVariant && overallVariant.image_url && (
                  <img
                    src={overallVariant.image_url}
                    alt={product.name}
                    className="product-image"
                  />
                )}
                <h3>{product.name}</h3>
                <div className="shop-rows">
                  {sources.map((source) => {
                    const priceInfo = product.prices.find(
                      (p) => p.source.toLowerCase() === source
                    );
                    if (!priceInfo) {
                      return (
                        <div key={source} className="shop-row">
                          <strong>
                            {source.charAt(0).toUpperCase() + source.slice(1)}:
                          </strong>{" "}
                          <span>Not available</span>
                        </div>
                      );
                    }
                    const lowestVariant = getLowestVariant(priceInfo.variants);
                    return (
                      <div key={source} className="shop-row">
                        <strong>
                          {source.charAt(0).toUpperCase() + source.slice(1)}:
                        </strong>{" "}
                        {lowestVariant ? (
                          <>
                            <span className="price">
                              ₹{lowestVariant.discounted_price}
                            </span>{" "}
                            <a
                              href={lowestVariant.deeplink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </>
                        ) : (
                          <span>Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <p>No products found.</p>
        )}
      </main>
    </div>
  );
}

export default App;
