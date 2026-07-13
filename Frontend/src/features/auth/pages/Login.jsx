import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hook/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { handleLogin, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notVerified, setNotVerified] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when typing
    setNotVerified(false);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);

    if (!formData.email.trim()) {
      setError("Email address is required.");
      return;
    }
    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleLogin({
        email: formData.email,
        password: formData.password,
      });

      if (!result.success) {
        if (result.status === 403) {
          setNotVerified(true);
        }
        throw new Error(result.error || "Invalid email or password.");
      }

      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#131415] px-4 py-12">
      <div className="w-full max-w-md bg-[#1c1e1f] border border-[#2d3131] rounded-3xl p-8 shadow-2xl transition-all duration-300">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-2">
            Log in to your account to access your workspace.
          </p>
        </div>

        {error && (
          <div
            className={`mb-6 flex items-start gap-3 border rounded-xl p-4 text-sm ${
              notVerified
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {notVerified ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 shrink-0 mt-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            )}
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="john@example.com"
                className="w-full bg-[#131415] border border-[#2d3131] focus:border-[#20808D] focus:ring-1 focus:ring-[#20808D] rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-[#20808D] hover:text-[#3ab2bf] font-semibold transition-colors duration-150"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full bg-[#131415] border border-[#2d3131] focus:border-[#20808D] focus:ring-1 focus:ring-[#20808D] rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none transition-all placeholder:text-slate-600 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-[#2d3131] bg-[#131415] text-[#20808D] focus:ring-[#20808D] accent-[#20808D]"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-slate-400 select-none cursor-pointer"
            >
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#20808D] hover:bg-[#1a6872] active:bg-[#15545c] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#20808D]/10 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#20808D] hover:text-[#3ab2bf] font-semibold transition-colors duration-150"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
