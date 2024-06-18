import React, { useContext, useState } from "react";
import { UserContext } from "./context/auth";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const AddDevice = () => {
  const { user, setUser } = useContext(UserContext);

  const [deviceData, setDeviceData] = useState({
    location: "",
    name: "",
    description: "",
    type: "",
    id: "",
  });

  const submitDevice = async (e) => {
    e.preventDefault();

    //login
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/device/update`,
        deviceData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (response.data) toast("Device added successfully.");

      setDeviceData({
        location: "",
        name: "",
        description: "",
        type: "",
        id: "",
      });
    } catch (error) {
      toast("Something went wrong.");
      console.log(error);
    }
  };
  return (
    <>
      <ToastContainer />

      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Add New Device
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            className="space-y-6"
            action="#"
            method="POST"
            onSubmit={submitDevice}
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
                  placeholder="location"
                  id="location"
                  name="location"
                  type="location"
                  autoComplete="location"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={deviceData.location}
                  onChange={(e) =>
                    setDeviceData({ ...deviceData, location: e.target.value })
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
                  placeholder="name"
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={deviceData.name}
                  onChange={(e) =>
                    setDeviceData({ ...deviceData, name: e.target.value })
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
                  placeholder="description"
                  id="description"
                  name="description"
                  type="text"
                  autoComplete="description"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={deviceData.description}
                  onChange={(e) =>
                    setDeviceData({
                      ...deviceData,
                      description: e.target.value,
                    })
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
                  placeholder="type"
                  id="type"
                  name="type"
                  type="text"
                  autoComplete="type"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={deviceData.type}
                  onChange={(e) =>
                    setDeviceData({ ...deviceData, type: e.target.value })
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
                  placeholder="deviceID"
                  id="deviceID"
                  name="deviceID"
                  type="text"
                  autoComplete="deviceID"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={deviceData.id}
                  onChange={(e) =>
                    setDeviceData({ ...deviceData, id: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                add
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default AddDevice;
