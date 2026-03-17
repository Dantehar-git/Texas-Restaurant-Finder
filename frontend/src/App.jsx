import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Favorite from "./pages/Favorites";
import NavBar from "./components/NavBar";
import RestaurantDetails from "./pages/RestaurantDetails";
import "./css/App.css";
import { RestaurantProvider } from "./contexts/RestaurantContext";

function App() {
  return (
    <>
      <RestaurantProvider>
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/favorites" element={<Favorite />} />
            <Route
              path="/restaurant/:placeId"
              element={<RestaurantDetails />}
            />
          </Routes>
        </main>
      </RestaurantProvider>
    </>
  );
}

export default App;
