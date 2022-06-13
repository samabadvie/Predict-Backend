import { Injectable } from '@nestjs/common';
import { configService } from 'core/config.service';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class EmailService {
  sendMail(
    send: { to: string; subject: string; from?: string },
    data: Record<'title' | 'body', string>,
    template = 'default1',
  ): Promise<{ id: string; message: string }> {
    const { from, apiKey, domain } = configService.getMailerConfig();

    const form = new FormData();
    form.append('from', send.from ?? from);
    form.append('to', send.to);
    form.append('subject', send.subject);
    form.append('text', data.body);
    form.append('template', template);
    form.append('h:X-Mailgun-Variables', JSON.stringify(data));

    return axios({
      method: 'POST',
      url: `https://api.eu.mailgun.net/v3/${domain}/messages`,
      auth: {
        username: 'api',
        password: apiKey,
      },
      data: form.getBuffer(),
      headers: form.getHeaders(),
    }).then((res) => res.data) as Promise<{ id: string; message: string }>;
  }
}
