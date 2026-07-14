import { createBrowserRouter } from "react-router";
import Home from "../features/auth/pages/Home.jsx";
import Chat from "../pages/Chat.jsx";
import Discover from "../pages/Discover.jsx";
import Library from "../pages/Library.jsx";
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import Protected from "../features/auth/components/protected.jsx";
import Dashboard from "../features/chat/pages/Dashboard.jsx";
import { Navigate } from "react-router";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
  {
    path: "/discover",
    element: (
      <Protected>
        <Discover />
      </Protected>
    ),
  },
  {
    path: "/library",
    element: (
      <Protected>
        <Library />
      </Protected>
    ),
  },
  {
    path: "*",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
