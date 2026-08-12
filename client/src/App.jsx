import "./App.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import RaiseTicket from "./pages/RaiseTicket";
import MyTicket from "./pages/MyTicket";
import TicketDetails from "./pages/TicketDetails";
import Profile from "./pages/Profile";

import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianTicketDetails from "./pages/TechnicianTicketDetails";

import AdminDashboard from "./pages/AdminDashboard";

import {
  Routes,
  Route,
} from "react-router-dom";

function App() {
  return (
    <Routes>

      {/* =================================================
          EMPLOYEE
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/raise-ticket"
        element={<RaiseTicket />}
      />

      <Route
        path="/my-tickets"
        element={<MyTicket />}
      />

      <Route
        path="/tickets/:id"
        element={<TicketDetails />}
      />

      <Route
        path="/profile"
        element={<Profile />}
      />

      {/* =================================================
          TECHNICIAN
      ================================================= */}

      <Route
        path="/technician/dashboard"
        element={
          <TechnicianDashboard />
        }
      />

      <Route
        path="/technician/tickets/:id"
        element={
          <TechnicianTicketDetails />
        }
      />

      {/* =================================================
          ADMIN
      ================================================= */}

      <Route
        path="/admin/dashboard"
        element={
          <AdminDashboard />
        }
      />

      {/* =================================================
          DEFAULT
      ================================================= */}

      <Route
        path="/"
        element={<Login />}
      />

    </Routes>
  );
}

export default App;