"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { auth, googleProvider, facebookProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  
  
  const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("Logged in:", userCredential.user)
    router.push("/bulk-invoice-generator") // or wherever your main page is
  } catch (error: any) {
    console.error("Login error:", error.message)
    setError("Invalid email or password.")
  }
}

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/bulk-invoice-generator");
    } catch (err) {
      alert("Google sign-in failed");
      console.error(err);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      router.push("/bulk-invoice-generator");
    } catch (err) {
      alert("Facebook sign-in failed");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center px-4 animate-fadeIn">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-blue-200 animate-slideUp">
        {/* Logo and Welcome Text */}
        <div className="flex flex-col items-center mb-6">
          <Image src={logo} alt="Logo" width={140} height={140} />
          <h2 className="text-3xl font-bold text-blue-800 mt-4">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Login to your account</p>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
            />
            <button
              type="button"
              className="absolute top-3 right-3 text-blue-500 text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition duration-300"
          >
            LOGIN
          </button>
        </div>

        {/* Icons Only for Google and Facebook */}
        <div className="flex justify-center space-x-6 mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-full hover:shadow-lg transition duration-300"
          >
            <FaGoogle className="text-red-500 text-2xl" />
          </button>
          <button
            onClick={handleFacebookLogin}
            className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-full hover:shadow-lg transition duration-300"
          >
            <FaFacebookF className="text-blue-600 text-2xl" />
          </button>
        </div>

        <p className="text-sm text-center mt-6">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline font-medium">
            Create one
          </a>
        </p>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-in;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
