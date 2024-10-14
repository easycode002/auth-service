import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  SignUpCommand,
  SignUpCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import configs from "../config";
import crypto from "crypto";
import axios from "axios";
import qs from "qs";

const client = new CognitoIdentityProviderClient({
  region: configs.awsCognitoRegion,
  credentials: {
    accessKeyId: configs.awsAccessKeyId,
    secretAccessKey: configs.awsSecretAccessKey,
  },
});

export interface SignupRequest {
  email?: string;
  phone_number?: string;
  password?: string;
}

export interface VerifyUserRequest {
  email?: string;
  phone_number?: string;
  code: string;
}
export interface CognitoToken {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  username?: string;
  userId?: string;
}
export interface LoginRequest {
  email?: string;
  phone_number?: string;
  password?: string;
}

export class AuthService {
  private generateSecretHash(username: string): string {
    const secret = configs.awsCognitoClientSecret;
    return crypto
      .createHmac("SHA256", secret)
      .update(username + configs.awsCognitoClientId)
      .digest("base64");
  }

  async signup(body: SignupRequest): Promise<string> {
    const username = (body.email || body.phone_number) as string;
    const params: SignUpCommandInput = {
      ClientId: configs.awsCognitoClientId,
      Username: username,
      Password: body.password,
      SecretHash: this.generateSecretHash(username),
    };

    try {
      const command = new SignUpCommand(params);
      const result = await client.send(command);

      return `User created successfully. Please check your ${result.CodeDeliveryDetails?.DeliveryMedium?.toLowerCase()} for a verification code.`;
    } catch (error) {
      console.error(`AuthService signup() method error: `, error);
      throw new Error(`Error signing up user: ${error}`);
    }
  }

  async verifyUser(body: VerifyUserRequest): Promise<void> {
    const username = body.email as string;

    const params = {
      ClientId: configs.awsCognitoClientId,
      Username: username,
      ConfirmationCode: body.code,
      SecretHash: this.generateSecretHash(username),
    };

    try {
      const command = new ConfirmSignUpCommand(params);
      await client.send(command);
      console.log(
        "AuthService verifyUser() method: User verified successfully"
      );
    } catch (error) {
      console.error("AuthService verifyUser() method error:", error);
      throw new Error(`Error verifying user: ${error}`);
    }
  }

  async login(body: LoginRequest): Promise<CognitoToken> {
    const username = (body.email || body.phone_number) as string;

    // Log to check username and password values
    console.log("AuthService login() request body:", body);

    const params: InitiateAuthCommandInput = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: configs.awsCognitoClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: body.password!,
        SECRET_HASH: this.generateSecretHash(username),
      },
    };

    try {
      const command = new InitiateAuthCommand(params);
      const result = await client.send(command);
      return {
        accessToken: result.AuthenticationResult?.AccessToken!,
        idToken: result.AuthenticationResult?.IdToken!,
        refreshToken: result.AuthenticationResult?.RefreshToken!,
      };
    } catch (error) {
      console.error("AuthService login() method error:", error);
      throw new Error(`Error verifying user: ${error}`);
    }
  }

  // ===================
  public getLoginUrl(): string {
    return `${configs.awsCognitoDomain}/oauth2/authorize?client_id=${configs.awsCognitoClientId}&response_type=code&scope=email+openid+profile&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi-docs`;
  }
  public async handleCallback(code: string, _state: string): Promise<any> {
    try {
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        `${configs.awsCognitoDomain}/oauth2/token`,
        qs.stringify({
          grant_type: "authorization_code",
          client_id: configs.awsCognitoClientId,
          client_secret: configs.awsCognitoClientSecret,
          code: code,
          redirect_uri: configs.awsRedirectUri,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const { id_token, access_token } = tokenResponse.data;

      // Use the access token to get user information from Google
      const userInfoResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      console.log(userInfoResponse);
      // Log user information
      console.log("User Info:", userInfoResponse.data);

      // Return the tokens and user info
      return {
        message: "Login successful",
        tokens: { id_token, access_token },
        user: userInfoResponse.data,
      };
    } catch (error) {
      console.error(
        "Error during token exchange or user info retrieval:",
        error
      );
      throw new Error("Authentication failed");
    }
  }
}
export default new AuthService();
