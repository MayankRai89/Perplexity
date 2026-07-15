import { RouterProvider } from "react-router";
import router from "./app.routes.jsx";
import { useAuth } from "../features/auth/hook/useAuth.js";
import { useEffect } from "react";
import { ChatProvider } from "../features/chat/context/ChatContext.jsx";

function App() {
  const auth = useAuth();
  useEffect(() => {
    auth.handleGetMyProfile();
  }, []);

  return (
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  );
}

export default App;
