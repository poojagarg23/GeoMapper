const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const GEOLOCATION_API_URL = "http://ip-api.com/json/";

app.get("/get-location", async (req, res) => {
  let clientIp = null;
  let ipSource = "unknown";
  let autoDetected = false;

  try {
    const publicIpResponse = await axios.get(
      "https://api6.ipify.org?format=json"
    );
    const configuredIp = publicIpResponse.data.ip;

    const response = await axios.get(`${GEOLOCATION_API_URL}${configuredIp}`);
    const locationData = response.data;

    if (locationData.status === "fail") {
      return res.status(400).json({
        error: "Unable to get location data for IP",
        message: locationData.message,
        ip: clientIp,
      });
    }

    res.json({
      ip: locationData.query,
      country: locationData.country,
      countryCode: locationData.countryCode,
      region: locationData.regionName,
      regionCode: locationData.region,
      city: locationData.city,
      zip: locationData.zip,
      lat: locationData.lat,
      lon: locationData.lon,
      timezone: locationData.timezone,
      isp: locationData.isp,
      org: locationData.org,
      detectionMethod: ipSource,
      autoDetected: autoDetected,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in get-location endpoint:", err.message);
    res.status(500).json({
      error: "Something went wrong while fetching location data",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/get-city-information", async (req, res) => {
  try {
    if (!req.body?.iPAddress) {
      return res.status(400).json({
        error: "IP address is required",
      });
    }
    const { iPAddress } = req.body;

    const response = await axios.get(
      `https://ipapi.co/${iPAddress}/json/`,
      `
`
    );

    if (response.status === 200) {
      return res.status(200).json(response.data);
    } else {
      return res.status(400).json({
        message: "Unable to share the response",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
