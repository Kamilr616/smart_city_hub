import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./context/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const { user, setUser } = useContext(UserContext);

  const [formData, setFormDate] = useState({
    login: "",
    password: "",
  });

  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();

    //login
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/auth`,
        formData
      );
      if (response.data.token) {
        setUser(response.data);
        toast("Successfully Logged In");
        navigate("/");
      }
    } catch (error) {
      toast("Something went wrong.");
      console.log(error);
    }
  };
  return (
    <>
      <ToastContainer />
      <div className=" flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className=" text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Login
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            onSubmit={loginUser}
            className="space-y-6"
            action="#"
            method="POST"
          >
            <div>
              <div className="mt-2">
                <input
                  placeholder="email@domain.com"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black-600 sm:text-sm sm:leading-6"
                  value={formData.login}
                  onChange={(e) =>
                    setFormDate({ ...formData, login: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <div className="mt-1">
                <input
                  id="password"
                  placeholder="Password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black-600 sm:text-sm sm:leading-6"
                  value={formData.password}
                  onChange={(e) =>
                    setFormDate({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm  focus-visible:outline-2 focus-visible:outline-offset-2 "
              >
                login
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
