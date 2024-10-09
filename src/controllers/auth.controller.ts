import { Body, Controller, Post, Route, Request } from "tsoa";
import AuthService, { SignupRequest } from "../services/auth.service";
import setCookie from "../utils/cokie";
import { Response as ExpressResponse } from "express"; // Import Express types
export default function sendResponse<T>({
  message,
  data,
}: {
  message: string;
  data?: T;
}) {
  return {
    message,
    data,
  };
}
export interface VerifyUserRequest {
  email?: string;
  phone_number?: string;
  code: string;
}

export interface LoginRequest {
  email?: string;
  phone_number?: string;
  password?: string;
}
@Route("v1/auth")
export class ProductController extends Controller {
  @Post("/signup")
  public async signup(
    @Body() body: SignupRequest
  ): Promise<{ message: string }> {
    try {
      const result = await AuthService.signup(body);

      return sendResponse({ message: result });
    } catch (error) {
      throw error;
    }
  }

  @Post("/verify")
  public async verifyUser(@Body() body: VerifyUserRequest) {
    console.log("Inside verifyUser method");
    try {
      await AuthService.verifyUser(body);
      return sendResponse({ message: `You've verified successfully` });
    } catch (error) {
      console.error("Error in verifyUser method:", error);
      throw error;
    }
  }

  @Post("/login")
  public async login(
    @Request() request: Express.Request,
    @Body() body: LoginRequest
  ) {
    try {
      const response = (request as any).res as ExpressResponse;
      const result = await AuthService.login(body);

      setCookie(response, "id_token", result.idToken);
      setCookie(response, "access_token", result.accessToken);
      setCookie(response, "refresh_token", result.refreshToken, {
        maxAge: 30 * 24 * 3600 * 1000,
      });
      setCookie(response, "username", result.username!, {
        maxAge: 30 * 24 * 3600 * 1000,
      });
      setCookie(response, "user_id", result.userId!, {
        maxAge: 30 * 24 * 3600 * 1000,
      });

      return sendResponse({ message: "Login successfully" });
    } catch (error) {
      throw error;
    }
  }
}
