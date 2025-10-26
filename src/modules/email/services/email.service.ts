import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { SendEmailDto } from '../dto/req/send-email.dto'
import { EmailConfig } from '../interfaces/email.interface'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { isArray } from 'class-validator'
import { I18nService } from 'nestjs-i18n'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly emailConfig: EmailConfig
  constructor(
    private configService: ShionConfigService,
    private httpService: HttpService,
    private i18nService: I18nService,
  ) {
    this.emailConfig = {
      provider: this.configService.get('email.emailProvider') as 'elastic' | 'postal',
      apiKey: this.configService.get('email.emailApiKey'),
      endPoint: this.configService.get('email.emailEndPoint'),
      senderAddress: this.configService.get('email.emailSenderAddress'),
      senderName: this.configService.get('email.emailSenderName'),
    }
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<boolean> {
    const { subject, to, bodyHtml, from } = sendEmailDto

    if (this.emailConfig.provider === 'elastic') {
      const emailData = {
        apikey: this.emailConfig.apiKey,
        subject,
        from: from || this.emailConfig.senderAddress,
        fromName: this.emailConfig.senderName,
        senderName: this.emailConfig.senderName,
        to,
        bodyHtml,
        isTransactional: true,
      }

      try {
        await firstValueFrom(
          this.httpService.post(this.emailConfig.endPoint, null, {
            family: 4,
            params: emailData,
          }),
        )

        this.logger.log(`Email sent successfully to ${to}`)
        return true
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}:`, error)
        throw new Error('Failed to send email')
      }
    } else if (this.emailConfig.provider === 'postal') {
      const emailData = {
        subject,
        from: `"${this.emailConfig.senderName}" <${from || this.emailConfig.senderAddress}>`,
        to: isArray(to) ? to : [to],
        html_body: bodyHtml,
      }

      try {
        const res = await firstValueFrom(
          this.httpService.post(this.emailConfig.endPoint, emailData, {
            family: 4,
            headers: {
              'X-Server-API-Key': this.emailConfig.apiKey,
            },
          }),
        )

        if (res.data.status !== 'success') {
          this.logger.error(`Failed to send email to ${to}:`, res.data)
          throw new Error(`Failed to send email to ${to}: ${res.data}`)
        }

        this.logger.log(`Email sent successfully to ${to}`)
        return true
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}:`, error)
        throw new Error('Failed to send email')
      }
    }
    return false
  }

  async sendVerificationCode(email: string, code: string, expSeconds?: number): Promise<boolean> {
    const emailData: SendEmailDto = {
      subject: this.i18nService.t('message.EMAIL_VERIFICATION_CODE_SUBJECT'),
      to: email,
      bodyHtml: this.generateVerificationCodeTemplate(code, expSeconds),
    }

    return this.sendEmail(emailData)
  }

  private generateVerificationCodeTemplate(code: string, expSeconds?: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${this.i18nService.t('message.EMAIL_VERIFICATION_CODE_SUBJECT')}</h2>
        <p>${this.i18nService.t('message.EMAIL_VERIFICATION_CODE_PREFIX')}</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #34a2d5;">${code}</span>
        </div>
        <p style="color: #666;">${this.i18nService.t('message.EMAIL_VERIFICATION_CODE_SUFFIX', { args: { exp: expSeconds ? expSeconds / 60 : 10 } })}</p>
        <p style="color: #999; font-size: 12px;">${this.i18nService.t('message.EMAIL_VERIFICATION_CODE_IGNORE')}</p>
      </div>
    `
  }
}
