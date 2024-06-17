import React, { useState } from "react";
import AdminsTable from "./table/AdminsTable";
import AdminSidebar from "./AdminSidebar";
import AddNewUser from "../AddNewUser";
import AddDevice from "../AddDevice";

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState(null);

  return (
    <div className="h-full flex">
      <AdminSidebar setSelectedTab={setSelectedTab} />
      <div className="flex flex-col  mt-10 w-3/4">
        {selectedTab ? (
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
