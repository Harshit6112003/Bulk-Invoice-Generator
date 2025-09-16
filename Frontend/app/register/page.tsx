"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import {
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaFacebookF,
} from "react-icons/fa";
import { auth, googleProvider, facebookProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    date: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      router.push("/login");
    } catch (error: any) {
      alert(error.message || "Registration failed");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/bulk-invoice-generator");
    } catch (error: any) {
      alert(error.message || "Google signup failed");
    }
  };

  const handleFacebookSignup = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      router.push("/bulk-invoice-generator");
    } catch (error: any) {
      alert(error.message || "Facebook signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#cfe0ff] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl animate-fade-in border border-blue-200 transition-all duration-500">
        <div className="flex flex-col items-center mb-6">
          <Image src={logo} alt="Company Logo" width={140} height={140} />
          <h2 className="text-3xl font-extrabold text-blue-800 mt-4 tracking-wide animate-fade-in">
            Create Account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Join us and start billing smarter!
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              name: "firstName",
              placeholder: "First Name",
              icon: <FaUser />,
            },
            {
              name: "lastName",
              placeholder: "Last Name",
              icon: <FaUser />,
            },
            {
              name: "phone",
              placeholder: "Phone Number",
              icon: <FaPhone />,
              iconClass: "top-3 rotate-90", // rotated slightly for visual appeal
            },
         
            {
              name: "email",
              placeholder: "Email",
              type: "email",
              icon: <FaEnvelope />,
            },
          ].map(({ name, placeholder, icon, type = "text", iconClass = "top-3" }) => (
            <div className="relative" key={name}>
              <input
                name={name}
                type={type}
                placeholder={placeholder}
                value={(form as any)[name]}
                onChange={handleChange}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <div className={`absolute left-3 text-blue-600 ${iconClass}`}>{icon}</div>
            </div>
          ))}

          {/* Password */}
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <FaLock className="absolute top-3 left-3 text-blue-600" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-sm text-blue-600 hover:text-blue-800"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <FaLock className="absolute top-3 left-3 text-blue-600" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-sm text-blue-600 hover:text-blue-800"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-700 text-white font-semibold rounded-xl shadow hover:bg-blue-800 transition duration-200"
          >
            Sign Up
          </button>

          {/* Social Login */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={handleGoogleSignup}
              className="p-3 bg-white border rounded-full shadow hover:shadow-md transition"
            >
              <FaGoogle className="text-red-500" size={32} />
            </button>
            <button
              onClick={handleFacebookSignup}
              className="p-3 bg-white border rounded-full shadow hover:shadow-md transition"
            >
              <FaFacebookF className="text-blue-600" size={32} />
            </button>
          </div>

          {/* Link to Login */}
          <p className="text-sm text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-blue-700 hover:underline font-medium">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
