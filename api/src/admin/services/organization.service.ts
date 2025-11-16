import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OrganizationQueryDto } from '../dto/query-params.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import {
  OrganizationVerificationQueryDto,
  SubmitForVerificationDto,
  UploadDocumentDto,
  ReviewDocumentDto,
  ApproveOrganizationDto,
  RejectOrganizationDto,
  SuspendOrganizationDto,
  AppealReviewDto,
} from '../dto/verification.dto';
import { Prisma, OrganizationStatus } from '@prisma/client';
import { StorageService } from '../../common/storage.service';

@Injectable()
export class AdminOrganizationService {
  private readonly logger = new Logger(AdminOrganizationService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getOrganizations(query: OrganizationQueryDto) {
    const { page = 1, limit = 10, search, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    this.logger.debug(`Filtering organizations by status: ${status}`);
    if (status) {
      // Backwards compatibility for old 'active' status
      let normalizedStatus: OrganizationStatus;
      const statusString = String(status);
      if (statusString === 'active') {
        normalizedStatus = OrganizationStatus.approved;
      } else {
        normalizedStatus = status as OrganizationStatus;
      }

      // Validate the normalized status
      const validStatuses = Object.values(OrganizationStatus);
      if (!validStatuses.includes(normalizedStatus)) {
        throw new BadRequestException(
          `Invalid organization status filter: ${status}`,
        );
      }

      where.status = normalizedStatus;
    }

    const orderBy: Prisma.OrganizationOrderByWithRelationInput = {};
    if (sortBy) {
      const allowedSortFields = [
        'id',
        'name',
        'legalName',
        'website',
        'country',
        'supportEmail',
        'taxId',
        'status',
        'createdAt',
        'updatedAt',
      ] as const;
      if (!allowedSortFields.includes(sortBy as any)) {
        throw new BadRequestException(`Invalid sort field: ${sortBy}`);
      }
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          legalName: true,
          website: true,
          country: true,
          supportEmail: true,
          taxId: true,
          status: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
              events: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    const data = organizations.map((org) => ({
      ...org,
      memberCount: org._count.members,
      eventCount: org._count.events,
      _count: undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganization(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        legalName: true,
        website: true,
        country: true,
        supportEmail: true,
        taxId: true,
        status: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            events: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      ...organization,
      memberCount: organization._count.members,
      eventCount: organization._count.events,
    };
  }

  async updateOrganization(orgId: string, data: UpdateOrganizationDto) {
    const existingOrg = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, status: true },
    });

    if (!existingOrg) {
      throw new NotFoundException('Organization not found');
    }

    if (existingOrg.status === 'suspended') {
      throw new BadRequestException(
        'Cannot update organization: organization is suspended',
      );
    }

    const organization = await this.prisma.organization.update({
      where: { id: orgId },
      data,
    });

    return organization;
  }

  // Organization Verification Methods
  async getOrganizationsForVerification(
    query: OrganizationVerificationQueryDto,
  ) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      // Backwards compatibility for old 'active' status
      let normalizedStatus: OrganizationStatus;
      const rawStatus = status as unknown as string;
      if (rawStatus === 'active') {
        normalizedStatus = OrganizationStatus.approved;
      } else {
        normalizedStatus = status;
      }

      // Validate the normalized status
      const validStatuses = Object.values(OrganizationStatus);
      if (!validStatuses.includes(normalizedStatus)) {
        throw new BadRequestException(
          `Invalid organization verification status filter: ${status}`,
        );
      }

      where.status = normalizedStatus;
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              verificationDocuments: true,
              appeals: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      data: organizations.map((org) => ({
        ...org,
        documentCount: org._count.verificationDocuments,
        appealCount: org._count.appeals,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationForVerification(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        verificationDocuments: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        appeals: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
        _count: {
          select: {
            events: true,
            members: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      ...organization,
      eventCount: organization._count.events,
      memberCount: organization._count.members,
      _count: undefined,
    };
  }

  async submitOrganizationForVerification(
    orgId: string,
    dto: SubmitForVerificationDto,
    userId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, status: true, ownerId: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new BadRequestException(
        'Only organization owner can submit for verification',
      );
    }

    if (!['pending', 'rejected'].includes(organization.status)) {
      throw new BadRequestException(
        `Cannot submit organization with status: ${organization.status}`,
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: 'submitted',
        verificationNotes: dto.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'submit_for_verification',
        targetKind: 'Organization',
        targetId: orgId,
        meta: { notes: dto.notes },
      },
    });

    return {
      message: 'Organization submitted for verification',
      organization: updated,
    };
  }

  async uploadVerificationDocument(
    orgId: string,
    dto: UploadDocumentDto,
    file: any,
    userId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, ownerId: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new BadRequestException(
        'Only organization owner can upload documents',
      );
    }

    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      `verification/${orgId}/${Date.now()}-${file.originalname}`,
      file.mimetype,
    );

    const document = await this.prisma.verificationDocument.create({
      data: {
        orgId,
        type: dto.type,
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey: uploadResult.key,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'upload_verification_document',
        targetKind: 'Organization',
        targetId: orgId,
        meta: {
          documentId: document.id,
          documentType: dto.type,
          filename: file.originalname,
        },
      },
    });

    return {
      message: 'Document uploaded successfully',
      document: {
        ...document,
        url: uploadResult.url,
      },
    };
  }

  async reviewVerificationDocument(
    documentId: string,
    dto: ReviewDocumentDto,
    reviewerId: string,
  ) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
      include: { org: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'review_verification_document',
        targetKind: 'Organization',
        targetId: document.orgId,
        meta: {
          documentId,
          status: dto.status,
          rejectionReason: dto.rejectionReason,
        },
      },
    });

    return { message: 'Document reviewed successfully', document: updated };
  }

