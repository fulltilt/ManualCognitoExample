import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import axios from "axios";

let pems: { [key: string]: any } = {};

export class AuthMiddleware {
  private region = process.env.AWS_REGION;
  private userPoolId = process.env.AWS_USER_POOL_ID;

  constructor() {
    this.setup();
  }

  verifyToken(req: Request, res: Response, next) {
    const token = req.header("Auth");
    if (!token) res.status(401).json({ err: "No token received" });

    let decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) res.status(401).json({ err: "Error decoding JWT" });

    let kid = decodedJwt.header.kid;
    let pem = pems[kid];

    if (!pem) {
      res.status(401).json({ err: "Invalid PEM" });
      return;
    }

    jwt.verify(token, pem, function (err: any, payload: any) {
      if (err) {
        return res.status(401).json(err);
      } else {
        console.log("payload", payload);
        next();
      }
    });
  }

  private async setup() {
    const URL = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
    try {
      const data: any = await axios.get(URL);
      if (data.status !== 200) {
        throw new Error("Error getting JSON Web Key");
      }

      const { keys } = data.data;
      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const keyId = key.kid;
        const modulus = key.n;
        const exponent = key.e;
        const keyType = key.kty;
        const jwk = { kty: keyType, n: modulus, e: exponent };
        const pem = jwkToPem(jwk);
        pems[keyId] = pem;
      }
      console.log("got PEMs");
    } catch (err) {
      throw new Error(err);
    }
  }
}
