import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.in',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInviteEmail = async (to: string, tripName: string, inviteLink: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email credentials not found. Skipping email sending.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `Invitation to join trip: ${tripName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p>You have been invited to join the trip <strong>${tripName}</strong> on Trip Calculator.</p>
          <p>Click the button below to join:</p>
          <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Join Trip</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${inviteLink}</p>
        </div>
      `,
    });
    logger.info(`Invite email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending invite email:', error);
    // Don't throw error to prevent blocking the API response
  }
};

export const sendActivationEmail = async (to: string, name: string, activationLink: string, otp: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email credentials not found. Skipping email sending.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Activate Your Trip Calculator Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Welcome to Trip Calculator, ${name}!</h2>
          <p>Thank you for registering. Please activate your account to get started.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Your Activation Code:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 5px; text-align: center; border: 2px dashed #16a34a;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px; margin-bottom: 0;">This code expires in 10 minutes</p>
          </div>

          <p style="margin: 20px 0;">Or click the button below to activate your account:</p>
          <a href="${activationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold;">Activate Account</a>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
    logger.info(`Activation email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending activation email:', error);
    // Don't throw error to prevent blocking the API response
  }
};

