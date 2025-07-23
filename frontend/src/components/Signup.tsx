import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/storeSetup";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const Signup: React.FC = () => {
    const navigate = useNavigate();

    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    useEffect(() => {
        if(isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    }); 

    const [message, setMessage] = useState<string | null>(null);

    const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [event.target.name]: event.target.value
        }))
    }

    const handleSubmit = async(event: React.FormEvent) => {
        event.preventDefault();
        setMessage(null);

        try {
            const res = await api.post("/signup", formData);
            const message = res.data.message;
            setMessage(message);
        } catch(err: any) {
            const message = err.response?.data?.message;
            setMessage(message || "SignUp Failed");
        }
    }

    return (
        <div>
            <form>
                <input
                    type="text"
                    name="email"
                    placeholder="xyz@email.com"
                    value={formData.email}
                    required
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Password"
                />

                {message && <p>{message}</p>}

                <button type="submit" onClick={handleSubmit}>Sign Up</button>
            </form>
        </div>
    )
}

export default Signup;