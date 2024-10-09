import path from "path";
import dotenv from "dotenv";
import Joi from "joi";

type Config = {
  env: string;
  port: number;
  awsCognitoRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsCognitoUserPoolId: string;
  awsCognitoClientId: string;
  awsCognitoClientSecret: string;
};

// Function to load and validate environment variable
function loadConfig(): Config {
  const env = process.env.NODE_ENV || "development";
  const envPath = path.resolve(__dirname, `./configs/.env.${env}`);
  dotenv.config({ path: envPath });

  // Define a schema for environment variable
  const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required(),
    AWS_REGION: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().required(),
    AWS_SECRET_ACCESS_KEY: Joi.string().required(),
    COGNITO_USER_POOL_ID: Joi.string().required(),
    COGNITO_CLIENT_ID: Joi.string().required(),
    COGNITO_CLIENT_SECRET: Joi.string().required(),
  })
    .unknown()
    .required();

  // Validate the environment variables
  const { value: envVars, error } = envVarsSchema.validate(process.env);
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    awsCognitoRegion: envVars.AWS_REGION,
    awsAccessKeyId: envVars.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    awsCognitoUserPoolId: envVars.COGNITO_USER_POOL_ID,
    awsCognitoClientId: envVars.COGNITO_CLIENT_ID,
    awsCognitoClientSecret: envVars.COGNITO_CLIENT_SECRET,
  };
}

// Export the loaded configuration
const configs = loadConfig();
export default configs;
