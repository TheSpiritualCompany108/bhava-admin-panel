import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./admin/AdminLogin";
import AdminPage from "./admin/AdminPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
