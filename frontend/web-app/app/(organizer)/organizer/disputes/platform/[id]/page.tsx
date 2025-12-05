'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  organizerDisputesApi,
  type OrganizerDispute,
  type RespondToPlatformDisputeDto,
  type ProposeResolutionDto,
} from '@/services/organizer-disputes-api.service';
import { DISPUTE_CATEGORIES } from '@/services/buyer-disputes-api.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Upload,
  User,
  Send,
  Download,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open - Awaiting Your Response',
  organizer_responded: 'You Responded',
  escalated: 'Escalated to Moderator',
  moderator_review: 'Under Moderator Review',
  resolved: 'Resolved',
  appealed: 'Appealed by Buyer',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800 border-amber-300',
  organizer_responded: 'bg-blue-100 text-blue-800 border-blue-300',
  escalated: 'bg-orange-100 text-orange-800 border-orange-300',
  moderator_review: 'bg-purple-100 text-purple-800 border-purple-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  appealed: 'bg-red-100 text-red-800 border-red-300',
  closed: 'bg-gray-100 text-gray-800 border-gray-300',
};

const RESOLUTION_OPTIONS: Record<string, string> = {
  full_refund: 'Full Refund',
  partial_refund: 'Partial Refund',
  no_refund: 'No Refund',
  credit_issued: 'Credit Issued',
  ticket_replacement: 'Ticket Replacement',
  custom: 'Custom Resolution',
};

