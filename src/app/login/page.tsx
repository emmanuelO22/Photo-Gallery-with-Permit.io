"use client"

import { useState } from "react"
import { login, signup } from "./actions"
import { Mail, Lock, LogIn, UserPlus } from "lucide-react"

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <>
      <div className="p-8 ">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <form className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pl-10"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 pl-10"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              formAction={isLogin ? login : signup}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {isLogin ? (
                <>
                  <LogIn className="mr-2" size={18} />
                  Log in
                </>
              ) : (
                <>
                  <UserPlus className="mr-2" size={18} />
                  Sign up
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </>
  )
}

