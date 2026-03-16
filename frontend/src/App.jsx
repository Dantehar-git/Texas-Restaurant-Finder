import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Favorite from "./pages/Favorites";
import NavBar from "./components/NavBar";
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
          </Routes>
        </main>
      </RestaurantProvider>
    </>
  );
}

export default App;
