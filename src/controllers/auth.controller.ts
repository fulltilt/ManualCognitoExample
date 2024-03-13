import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { CognitoService } from "../services/cognitoService";

export class AuthController {
  public path = "/auth";
  public router = express.Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/signup", this.validateBody("signUp"), this.signUp);
    this.router.post("/signin", this.validateBody("signIn"), this.signIn);
    this.router.post("/verify", this.validateBody("verify"), this.verify);
    this.router.post(
      "/resend",
      this.validateBody("resend"),
      this.resendConfirmationCode
    );
  }

  async signUp(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }
    console.log("signup body is valid");

    const { username, password, email, name, family_name, birthdate } =
      req.body;

    // for whatever reason, the '.' is getting stripped out of the email
    let userAttr = [];
    userAttr.push({ Name: "email", Value: username });
    userAttr.push({ Name: "name", Value: name });
    userAttr.push({ Name: "family_name", Value: family_name });
    userAttr.push({ Name: "birthdate", Value: birthdate });

    const cognito = new CognitoService();
    try {
      const data = await cognito.signUpUser(username, password, userAttr);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  async signIn(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }

    console.log("signin body is valid");

    const { username, password } = req.body;
    const cognito = new CognitoService();
    try {
      const data = await cognito.signInUser(username, password);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  async verify(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }

    console.log("verify body is valid");

    const { username, code } = req.body;

    const cognito = new CognitoService();
    try {
      const data = await cognito.verifyUser(username, code);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async resendConfirmationCode(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }

    console.log("resend body is valid");

    const { email } = req.body;

    const cognito = new CognitoService();
    try {
      const data = await cognito.resendConfirmationCode(email);
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  private validateBody(type: string) {
    switch (type) {
      case "signUp":
        return [
          body("username").notEmpty().isLength({ min: 6 }),
          // body("email").notEmpty().normalizeEmail().isEmail(),
          body("password").isString().isLength({ min: 8 }),
          body("birthdate").exists().isISO8601(),
          body("name").notEmpty().isString(),
          body("family_name").notEmpty().isString(),
        ];

      case "signIn":
        return [
          body("username").notEmpty().isLength({ min: 6 }),
          body("password").isString().isLength({ min: 8 }),
        ];

      case "verify":
        return [
          body("username").notEmpty().isLength({ min: 6 }),
          body("code").isString().isLength({ min: 6, max: 6 }),
        ];
      case "verify":
        return [body("email").notEmpty().normalizeEmail().isEmail()];
      default:
        return [];
    }
  }
}
