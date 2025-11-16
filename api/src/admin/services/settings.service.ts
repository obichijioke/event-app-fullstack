import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateSiteSettingsDto } from '../dto/site-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSiteSettings() {
    const settings = await this.prisma.siteSetting.findMany();

    type SiteSettingValue = string | boolean | number | undefined;
    const settingsObject: Record<string, SiteSettingValue> = {};
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value as SiteSettingValue;
    });

    return {
      siteName: settingsObject.siteName || 'EventHub',
      siteTagline: settingsObject.siteTagline || 'Discover amazing events',
      supportEmail: settingsObject.supportEmail || 'support@eventhub.com',
      contactEmail: settingsObject.contactEmail || 'contact@eventhub.com',
      maintenanceMode: settingsObject.maintenanceMode || false,
      maintenanceMessage:
        settingsObject.maintenanceMessage ||
        'We are currently performing maintenance. Please check back soon.',
      allowRegistrations:
        settingsObject.allowRegistrations !== undefined
          ? settingsObject.allowRegistrations
          : true,
      requireEmailVerification:
        settingsObject.requireEmailVerification !== undefined
          ? settingsObject.requireEmailVerification
          : true,
      defaultCurrency: settingsObject.defaultCurrency || 'NGN',
      defaultTimezone: settingsObject.defaultTimezone || 'Africa/Lagos',
      platformFeePercent: settingsObject.platformFeePercent || 2.5,
      processingFeePercent: settingsObject.processingFeePercent || 1.5,
      enableStripe:
        settingsObject.enableStripe !== undefined
          ? settingsObject.enableStripe
          : true,
      enablePaystack:
        settingsObject.enablePaystack !== undefined
          ? settingsObject.enablePaystack
          : true,
      maxUploadSizeMB: settingsObject.maxUploadSizeMB || 10,
      eventsRequireApproval: settingsObject.eventsRequireApproval || false,
      enableAnalytics:
        settingsObject.enableAnalytics !== undefined
          ? settingsObject.enableAnalytics
          : true,
      termsUrl: settingsObject.termsUrl || '',
      privacyUrl: settingsObject.privacyUrl || '',
      facebookUrl: settingsObject.facebookUrl || '',
      twitterUrl: settingsObject.twitterUrl || '',
      instagramUrl: settingsObject.instagramUrl || '',
      linkedinUrl: settingsObject.linkedinUrl || '',
    };
  }

  async updateSiteSettings(settings: UpdateSiteSettingsDto) {
    const entries = Object.entries(settings as Record<string, unknown>);
    const updatePromises = entries.map(([key, value]) =>
      this.prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    );

    await Promise.all(updatePromises);

    return this.getSiteSettings();
  }
}
