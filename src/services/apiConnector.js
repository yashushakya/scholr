import axios from "axios";

export const axiosInstance = axios.create({});

// Single-device login: if this device's session was replaced by a login on
// another device, or expired after 3 days, clear local auth state and send the user to the login page.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error?.response?.data?.code
    if (code === "SESSION_REPLACED" || code === "SESSION_EXPIRED") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      sessionStorage.setItem(
        "sessionReplacedMsg",
        error.response.data.message
      )
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
);

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};
