import React, { useContext, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "./context/auth";
import axios from "axios";
const AddNewUser = () => {
  const { user, setUser } = useContext(UserContext);

  const [formData, setFormDate] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const submitUser = async (e) => {
    e.preventDefault();

    if (formData.password != formData.confirmPassword) {
      toast("Passwords not matching");
      return;
    }

    //login
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/create`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (response.data) {
        toast("Successfully Added");

        setFormDate({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        });
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
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Create an account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            action="#"
            method="POST"
            onSubmit={submitUser}
          >
            <div>
              {/* <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label> */}
              <div className="mt-2">
                <input
                  placeholder="email@domain.com"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={formData.email}
                  onChange={(e) =>
                    setFormDate({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              {/* <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label> */}
              <div className="mt-2">
                <input
                  placeholder="Full Name"
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="fullname"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={formData.name}
                  onChange={(e) =>
                    setFormDate({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              {/* <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label> */}
              <div className="mt-2">
                <input
                  placeholder="Home Address/Role"
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="address"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={formData.role}
                  onChange={(e) =>
                    setFormDate({ ...formData, role: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              {/* <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label> */}
              <div className="mt-2">
                <input
                  placeholder="password"
                  id="password"
                  name="password"
                  type="text"
                  autoComplete="password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={formData.password}
                  onChange={(e) =>
                    setFormDate({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              {/* <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email address
                  </label> */}
              <div className="mt-2">
                <input
                  placeholder="confirm your password"
                  id="cpassword"
                  name="cpassword"
                  type="text"
                  autoComplete="cpassword"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormDate({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add new User
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="font-semibold leading-6 text-black-600 hover:text-indigo-500"
            >
              {" "}
              Terms of Service{" "}
            </a>
            and
            <a
              href="#"
              className="font-semibold leading-6 text-black-600 hover:text-indigo-500"
            >
              {" "}
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </>
  );
};
export default AddNewUser;
