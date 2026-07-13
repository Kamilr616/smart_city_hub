import Sidebar from "./Sidebar";
import UsersTable from "./table/UsersTable";

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
