import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/auth";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
const UsersTable = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { user, setUser } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState({});

  const fetchDevices = async () => {
    //fetch
    try {
      if (user.token) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/device/user/get`,

          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (response.data) {
          setDevices(response.data);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (user && user.token) {
      fetchDevices();
      fetchStates();
    }
  }, [user]);

  const fetchStates = async () => {
    //fetch

    try {
      if (user.token) {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/state/user/latest`,

          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (response.data) {
          setStates(response.data);
          mapDeviceIdToState(response.data);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const mapDeviceIdToState = async (states) => {
    // Create a map for quick lookup of states by deviceId
    const stateMap = states.reduce((map, state) => {
      map[state.deviceId] = state.state;
      return map;
    }, {});

    setDeviceStatus(stateMap);
    setLoading(false);
  };

  const updateState = async (deviceId, oldState) => {
    let newState = oldState == "on" ? false : true;
    let deviceStates = [{ deviceId, state: newState }];
    try {
      if (user.token) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/state/user/update`,
          { deviceStates },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (response.data) {
          toast("State updated successfully.");
          fetchStates();
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <ToastContainer />

      <div className=" flex flex-col items-center">
        <div className="w-3/4 flex justify-start mt-4 mb-6">
          <div className=" shadow rounded  h-10 mt-4 flex p-1 relative items-center bg-[#F7F7F7] ">
            <div
              className={
                selectedTab == 0
                  ? `bg-white shadow text-gray-800 w-fit rounded h-full flex justify-center p-2`
                  : `w-fit  flex justify-center p-2`
              }
              onClick={() => setSelectedTab(0)}
            >
              <button>{user?.role}</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex w-3/4">
            <Skeleton containerClassName="flex-1" count={4} width={"100%"} />
          </div>
        ) : (
          <table className="border-collapse w-3/4 mx-auto border border-gray-200 px-2 py-4 mt-2 overflow-auto">
            <thead>
              <tr>
                <th className="p-3  text-gray-600  border-b border-gray-200 hidden lg:table-cell">
                  Name
                </th>
                <th className="p-3  text-gray-600  border-b border-gray-200 hidden lg:table-cell">
                  state
                </th>
                <th className="p-3  text-gray-600  border-b border-gray-200 hidden lg:table-cell">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {devices?.map((device) => {
                return (
                  <tr className="bg-white lg:hover:bg-gray-100 flex lg:table-row flex-row lg:flex-row flex-wrap lg:flex-no-wrap mb-10 lg:mb-0">
                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center  border-b border-gray-200 block lg:table-cell relative lg:static">
                      {device.name}
                    </td>
                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center  border-b border-gray-200 text-center block lg:table-cell relative lg:static">
                      <span
                        onClick={() =>
                          updateState(
                            device.deviceId,
                            deviceStatus[device.deviceId] ? "on" : "false"
                          )
                        }
                        className={`${
                          deviceStatus[device.deviceId]
                            ? `bg-green-400`
                            : "bg-red-400"
                        } rounded-md  py-3 px-4 text-xs font-bold text-white cursor-pointer`}
                      >
                        {deviceStatus[device.deviceId] ? "on" : "off"}
                      </span>
                    </td>
                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center  border-b border-gray-200 text-center block lg:table-cell relative lg:static">
                      {device.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default UsersTable;
