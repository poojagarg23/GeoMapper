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

const getRealClientIP = async () => {
  try {
    const ipServices = [
      "https://api.ipify.org?format=json",
      "https://ipinfo.io/ip",
    ];

    for (const service of ipServices) {
      try {
        const response = await axios.get(service, { timeout: 3000 });

        if (service.includes("ipify")) {
          console.log(response.data.ip, "response.data.ip");
          return response.data.ip;
        } else if (service.includes("ipinfo")) {
          console.log(response.data, "response.data");
          return response.data;
        }
      } catch (err) {
        console.log(err.message);
        continue;
      }
    }

    throw new Error("All IP detection services failed");
  } catch (error) {
    console.error("Error getting real client IP:", error.message);
    throw error;
  }
};

function getClientIp(req) {
  let ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  console.log("Raw IP from headers:", ip);

  // If the IP is a comma-separated list, take the first one (usually the client's real IP)
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // If the IP address is IPv6-mapped IPv4 (e.g., ::ffff:192.168.1.1), strip it out to get the real IPv4 address
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7); // Remove the ::ffff: prefix for IPv4-mapped IPv6
  }

  // For IPv6, ensure no additional processing is required
  if (ip && ip.includes(":")) {
    console.log("Detected IPv6:", ip);
  }
  return ip;
}

app.get("/get-location", async (req, res) => {
  let clientIp = null;
  let ipSource = "unknown";
  let autoDetected = false;

  try {
    const publicIpResponse = await axios.get(
      "https://api.ipify.org?format=json"
    );
    const configuredIp = publicIpResponse.data.ip;
    console.log(configuredIp, "configuredIp");
    clientIp = getClientIp(req);

    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      ipSource = "request_headers";
    } else {
      try {
        clientIp = await getRealClientIP();
        ipSource = "auto_detected";
        autoDetected = true;
      } catch (autoDetectError) {
        return res.status(400).json({
          error: "Unable to determine client IP address",
          message:
            "Failed to detect IP from both headers and external services",
          details: autoDetectError.message,
        });
      }
    }

    if (!clientIp) {
      return res.status(400).json({
        error: "No IP address could be determined",
        message: "All IP detection methods failed",
      });
    }

    const response = await axios.get(`${GEOLOCATION_API_URL}${clientIp}`);
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
    const { city } = req.body;
    const response = await axios.get(
      `https://ipapi.co/currency/`,
      `
`
    );
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
