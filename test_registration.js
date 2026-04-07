const axios = require("axios");
const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

async function testFrontendRegistration() {
  console.log("Testing frontend registration flow...");
  try {
    const formData = {
      email: "frontendtest@example.com",
      first_name: "Frontend",
      last_name: "Test",
      password: "Test12345",
      role: "viewer",
    };

    console.log("Sending registration request...");
    const response = await api.post("/auth/register/", formData);

    console.log("Response status:", response.status);
    console.log("Response structure check:");
    console.log("- response.data exists:", !!response.data);
    console.log("- response.data.data exists:", !!response.data.data);
    console.log("- tokens exist:", !!response.data.data?.tokens);
    console.log("- user data exists:", !!response.data.data?.data);

    if (
      response.data.data &&
      response.data.data.tokens &&
      response.data.data.data
    ) {
      console.log("✅ Frontend API parsing: SUCCESS");
      const { tokens, data: userData } = response.data.data;
      console.log("Parsed tokens:", !!tokens.access_token);
      console.log("Parsed user:", userData.email);
    } else {
      console.log("❌ Frontend API parsing: FAILED");
      console.log("Expected: response.data.data.{tokens, data}");
    }
  } catch (error) {
    console.log("❌ Registration failed!");
    console.log("Status:", error.response?.status);
    console.log("Error data:", error.response?.data);
    console.log("Error message:", error.message);
  }
}

testFrontendRegistration();
