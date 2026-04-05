import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { despertarBackend } from "./services/api";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Home from "./pages/Home";

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={`transition-opacity duration-300 ease-linear ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <Routes location={displayLocation}>
        {/* PÚBLICAS */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* PRIVADAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
      </Routes>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    despertarBackend();
  }, []);
  return (
    <BrowserRouter>
      <div className="bg-[#D9F0FB] min-h-screen">
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}