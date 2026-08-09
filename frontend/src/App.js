import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Auth from "./Auth";
import Admin from "./Admin";
import Jobs from "./Jobs";
import ApplyForm from "./ApplyForm";
import NavBar from "./NavBar";
import Profile from "./Profile";
import Applications from "./Applications";
import AdminApplications from "./AdminApplications";
 
function App() {
  const user = JSON.parse(localStorage.getItem("user")); 
  const isLoggedInApplicant = () => user?.role === "applicant";

  const ApplyWrapper = () => {
    const { jobId } = useParams();
    return isLoggedInApplicant() ? <ApplyForm /> : <Navigate to={`/auth?mode=login&redirect=${encodeURIComponent(`/apply/${jobId}`)}`} replace />;
  };

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Jobs />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={user?.role === "admin" ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/jobs/:jobId/applications" element={user?.role === "admin" ? <AdminApplications /> : <Navigate to="/" />} />
        <Route path="/apply/:jobId" element={<ApplyWrapper />} />
        <Route path="/profile" element={user && (user.role === "applicant" || user.role === "admin") ? <Profile /> : <Navigate to="/" />} />
        <Route path="/applications" element={user?.role === "applicant" ? <Applications /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
