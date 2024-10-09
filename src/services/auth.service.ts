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
    const username = (body.email ||
      body.phone_number?.replace(/^\+/, "")) as string;

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
}
export default new AuthService();