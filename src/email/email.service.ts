import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendWelcome({ to, name }: { to: string; name: string }): Promise<void> {
    console.log('Sending email', to, name);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 5000);
    });
    console.log('Email sent successfully');
  }
}
