"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { organizerApiService, Dispute, DisputeEvidence } from "@/services/organizer-api.service";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Send,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";

export default function DisputeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const orgId = searchParams.get("orgId") || "";

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response form state
  const [responseNote, setResponseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (orgId && disputeId) {
      loadDispute();
    }
  }, [orgId, disputeId]);

  const loadDispute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await organizerApiService.getDispute(orgId, disputeId);
      setDispute(data);
      if (data.responseNote) {
        setResponseNote(data.responseNote);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dispute");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Allowed: PDF, images, Word documents, text files");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedFile || !dispute) return;

    try {
      setIsUploading(true);
      await organizerApiService.uploadDisputeEvidence(orgId, disputeId, selectedFile);
      toast.success("Evidence uploaded successfully");
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById("evidence-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      // Reload dispute to show new evidence
      await loadDispute();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload evidence");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return;

    try {
      await organizerApiService.deleteDisputeEvidence(orgId, disputeId, evidenceId);
      toast.success("Evidence deleted successfully");
      await loadDispute();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete evidence");
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseNote.trim()) {
      toast.error("Please enter a response note");
      return;
    }

    if (!dispute) return;

    if (!confirm("Are you sure you want to submit this response? This will change the dispute status to 'under review'.")) {
      return;
    }

    try {
      setIsSubmitting(true);
      await organizerApiService.submitDisputeResponse(orgId, disputeId, {
        responseNote: responseNote.trim(),
        evidenceUrls: dispute.evidence.map((e) => e.fileUrl),
      });
      toast.success("Response submitted successfully");
      await loadDispute();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      needs_response: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: Clock },
      under_review: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: Clock },
      won: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: CheckCircle },
      lost: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle },
      warning: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: AlertTriangle },
      charge_refunded: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: AlertCircle },
    };
    return badges[status as keyof typeof badges] || badges.charge_refunded;
  };

  if (!orgId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <p className="text-red-900">Organization ID is required</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading dispute</p>
              <p className="text-sm text-red-700 mt-1">{error || "Dispute not found"}</p>
              <Link
                href={`/organizer/disputes?orgId=${orgId}`}
                className="mt-3 inline-block text-sm text-red-700 underline hover:text-red-800"
              >
                Back to Disputes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(dispute.status);
  const canRespond = ["needs_response", "warning"].includes(dispute.status);
  const canUploadEvidence = ["needs_response", "under_review", "warning"].includes(dispute.status);
  const hasResponded = !!dispute.submittedAt;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/organizer/disputes?orgId=${orgId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Disputes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispute Details</h1>
            <p className="text-gray-600 mt-1">Case ID: {dispute.caseId}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
            <statusBadge.icon className="h-4 w-4" />
            <span className="font-medium">{dispute.status.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Overview */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispute Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Amount</span>
                <p className="font-medium text-gray-900">
                  {dispute.amountCents
                    ? `${dispute.order.currency} ${(dispute.amountCents / 100).toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Provider</span>
                <p className="font-medium text-gray-900 capitalize">{dispute.provider}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Opened</span>
                <p className="font-medium text-gray-900">
                  {format(new Date(dispute.openedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {dispute.closedAt && (
                <div>
                  <span className="text-sm text-gray-500">Closed</span>
                  <p className="font-medium text-gray-900">
                    {format(new Date(dispute.closedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
              {dispute.respondByAt && (
                <div>
                  <span className="text-sm text-gray-500">Response Deadline</span>
                  <p className={`font-medium ${new Date(dispute.respondByAt) < new Date() ? "text-red-600" : "text-gray-900"}`}>
                    {format(new Date(dispute.respondByAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
              {dispute.submittedAt && (
                <div>
                  <span className="text-sm text-gray-500">Response Submitted</span>
                  <p className="font-medium text-gray-900">
                    {format(new Date(dispute.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>
            {dispute.reason && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">Dispute Reason</span>
                <p className="mt-1 text-gray-900">{dispute.reason}</p>
              </div>
            )}
          </div>

          {/* Evidence Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Evidence</h2>
              <span className="text-sm text-gray-500">{dispute.evidence.length} file{dispute.evidence.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Upload Form */}
            {canUploadEvidence && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label htmlFor="evidence-file" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Evidence
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="evidence-file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                    disabled={isUploading || !canUploadEvidence}
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  <button
                    onClick={handleUploadEvidence}
                    disabled={!selectedFile || isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                  >
                    {isUploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Accepted: PDF, images, Word documents. Max 10MB.
                </p>
              </div>
            )}

            {/* Evidence List */}
            {dispute.evidence.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No evidence uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dispute.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{evidence.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(evidence.fileSize / 1024).toFixed(1)} KB • Uploaded{" "}
                          {formatDistanceToNow(new Date(evidence.uploadedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={evidence.fileUrl}
                        download
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {dispute.status === "needs_response" && (
                        <button
                          onClick={() => handleDeleteEvidence(evidence.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Section */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h2>

            {hasResponded && !canRespond && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Response submitted {formatDistanceToNow(new Date(dispute.submittedAt!), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}

            <textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              disabled={!canRespond || isSubmitting}
              placeholder="Explain why you believe this dispute should be resolved in your favor. Include details about the order, delivery confirmation, communication with the buyer, etc."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600 text-sm"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {responseNote.length} characters
              </p>
              {canRespond && (
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseNote.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Information */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Order ID:</span>
                <p className="font-medium text-gray-900">{dispute.order.id.slice(0, 12)}...</p>
              </div>
              <div>
                <span className="text-gray-500">Event:</span>
                <p className="font-medium text-gray-900">{dispute.order.event.title}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Total:</span>
                <p className="font-medium text-gray-900">
                  {dispute.order.currency} {(dispute.order.totalCents / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Order Status:</span>
                <p className="font-medium text-gray-900 capitalize">{dispute.order.status}</p>
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Buyer Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-gray-900 break-all">{dispute.order.buyer.email}</p>
              </div>
              {dispute.order.buyer.name && (
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium text-gray-900">{dispute.order.buyer.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips for Winning Disputes</h3>
            <ul className="text-xs text-blue-800 space-y-1.5">
              <li>• Respond as soon as possible</li>
              <li>• Upload clear evidence (receipts, emails, delivery confirmations)</li>
              <li>• Be specific and professional in your response</li>
              <li>• Include order details and buyer communication</li>
              <li>• Explain your cancellation/refund policy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