export default function PlatformDisputeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const orgId = searchParams.get('orgId') || '';

  const [dispute, setDispute] = useState<OrganizerDispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseNote, setResponseNote] = useState('');
  const [proposedResolution, setProposedResolution] = useState('');
  const [proposedRefundCents, setProposedRefundCents] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const loadDispute = async () => {
    if (!orgId) {
      toast.error('Organization ID is required');
      router.push('/organizer/disputes');
      return;
    }

    setLoading(true);
    try {
      const data = await organizerDisputesApi.getPlatformDispute(orgId, disputeId);
      setDispute(data);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        toast.error('Dispute not found or access denied');
        router.push(`/organizer/disputes?orgId=${orgId}&type=platform`);
      } else {
        toast.error('Failed to load dispute');
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispute();
  }, [disputeId, orgId]);

  const handleSubmitResponse = async () => {
    if (!responseNote.trim() || responseNote.length < 50) {
      toast.error('Response must be at least 50 characters');
      return;
    }

    setSubmittingResponse(true);
    try {
      const data: RespondToPlatformDisputeDto = {
        responseNote,
        proposedResolution: proposedResolution || undefined,
        proposedRefundCents: proposedRefundCents ? parseInt(proposedRefundCents) * 100 : undefined,
      };

      await organizerDisputesApi.respondToPlatformDispute(orgId, disputeId, data);
      toast.success('Response submitted successfully');
      setShowResponseForm(false);
      setResponseNote('');
      setProposedResolution('');
      setProposedRefundCents('');
      await loadDispute();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
      console.error(error);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadingEvidence(true);
    try {
      await organizerDisputesApi.uploadEvidence(orgId, disputeId, file);
      toast.success('Evidence uploaded successfully');
      await loadDispute();
    } catch (error) {
      toast.error('Failed to upload evidence');
      console.error(error);
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    return `${currency} ${(Number(cents) / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUrgent = () => {
    if (!dispute || !dispute.respondByAt || dispute.status !== 'open') return false;
    const deadline = new Date(dispute.respondByAt);
    const now = new Date();
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 48 && hoursLeft > 0;
  };

  const canRespond = dispute && dispute.status === 'open';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dispute...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return null;
  }

  const statusColor = STATUS_COLORS[dispute.status] || STATUS_COLORS.open;
  const urgent = isUrgent();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/organizer/disputes?orgId=${orgId}&type=platform`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Platform Disputes
          </Button>
        </Link>
      </div>

      {urgent && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-red-900 font-bold">URGENT: Response Required</p>
              <p className="text-red-800 text-sm">
                You must respond within 48 hours to avoid automatic escalation to a moderator.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Platform Dispute Details</h1>
            <p className="text-gray-600">Case ID: {dispute.id}</p>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${statusColor}`}>
            {STATUS_LABELS[dispute.status] || dispute.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Event</p>
                <p className="font-medium">{dispute.order.event.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order ID</p>
                <p className="font-medium font-mono text-sm">{dispute.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-medium">
                  {formatAmount(dispute.order.totalCents, dispute.order.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-medium">
                  {dispute.category && DISPUTE_CATEGORIES[dispute.category as keyof typeof DISPUTE_CATEGORIES]}
                </p>
              </div>
              {dispute.subcategory && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subcategory</p>
                  <p className="font-medium">{dispute.subcategory}</p>
                </div>
              )}
              {dispute.initiator && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Buyer</p>
                  <p className="font-medium">{dispute.initiator.name}</p>
                  <p className="text-sm text-gray-500">{dispute.initiator.email}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Buyer's complaint */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Buyer's Complaint</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
          </Card>

          {/* Response form */}
          {canRespond && !showResponseForm && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">Action Required</h3>
              <p className="text-blue-800 mb-4">
                You need to respond to this dispute. Provide your explanation and any counter-evidence.
              </p>
              <Button onClick={() => setShowResponseForm(true)}>
                Submit Response
              </Button>
            </Card>
          )}

          {showResponseForm && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Submit Your Response</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="response-note">
                    Your Response * (minimum 50 characters)
                  </Label>
                  <Textarea
                    id="response-note"
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    placeholder="Explain your side of the story. Include relevant details like order confirmation, delivery proof, or any communication with the buyer..."
                    rows={8}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {responseNote.length < 50 ? (
                        <span className="text-amber-600">
                          {50 - responseNote.length} more characters required
                        </span>
                      ) : (
                        <span className="text-green-600">Ready to submit</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{responseNote.length} / 2000</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="proposed-resolution">Proposed Resolution (Optional)</Label>
                  <Select
                    id="proposed-resolution"
                    value={proposedResolution}
                    onChange={(e) => setProposedResolution(e.target.value)}
                  >
                    <option value="">None</option>
                    {Object.entries(RESOLUTION_OPTIONS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>

                {proposedResolution === 'partial_refund' && (
                  <div>
                    <Label htmlFor="refund-amount">Refund Amount (in {dispute.order.currency})</Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      value={proposedRefundCents}
                      onChange={(e) => setProposedRefundCents(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max={dispute.order.totalCents / 100}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={submittingResponse || responseNote.length < 50}
                  >
                    {submittingResponse ? 'Submitting...' : 'Submit Response'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseNote('');
                      setProposedResolution('');
                      setProposedRefundCents('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Your response */}
          {dispute.responseNote && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Your Response</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{dispute.responseNote}</p>
              {dispute.submittedAt && (
                <p className="text-sm text-gray-500 mt-3">
                  Submitted on {formatDate(dispute.submittedAt)}
                </p>
              )}
            </Card>
          )}

          {/* Messages */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <MessageSquare className="inline h-5 w-5 mr-2" />
              Conversation
            </h2>

            <div className="space-y-4">
              {dispute.messages && dispute.messages.length > 0 ? (
                dispute.messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.senderRole === 'organizer'
                        ? 'bg-blue-50 border border-blue-200'
                        : message.senderRole === 'moderator'
                          ? 'bg-purple-50 border border-purple-200'
                          : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">
                          {message.sender.name}
                          {message.senderRole === 'moderator' && (
                            <span className="ml-2 text-xs text-purple-600">(Moderator)</span>
                          )}
                          {message.senderRole === 'buyer' && (
                            <span className="ml-2 text-xs text-gray-600">(Buyer)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No messages yet</p>
              )}
            </div>
          </Card>

          {/* Evidence */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              <FileText className="inline h-5 w-5 mr-2" />
              Evidence
            </h2>

            {dispute.evidence && dispute.evidence.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {dispute.evidence.map((evidence: any) => (
                  <div key={evidence.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <a
                        href={evidence.fileUrl}
                        download
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="font-medium text-sm mb-1 truncate">{evidence.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {(evidence.fileSize / 1024).toFixed(1)} KB
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {evidence.user.name} • {formatDate(evidence.uploadedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No evidence uploaded yet</p>
            )}

            {canRespond && (
              <div>
                <Label htmlFor="evidence-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Upload className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingEvidence ? 'Uploading...' : 'Click to upload evidence'}
                    </span>
                  </div>
                  <input
                    id="evidence-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={uploadingEvidence}
                    className="sr-only"
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, Images, Word documents (max 10MB)
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 w-0.5 bg-gray-200 my-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">Dispute Created</p>
                  <p className="text-xs text-gray-500">{formatDate(dispute.createdAt)}</p>
                </div>
              </div>

              {dispute.submittedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 w-0.5 bg-gray-200 my-1"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-sm">You Responded</p>
                    <p className="text-xs text-gray-500">{formatDate(dispute.submittedAt)}</p>
                  </div>
                </div>
              )}

              {dispute.escalatedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    {dispute.resolvedAt && <div className="flex-1 w-0.5 bg-gray-200 my-1"></div>}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-sm">Escalated to Moderator</p>
                    <p className="text-xs text-gray-500">{formatDate(dispute.escalatedAt)}</p>
                  </div>
                </div>
              )}

              {dispute.resolvedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Resolved</p>
                    <p className="text-xs text-gray-500">{formatDate(dispute.resolvedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Deadline */}
          {dispute.respondByAt && dispute.status === 'open' && (
            <Card className={`p-6 ${urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <h2 className="text-lg font-bold mb-2 text-amber-900">Response Deadline</h2>
              <p className="text-sm text-amber-800 mb-3">
                You must respond by:
              </p>
              <div className="flex items-center text-amber-900">
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-medium">{formatDate(dispute.respondByAt)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
