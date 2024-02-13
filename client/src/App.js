import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import OnlineUsers from "./OnlineUsers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/online-users" element={<OnlineUsers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
