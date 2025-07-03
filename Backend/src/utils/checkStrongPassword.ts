// check if password is at least 8 characters long has 1 uppercase 1 lowercase 1 digit and 1 special character
const isStrongPassword = (password: string): boolean=> {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return passwordRegex.test(password);
}

export default isStrongPassword;