import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineArrowLeft } from "react-icons/ai";
import { forgotPassword, verifyResetCode, resetPassword } from "../services/adminService";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || "OTP sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyResetCode(email, otp);
      if (res.body && res.body.token) {
        setToken(res.body.token);
        setStep(3);
        setSuccess("Code verified. Please set your new password.");
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(token, newPassword);
      setSuccess(res.message || "Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password.");
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
          <div className="self-stretch text-center text-slate-900 text-base font-semibold font-aeonik uppercase tracking-wider">
            Password Recovery
          </div>
        </div>

        {/* Step Information */}
        <div className="self-stretch flex flex-col justify-start items-center gap-2.5">
          <div className="self-stretch text-center text-indigo-900 text-2xl font-bold font-aeonik">
            {step === 1 ? "Forgot Password?" : step === 2 ? "Verify Email" : "Reset Password"}
          </div>
          <div className="self-stretch text-center text-slate-400 text-base font-medium">
            {step === 1 
              ? "Enter your email to receive a password reset code." 
              : step === 2 
                ? `Enter the 4-digit code sent to ${email}` 
                : "Create a new strong password for your account."}
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="self-stretch p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="self-stretch p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="self-stretch flex flex-col gap-6 w-full">
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center px-5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-transparent text-stone-500 text-sm font-normal outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 rounded-3xl text-white font-bold transition duration-200"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="self-stretch flex flex-col gap-6 w-full">
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center px-5 text-center">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit code"
                required
                maxLength={4}
                className="w-full bg-transparent text-stone-900 text-center text-xl font-bold tracking-[1em] outline-none"
              />
            </div>
            <div className="flex gap-4">
               <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-12 border border-slate-300 rounded-3xl font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="flex-[2] h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 rounded-3xl text-white font-bold transition"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="self-stretch flex flex-col gap-6 w-full">
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center justify-between px-5">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
                className="flex-1 bg-transparent text-stone-500 text-sm outline-none"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
            <div className="w-full h-11 relative bg-neutral-100 rounded-3xl outline outline-1 outline-zinc-400 flex items-center px-5">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
                className="w-full bg-transparent text-stone-500 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 rounded-3xl text-white font-bold transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 w-full flex justify-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sky-800 font-semibold hover:underline">
            <AiOutlineArrowLeft />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
