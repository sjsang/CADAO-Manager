import SideBarMenu from "../../components/admin/SideBarMenu";

const CustomerManager = () => {
    return (
        <div>
            <SideBarMenu activePage="customers" />

            <h1 className="text-white">Customer Manager</h1>
        </div>
    );
}

export default CustomerManager;