  async approveOrganization(
    orgId: string,
    dto: ApproveOrganizationDto,
    reviewerId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, status: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status !== 'under_review') {
      throw new BadRequestException(
        `Cannot approve organization with status: ${organization.status}`,
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: 'approved',
        verifiedAt: new Date(),
        verificationNotes: dto.notes,
        trustScore: dto.trustScore ? parseFloat(dto.trustScore) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'approve_organization',
        targetKind: 'Organization',
        targetId: orgId,
        meta: {
          notes: dto.notes,
          trustScore: dto.trustScore,
        },
      },
    });

    return {
      message: 'Organization approved successfully',
      organization: updated,
    };
  }

  async rejectOrganization(
    orgId: string,
    dto: RejectOrganizationDto,
    reviewerId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, status: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (!['submitted', 'under_review'].includes(organization.status)) {
      throw new BadRequestException(
        `Cannot reject organization with status: ${organization.status}`,
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: 'rejected',
        verificationNotes: dto.details,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'reject_organization',
        targetKind: 'Organization',
        targetId: orgId,
        meta: {
          reason: dto.reason,
          details: dto.details,
        },
      },
    });

    return { message: 'Organization rejected', organization: updated };
  }

  async suspendOrganization(
    orgId: string,
    dto: SuspendOrganizationDto,
    reviewerId: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, status: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.status === 'banned') {
      throw new BadRequestException('Cannot suspend banned organization');
    }

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        status: 'suspended',
        verificationNotes: dto.details,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'suspend_organization',
        targetKind: 'Organization',
        targetId: orgId,
        meta: {
          reason: dto.reason,
          details: dto.details,
        },
      },
    });

    return { message: 'Organization suspended', organization: updated };
  }

  async reviewOrganizationAppeal(
    appealId: string,
    dto: AppealReviewDto,
    reviewerId: string,
  ) {
    const appeal = await this.prisma.organizationAppeal.findUnique({
      where: { id: appealId },
      include: { org: true },
    });

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    if (appeal.status !== 'pending') {
      throw new BadRequestException(`Appeal is already ${appeal.status}`);
    }

    const updatedAppeal = await this.prisma.organizationAppeal.update({
      where: { id: appealId },
      data: {
        status: dto.decision === 'approved' ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: dto.reviewNotes,
      },
    });

    if (dto.decision === 'approved') {
      await this.prisma.organization.update({
        where: { id: appeal.orgId },
        data: { status: 'submitted' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'review_organization_appeal',
        targetKind: 'Organization',
        targetId: appeal.orgId,
        meta: {
          appealId,
          decision: dto.decision,
          reviewNotes: dto.reviewNotes,
        },
      },
    });

    return { message: 'Appeal reviewed successfully', appeal: updatedAppeal };
  }
}
