import AWS from "aws-sdk";
import crypto from "crypto";

export class CognitoService {
  private config = {
    region: process.env.AWS_REGION,
  };
  private secretHash = "";
  private clientId = process.env.AWS_CLIENT_ID;
  private cognitoIdentity;

  constructor() {
    this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config);
  }

  public async signUpUser(username, password, userAttr) {
    const params = {
      ClientId: this.clientId,
      Password: password,
      Username: username,
      //   SecretHash: this.generateHash(username),
      UserAttributes: userAttr,
    };

    try {
      const data = await this.cognitoIdentity.signUp(params).promise();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  public async signInUser(username, password) {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    try {
      const data = await this.cognitoIdentity.initiateAuth(params).promise();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  public async verifyUser(username, code) {
    const params = {
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: code,
    };

    try {
      const data = await this.cognitoIdentity.confirmSignUp(params).promise();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  public async resendConfirmationCode(username) {
    const params = {
      ClientId: this.clientId,
      Username: username,
    };

    try {
      const data = await this.cognitoIdentity
        .resendConfirmationCode(params)
        .promise();
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  private generateHash(username) {
    return (
      crypto
        //   .createHash("SHA256", this.secretHash)
        .createHash("SHA256")
        .update(username + this.clientId)
        .digest("base64")
    );
  }
}
