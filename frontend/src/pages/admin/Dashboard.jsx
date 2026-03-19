import SideBarMenu from "../../components/admin/SideBarMenu";

const Dashboard = () => {
    return (
        <div>
            <SideBarMenu activePage="dashboard" />

            <h1 className="text-white">Admin Dashboard</h1>
        </div>
    );
}

export default Dashboard;