import { useState } from "react";
import PropTypes from "prop-types";
import { Mail, ShieldCheck, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "../services/api";
import { saveSession } from "../services/auth";

function LoginGate({ onAuthenticated }) {
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const { session: authSession } = await api.requestOtp(trimmedEmail);
      setEmail(trimmedEmail);
      setSession(authSession);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.verifyOtp(email, code.trim(), session);
      saveSession({ ...result, email });
      onAuthenticated();
    } catch (err) {
      setError(err.message || "Invalid code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setStep("email");
    setCode("");
    setSession(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-emerald-100 text-emerald-700 rounded-full p-3">
            <ShieldCheck size={28} />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 text-center mb-1">
          ShipStation Partner API Demo
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          {step === "email"
            ? "Sign in with your ShipStation email to continue."
            : `Enter the code sent to ${email}`}
        </p>

        {error ? (
          <div className="mb-4 flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@shipstation.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2 transition-colors"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Verification code"
              className="w-full text-center tracking-widest text-lg px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2 transition-colors"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Verify code"}
            </button>
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className="w-full flex items-center justify-center text-slate-500 hover:text-slate-700 text-sm py-1"
            >
              <ArrowLeft size={14} className="mr-1" /> Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

LoginGate.propTypes = {
  onAuthenticated: PropTypes.func.isRequired,
};

export default LoginGate;
