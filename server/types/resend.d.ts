declare module "resend" {
  interface SendEmailPayload {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
  }

  interface SendEmailResponse {
    id?: string;
  }

  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(payload: SendEmailPayload): Promise<SendEmailResponse>;
    };
  }
}
