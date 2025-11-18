import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string | undefined;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // common SSL port
        auth: { user, pass },
      });
      this.logger.log('Mailer configured with SMTP transport');
    } else {
      this.logger.warn(
        'SMTP not fully configured; emails will be logged instead of sent',
      );
    }
  }

  async sendMail(opts: MailOptions) {
    if (!this.transporter || !this.from) {
      this.logger.log(
        `Mock send mail to ${opts.to}: ${opts.subject} (no SMTP configured)`,
      );
      return true;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });

    return true;
  }
}
