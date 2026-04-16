import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { despertarBackend } from "./services/api";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Especialidad from './pages/Especialidad';

export default function App() {
  useEffect(() => {
    despertarBackend();
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-[#D9F0FB] min-h-screen">
        <Routes>
          {/* PÚBLICAS */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/especialidad/:id" element={<Especialidad />} />

          {/* PRIVADAS */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}