import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Gửi email đặt lại mật khẩu. FREE 100%: dùng Gmail + App Password,
 * hoặc Resend free (100 mail/ngày), hoặc Ethereal khi dev.
 * Không ghi email hoặc token đặt lại mật khẩu vào log.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    }
  }

  get configured() {
    return this.transporter !== null;
  }

  async sendPasswordReset(email: string, link: string) {
    const subject = 'Soma 3D — Đặt lại mật khẩu';
    const text =
      `Bạn vừa yêu cầu đặt lại mật khẩu Soma 3D.\n\n` +
      `Mở link sau trong 15 phút:\n${link}\n\n` +
      `Nếu không phải bạn, hãy bỏ qua email này.`;
    const html =
      `<p>Bạn vừa yêu cầu đặt lại mật khẩu <b>Soma 3D</b>.</p>` +
      `<p><a href="${link}">Bấm vào đây để đặt mật khẩu mới</a> (hết hạn sau 15 phút).</p>` +
      `<p>Nếu không phải bạn, hãy bỏ qua email này.</p>`;

    if (!this.transporter) {
      this.logger.warn(
        'SMTP chưa cấu hình — không gửi được email đặt lại mật khẩu',
      );
      return { sent: false as const };
    }
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: email,
        subject,
        text,
        html,
      });
      return { sent: true as const };
    } catch {
      this.logger.error('Gửi email đặt lại mật khẩu thất bại');
      return { sent: false as const };
    }
  }
}
