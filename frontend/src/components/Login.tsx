import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store/storeSetup";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { loginSuccess } from "../store/authSlice";
import { useSelector } from "react-redux";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    useEffect(() => {
        if(isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    const dispatch = useDispatch<AppDispatch>();    

    const [formData, setFormData] = useState({
        identifier: "",
        password: ""
    });

    const [error, setError] = useState<string | null>(null);

    const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [event.target.name]: event.target.value
        }));
    }

    const handleSubmit = async(event : React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const res = await api.post("/login", formData);
            const { user } = res.data;
            dispatch(loginSuccess(user));
            navigate("/");
        } catch(err: any) {
            const message = err.response?.data?.message;
            setError(message || "Login Failed");
        }
    };

    return (
        <div>
            <form>
                <input
                    type="text"
                    name="identifier"
                    placeholder="username or email"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                />
                <input  
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                {error && <p>{error}</p>}

                <button type="submit" onClick={handleSubmit}>Login</button>
            </form>
        </div>
    )
}

export default Login;