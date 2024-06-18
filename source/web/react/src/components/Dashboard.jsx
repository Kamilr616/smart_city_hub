import React, { useContext } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import UsersTable from "./table/UsersTable";
import { UserContext } from "../context/auth";

const Dashboard = () => {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex flex-col  mt-10 w-3/4">
        <UsersTable />
      </div>
    </div>
  );
};

export default Dashboard;
