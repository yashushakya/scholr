import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { useDispatch } from "react-redux"
import { Link, useNavigate } from "react-router-dom"

import { login } from "../../../services/operations/authAPI"
import ConfirmationModal from "../../Common/ConfirmationModal"

function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState(null)

  // Tell the user why they were signed out of this device
  useEffect(() => {
    const msg = sessionStorage.getItem("sessionReplacedMsg")
    if (msg) {
      toast.error(msg)
      sessionStorage.removeItem("sessionReplacedMsg")
    }
  }, [])

  const { email, password } = formData

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOnSubmit = (e) => {
    e.preventDefault()
    dispatch(
      login(email, password, navigate, false, (device) =>
        setConfirmationModal({
          text1: "Already logged in on another device",
          text2: `Your account is active on ${device}. Log out from that device and continue here?`,
          btn1Text: "Log out & continue",
          btn2Text: "Cancel",
          btn1Handler: () => {
            setConfirmationModal(null)
            dispatch(login(email, password, navigate, true))
          },
          btn2Handler: () => setConfirmationModal(null),
        })
      )
    )
  }

  return (
    <form
      onSubmit={handleOnSubmit}
      className="mt-6 flex w-full flex-col gap-y-4"
    >
      <label className="w-full">
        <p className="mb-1 text-xs font-medium text-[#94a3b8]">
          Email Address <sup className="text-pink-200">*</sup>
        </p>
        <input
          required
          type="text"
          name="email"
          value={email}
          onChange={handleOnChange}
          placeholder="Enter email address"
          className="form-style w-full"
        />
      </label>
      <label className="relative">
        <p className="mb-1 text-xs font-medium text-[#94a3b8]">
          Password <sup className="text-pink-200">*</sup>
        </p>
        <input
          required
          type={showPassword ? "text" : "password"}
          name="password"
          value={password}
          onChange={handleOnChange}
          placeholder="Enter Password"
          className="form-style w-full !pr-10"
        />
        <span
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-[38px] z-[10] cursor-pointer"
        >
          {showPassword ? (
            <AiOutlineEyeInvisible fontSize={24} className="text-[#94a3b8] hover:text-[#06b6d4] transition-colors" />
          ) : (
            <AiOutlineEye fontSize={24} className="text-[#94a3b8] hover:text-[#06b6d4] transition-colors" />
          )}
        </span>
        <Link to="/forgot-password">
          <p className="mt-1 ml-auto max-w-max text-xs text-[#06b6d4] hover:text-[#67e8f9] transition-colors">
            Forgot Password
          </p>
        </Link>
      </label>
      <button
        type="submit"
        className="mt-6 w-full border border-[#06b6d4] text-[#06b6d4] bg-transparent hover:bg-[#06b6d4] hover:text-[#060d1a] py-2.5 rounded-[4px] font-semibold text-sm transition-all duration-150"
      >
        Sign In
      </button>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </form>
  )
}

export default LoginForm