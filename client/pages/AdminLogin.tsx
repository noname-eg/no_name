import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setError(result?.error || "Invalid username or password.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch {
      setError("Unable to connect to the authentication service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-166px)] items-center justify-center bg-[#eeece1] px-5 py-16 lg:px-8">
      <div className="w-full max-w-[430px] bg-white p-7 shadow-sm sm:p-10">
        <div className="mb-8 border-b border-[#1c2822]/15 pb-6 text-center">
          <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[#d4775c]">NO NAME CONTROL</p>
          <h1 className="font-serif text-4xl tracking-[-0.04em]">Admin dashboard</h1>
          <p className="mt-3 text-[12px] text-black/55">Sign in to manage your store.</p>
        </div>
        <form onSubmit={submitLogin} className="space-y-5">
          <label className="block text-[11px] font-bold">
            Username
            <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none focus:border-[#1c2822]" />
          </label>
          <label className="block text-[11px] font-bold">
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-black/15 bg-white px-3 py-3 text-[12px] outline-none focus:border-[#1c2822]" />
          </label>
          {error && <p role="alert" className="text-[11px] text-[#c95f49]">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#1c2822] py-4 text-[11px] font-bold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        <Link to="/" className="mt-6 block text-center text-[11px] text-black/55 underline underline-offset-4">Back to store</Link>
      </div>
    </section>
  );
}
