import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface MailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

interface TemplatedMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string | undefined;
  private readonly templatesDir: string;
  private readonly templateCache: Map<string, handlebars.TemplateDelegate> =
    new Map();

  constructor() {
    // Prefer source templates directory (works in dev/ts-node and when dist lacks copied templates)
    const srcTemplates = path.join(
      process.cwd(),
      'src',
      'common',
      'mailer',
      'templates',
    );
    const distTemplates = path.join(__dirname, 'templates');
    this.templatesDir = fs.existsSync(srcTemplates)
      ? srcTemplates
      : distTemplates;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM;

    if (host && port && user && pass) {
      // SSL on port 465, STARTTLS on other ports
      const secure = port === 465;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports (like 587, 2525)
        auth: { user, pass },
        // Enable STARTTLS for non-SSL ports
        ...(!secure &&
          port !== 25 &&
          port !== 1025 && {
            requireTLS: true,
            tls: {
              rejectUnauthorized: false, // For development/testing with self-signed certs
            },
          }),
      });

      this.logger.log(
        `Mailer configured with SMTP transport (${host}:${port}, ${secure ? 'SSL' : 'STARTTLS'})`,
      );

      // Test connection on startup
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error(`SMTP connection test failed: ${error.message}`);
          this.logger.warn('Emails will be logged instead of sent');
          this.transporter = null;
        } else {
          this.logger.log('SMTP connection verified successfully');
        }
      });
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

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });

      this.logger.log(
        `Email sent successfully to ${opts.to}: ${opts.subject} (Message ID: ${info.messageId})`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${opts.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send templated email using Handlebars templates
   */
  async sendTemplatedMail(opts: TemplatedMailOptions) {
    if (!this.transporter || !this.from) {
      this.logger.log(
        `Mock send templated mail to ${opts.to}: ${opts.subject} (template: ${opts.template}, no SMTP configured)`,
      );
      return true;
    }

    try {
      // Add common context variables
      const context = {
        ...opts.context,
        year: new Date().getFullYear(),
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        recipientEmail: opts.to,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@eventflow.dev',
        helpUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/help`,
      };

      // Render the email content
      const html = await this.renderTemplate(opts.template, context);

      // Send the email
      const info = await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html,
      });

      this.logger.log(
        `Templated email sent successfully to ${opts.to}: ${opts.subject} (Template: ${opts.template}, Message ID: ${info.messageId})`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send templated email to ${opts.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Render a Handlebars template with the given context
   */
  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    // Check cache first
    let template = this.templateCache.get(templateName);

    if (!template) {
      // Load template from file
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      template = handlebars.compile(templateSource);

      // Cache the compiled template
      this.templateCache.set(templateName, template);
    }

    // Render the template body
    const body = template(context);

    // Wrap in layout
    return this.renderLayout(body, context);
  }

  /**
   * Render the layout template with the given body
   */
  private renderLayout(body: string, context: Record<string, any>): string {
    const layoutPath = path.join(this.templatesDir, 'layout.hbs');

    if (!fs.existsSync(layoutPath)) {
      // If no layout exists, return body as-is
      this.logger.warn('Layout template not found, using body without layout');
      return body;
    }

    // Check layout cache
    let layoutTemplate = this.templateCache.get('_layout');

    if (!layoutTemplate) {
      const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
      layoutTemplate = handlebars.compile(layoutSource);
      this.templateCache.set('_layout', layoutTemplate);
    }

    // Render layout with body
    return layoutTemplate({
      ...context,
      body,
    });
  }

  /**
   * Clear template cache (useful for development)
   */
  clearTemplateCache() {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }
}
