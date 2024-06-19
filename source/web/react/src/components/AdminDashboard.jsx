import React, { useState } from "react";
import AdminsTable from "./table/AdminsTable";
import AdminSidebar from "./AdminSidebar";
import AddNewUser from "../AddNewUser";
import AddDevice from "../AddDevice";
import kiLogo from '../assets/ki_LOGO_b.svg'

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("HomeLights");

  return (
    <div className="h-full flex">
      <AdminSidebar setSelectedTab={setSelectedTab} />
      <div className="flex flex-col  mt-10 w-3/4">
        {selectedTab != "HomeLights" ? (
          selectedTab == "addNewUser" ? (
            <AddNewUser />
          ) : (
            <AddDevice />
          )
        ) : (
          <AdminsTable />
        )}
        {/* <AdminsTable /> */}
      </div>
    </div>
  );
};

export default AdminDashboard;
