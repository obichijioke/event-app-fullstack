import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSiteSettingsDto } from '../dto/site-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.getSiteSettings();
  }

  async update(settings: UpdateSiteSettingsDto) {
    return this.updateSiteSettings(settings);
  }

  async getSiteSettings() {
    const settings = await this.prisma.siteSetting.findMany();

    const settingsObject: Record<string, Prisma.JsonValue | undefined> = {};
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value as
        | Prisma.JsonValue
        | undefined;
    });

    const parseBoolean = (
      value: Prisma.JsonValue | undefined,
      fallback: boolean,
    ) => {
      if (value === undefined || value === null) return fallback;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return fallback;
    };

    const parseNumber = (
      value: Prisma.JsonValue | undefined,
      fallback: number,
    ) => {
      if (value === undefined || value === null) return fallback;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
      }
      return fallback;
    };

    const parseString = (
      value: Prisma.JsonValue | undefined,
      fallback = '',
    ) => {
      if (value === undefined || value === null) return fallback;
      if (typeof value === 'string') return value;
      return String(value);
    };

    return {
      siteName: parseString(settingsObject.siteName, 'EventHub'),
      siteTagline: parseString(
        settingsObject.siteTagline,
        'Discover amazing events',
      ),
      supportEmail: parseString(
        settingsObject.supportEmail,
        'support@eventhub.com',
      ),
      contactEmail: parseString(
        settingsObject.contactEmail,
        'contact@eventhub.com',
      ),
      maintenanceMode: parseBoolean(settingsObject.maintenanceMode, false),
      maintenanceMessage: parseString(
        settingsObject.maintenanceMessage,
        'We are currently performing maintenance. Please check back soon.',
      ),
      allowRegistrations: parseBoolean(settingsObject.allowRegistrations, true),
      requireEmailVerification: parseBoolean(
        settingsObject.requireEmailVerification,
        true,
      ),
      defaultCurrency: parseString(settingsObject.defaultCurrency, 'NGN'),
      defaultTimezone: parseString(
        settingsObject.defaultTimezone,
        'Africa/Lagos',
      ),
      platformFeePercent: parseNumber(settingsObject.platformFeePercent, 2.5),
      processingFeePercent: parseNumber(
        settingsObject.processingFeePercent,
        1.5,
      ),
      enableStripe: parseBoolean(settingsObject.enableStripe, true),
      enablePaystack: parseBoolean(settingsObject.enablePaystack, true),
      maxUploadSizeMB: parseNumber(settingsObject.maxUploadSizeMB, 10),
      eventsRequireApproval: parseBoolean(
        settingsObject.eventsRequireApproval,
        false,
      ),
      enableAnalytics: parseBoolean(settingsObject.enableAnalytics, true),
      termsUrl: parseString(settingsObject.termsUrl, ''),
      privacyUrl: parseString(settingsObject.privacyUrl, ''),
      facebookUrl: parseString(settingsObject.facebookUrl, ''),
      twitterUrl: parseString(settingsObject.twitterUrl, ''),
      instagramUrl: parseString(settingsObject.instagramUrl, ''),
      linkedinUrl: parseString(settingsObject.linkedinUrl, ''),
    };
  }

  async updateSiteSettings(settings: UpdateSiteSettingsDto) {
    const entries = Object.entries(settings as Record<string, unknown>);
    const updatePromises = entries.map(([key, value]) => {
      const jsonValue = (value ?? null) as Prisma.InputJsonValue;
      return this.prisma.siteSetting.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      });
    });

    await Promise.all(updatePromises);

    return this.getSiteSettings();
  }
}
