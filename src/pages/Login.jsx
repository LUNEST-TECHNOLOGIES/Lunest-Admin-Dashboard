import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { loginUser } from "../services/adminService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      console.log("Login response received:", response);

      // Backend returns {body: {token: "...", user: {...}}, message: "..."}
      if (response.body && response.body.token) {
        console.log("✓ Login successful!");
        console.log("Message:", response.message);
        console.log("User token extracted");

        // Show success message
        setSuccess(response.message || "Login successful! Redirecting...");

        // Store token
        localStorage.setItem("authToken", response.body.token);
        localStorage.setItem("loginMessage", response.message);

        // Store user data for profile display
        if (response.body.user) {
          localStorage.setItem("adminUser", JSON.stringify(response.body.user));
          console.log("User data stored:", response.body.user);
        }

        // Small delay to show success before redirect
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        console.error("✗ No token in response:", response);
        setError(response.message || "Login failed: No token received");
      }
    } catch (err) {
      console.error("✗ Login failed:", err.message);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      // Handle different error types
      let errorMessage = "Login failed. Please try again.";
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = "Unable to connect to server. Please check if the backend is running on port 3000.";
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = "Connection refused. The server may be down.";
      } else if (err.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (err.response?.status === 404) {
        errorMessage = "Login endpoint not found. Please check API configuration.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-12 py-40 inline-flex flex-col justify-center items-center overflow-hidden bg-gray-50">
      <div className="p-7 bg-white rounded-xl outline outline-0.5 outline-stone-300 flex flex-col justify-center items-center gap-8 max-w-2xl w-full">
        {/* Logo Section */}
        <div className="self-stretch flex flex-col justify-center items-center gap-2.5">
          <div className="flex flex-col justify-center items-center gap-1">
           
            <div className="h-6 rounded-md">
              <img src="/assets/login-logo.svg" alt="Logo" />
            </div>
          </div>
          <div className="self-stretch text-center text-slate-900 text-base font-semibold font-aeonik">
            Admin Login
          </div>
        </div>

        {/* Welcome Text */}
        <div className="self-stretch flex flex-col justify-start items-center gap-2.5">
          <div className="self-stretch text-center text-indigo-900 text-2xl font-bold font-aeonik">
            Welcome Back!
          </div>
          <div className="self-stretch text-center text-slate-400 text-base font-medium">
            Sign in to your admin account to manage the platform
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="self-stretch p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="self-stretch p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="self-stretch flex flex-col justify-start items-center gap-10 w-full"
        >
          {/* Input Fields */}
          <div className="flex flex-col justify-start items-center gap-7 w-full px-0">
            {/* Email Input */}
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center px-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-transparent text-stone-500 text-sm font-normal outline-none placeholder-stone-500"
              />
            </div>

            {/* Password Input */}
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center justify-between px-5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="flex-1 bg-transparent text-stone-500 text-sm font-normal outline-none placeholder-stone-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-neutral-500 hover:text-neutral-700 transition"
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 cursor-pointer px-12 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 rounded-3xl inline-flex justify-center items-center gap-1 transition duration-200"
          >
            <div className="text-white text-base font-bold font-aeonik leading-4">
              {loading ? "Logging in..." : "Login"}
            </div>
          </button>

          {/* Footer */}
          <div className="self-stretch flex flex-col justify-start items-center gap-5">
            <div className="h-6 inline-flex justify-between items-center">
              <div className="py-1.5 flex justify-center items-center gap-2.5">
                <Link
                  to="/forgot-password"
                  className="text-sky-800 text-lg font-semibold font-aeonik hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
