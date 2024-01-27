import "dotenv/config";
import axios from "axios";
import express, { json } from "express";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import { z } from "zod";

const app = express();
app.use(json());

const envSchema = z.object({
  AUTH0_BASE_URL: z.string().url(),
  AUTH0_AUDIENCE: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
});

const ENV = envSchema.parse(process.env);

const checkJwt = auth({
  audience: ENV.AUTH0_AUDIENCE,
  issuerBaseURL: ENV.AUTH0_BASE_URL,
});

app.get("/api/public", function (req, res) {
  res.json({
    message:
      "Hello from a public endpoint! You don't need to be authenticated to see this.",
  });
});

app.get("/api/private", checkJwt, function (req, res) {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated to see this.",
  });
});

const checkScopes = requiredScopes("read:messsages");

app.get("/api/private-scoped", checkJwt, checkScopes, function (req, res) {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.",
  });
});

app.post("/api/login", async function (req, res) {
  const { data } = await axios.post(
    `${ENV.AUTH0_BASE_URL}/oauth/token`,
    {
      grant_type: "password",
      username: req.body.username,
      password: req.body.password,
      audience: ENV.AUTH0_AUDIENCE,
      scope: "offline_access",
      client_id: ENV.AUTH0_CLIENT_ID,
      client_secret: ENV.AUTH0_CLIENT_SECRET,
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );

  res.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
});

app.listen(3000, function () {
  console.log("Listening on http://localhost:3000");
});
