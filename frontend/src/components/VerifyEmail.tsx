import { useSelector } from "react-redux";
import { RootState } from "../store/storeSetup";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const VerifyEmail = () => {
    const navigate = useNavigate();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    useEffect(() => {
        if(isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    
    return (
        <div>

        </div>
    )
}

export default VerifyEmail;