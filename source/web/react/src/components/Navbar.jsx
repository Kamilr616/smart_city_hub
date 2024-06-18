import React, { useState } from "react";

const Navbar = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="w-3/4 flex justify-start mt-4 rounded bg-[#F7F7F7] h-10 mb-4 font-semibold text-gray-600">
      <div className="flex-1 max-w-sm  mx-8 shadow rounded border h-10 mt-4 flex p-1 relative items-center bg-[#F7F7F7] ">
        <div
          className={
            selectedTab == 0
              ? `bg-white shadow text-gray-800 w-full rounded h-full flex justify-center`
              : `w-full flex justify-center`
          }
          onClick={() => setSelectedTab(0)}
        >
          <button>Left</button>
        </div>
        <div
          className={
            selectedTab == 1
              ? `bg-white shadow text-gray-800  w-full rounded h-full flex justify-center`
              : `w-full flex justify-center`
          }
          onClick={() => setSelectedTab(1)}
        >
          <button>Right</button>
        </div>
        <div
          className={
            selectedTab == 2
              ? `bg-white shadow text-gray-800  w-full rounded h-full flex justify-center`
              : `w-full flex justify-center`
          }
          onClick={() => setSelectedTab(2)}
        >
          <button>Right</button>
        </div>
        <div
          className={
            selectedTab == 3
              ? `bg-white shadow text-gray-800  w-full rounded h-full flex justify-center `
              : `w-full flex justify-center`
          }
          onClick={() => setSelectedTab(3)}
        >
          <button>Right</button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
