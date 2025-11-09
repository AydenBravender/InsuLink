import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InsuLinkLogo from "../assets/InsuLinkLogo.png";

type FormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  weight: string;
  height: string;
  age: string;
};

export default function SignupCard() {
  const [step, setStep] = useState(() => {
    // Restore last step from localStorage if available
    const savedStep = localStorage.getItem("signupStep");
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    // Restore saved form data if available
    const savedData = localStorage.getItem("signupFormData");
    return savedData
      ? JSON.parse(savedData)
      : {
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          gender: "",
          weight: "",
          height: "",
          age: ""
        };
  });

  const navigate = useNavigate();
  const [progress, setProgress] = useState(33);

  useEffect(() => {
    setProgress((step / 3) * 100);
    localStorage.setItem("signupStep", step.toString());
  }, [step]);

  // Save form data automatically on every change
  useEffect(() => {
    localStorage.setItem("signupFormData", JSON.stringify(formData));
  }, [formData]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Extract ONLY the fields we want to persist (NO email, NO password)
    const { firstName, lastName, gender, weight, height, age } = formData;

    // Save the user’s profile (used in AppShell for profile modal)
    localStorage.setItem(
      "insulinkProfile",
      JSON.stringify({ firstName, lastName, gender, weight, height, age })
    );

    // Clear temporary signup wizard data
    localStorage.removeItem("signupFormData");
    localStorage.removeItem("signupStep");

    // Redirect the user into the main app
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-base-200 rounded-3xl shadow-xl">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-4">
          <img
            src={InsuLinkLogo}
            alt="InsuLink logo"
            className="w-56 mb-4 drop-shadow-xl mx-auto"
          />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <fieldset className="fieldset border border-base-300 p-6 rounded-xl">
            <legend className="fieldset-legend text-xl font-bold">
              Account Info
            </legend>
            {/* Email */}
            <input className="input validator" type="email" required placeholder="name@gmail.com" />
            {/* password */}
            <input
              type="password"
              className="input validator"
              required
              placeholder="Password"
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            />
            <p className="validator-hint">
              Must be more than 8 characters, including
              <br />
              At least one number
              <br />
              At least one lowercase letter
              <br />
              At least one uppercase letter
            </p>
            
            <p className="text-sm text-gray-500 mt-2">
              Password must be at least 8 characters, include a number and a
              special character.
            </p>
          {/* next button */}
            <div className="flex justify-end mt-6">
              <button className="btn btn-primary" onClick={nextStep}>
                Next
              </button>
            </div>
          </fieldset>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <fieldset className="fieldset border border-base-300 p-6 rounded-xl">
            <legend className="fieldset-legend text-xl font-bold">
              Personal Info
            </legend>

            <label className="label mt-4">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="First Name"
            />

            <label className="label mt-4">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Last Name"
            />

            <div className="flex justify-between mt-6">
              <button className="btn btn-accent" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep}>
                Next
              </button>
            </div>
          </fieldset>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <fieldset className="fieldset border border-base-300 p-6 rounded-xl">
            <legend className="fieldset-legend text-xl font-bold">
              Health Info
            </legend>

            <label className="label mt-4">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label className="label mt-4">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Weight"
            />

            <label className="label mt-4">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Height"
            />

            <label className="label mt-4">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Age"
            />

            <div className="flex justify-between mt-6">
              <button className="btn btn-accent" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </fieldset>
        )}

        {/* Progress Bar at Bottom */}
        <div className="w-60 ml-18 mt-5 h-2 bg-gray-300 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
