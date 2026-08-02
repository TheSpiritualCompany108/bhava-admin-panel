import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./admin/AdminLogin";
import AdminPage from "./admin/AdminPage";
import AdminQuotes from "./admin/AdminQuotes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<AdminPage />} />
        <Route path="/quotes" element={<AdminQuotes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
