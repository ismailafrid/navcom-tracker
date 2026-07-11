// Automatically switches between your live Render backend and localhost
const API_BASE_URL = import.meta.env.PROD
  ? "https://navcom-tracker.onrender.com" // Replace with your actual live backend Render URL if different
  : "http://localhost:3000";

export default API_BASE_URL;
