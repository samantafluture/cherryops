import type { FastifyInstance } from "fastify";

interface GitHubOAuthCallbackBody {
  code: string;
  code_verifier: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export function createAuthRoutes() {
  return async function authRoutes(app: FastifyInstance): Promise<void> {
    // Exchange GitHub OAuth code for token
    app.post<{ Body: GitHubOAuthCallbackBody }>(
      "/auth/github/callback",
      async (request, reply) => {
        const { code, code_verifier } = request.body;

        if (!code) {
          return reply.status(422).send({ error: "code is required" });
        }

        const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
        if (!clientId) {
          return reply.status(500).send({ error: "GitHub OAuth not configured on server" });
        }

        // Exchange code for access token (PKCE flow — no client secret needed)
        const tokenResponse = await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              client_id: clientId,
              code,
              code_verifier,
            }),
          }
        );

        const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;

        if (tokenData.error) {
          return reply.status(401).send({
            error: tokenData.error,
            error_description: tokenData.error_description,
          });
        }

        // Fetch GitHub user info
        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!userResponse.ok) {
          return reply.status(401).send({ error: "Failed to fetch GitHub user" });
        }

        const user = (await userResponse.json()) as GitHubUser;

        // Issue JWT tokens
        const accessToken = app.jwt.sign(
          { sub: user.login, github_id: user.id },
          { expiresIn: "24h" }
        );
        const refreshToken = app.jwt.sign(
          { sub: user.login, github_id: user.id, type: "refresh" },
          { expiresIn: "30d" }
        );

        return reply.send({
          access_token: accessToken,
          refresh_token: refreshToken,
          github_token: tokenData.access_token,
          user: {
            login: user.login,
            id: user.id,
            avatar_url: user.avatar_url,
          },
          expires_in: 86400,
        });
      }
    );

    // Refresh JWT token
    app.post<{ Body: { refresh_token: string } }>(
      "/auth/refresh",
      async (request, reply) => {
        const { refresh_token } = request.body;

        if (!refresh_token) {
          return reply.status(422).send({ error: "refresh_token is required" });
        }

        try {
          const decoded = app.jwt.verify(refresh_token) as {
            sub: string;
            github_id: number;
            type?: string;
          };

          if (decoded.type !== "refresh") {
            return reply.status(401).send({ error: "Invalid refresh token" });
          }

          const accessToken = app.jwt.sign(
            { sub: decoded.sub, github_id: decoded.github_id },
            { expiresIn: "24h" }
          );
          const newRefreshToken = app.jwt.sign(
            { sub: decoded.sub, github_id: decoded.github_id, type: "refresh" },
            { expiresIn: "30d" }
          );

          return reply.send({
            access_token: accessToken,
            refresh_token: newRefreshToken,
            expires_in: 86400,
          });
        } catch {
          return reply.status(401).send({ error: "Invalid or expired refresh token" });
        }
      }
    );
  };
}
