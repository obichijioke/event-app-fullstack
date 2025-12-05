'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buyerDisputesApi, DISPUTE_CATEGORIES, type CreateDisputeDto } from '@/services/buyer-disputes-api.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth';
import { useEffect } from 'react';
import { ApiError } from '@/lib/api/client';

type Step = 'select-order' | 'category' | 'description' | 'evidence' | 'review';

interface Order {
  id: string;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
  };
}

export function CreateDisputeWizard() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('select-order');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Form data
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [category, setCategory] = useState<keyof typeof DISPUTE_CATEGORIES | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [uploadedEvidence, setUploadedEvidence] = useState<string[]>([]);

  // Load orders when reaching select-order step
  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await buyerDisputesApi.getMyOrders();
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Handle step navigation
  const nextStep = () => {
    const steps: Step[] = ['select-order', 'category', 'description', 'evidence', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['select-order', 'category', 'description', 'evidence', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setEvidenceFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit dispute
  const handleSubmit = async () => {
    if (!selectedOrderId || !category || !description) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create dispute
      const disputeData: CreateDisputeDto = {
        orderId: selectedOrderId,
        category: category as any,
        subcategory: subcategory || undefined,
        description,
        evidenceUrls: uploadedEvidence,
      };

      const dispute = await buyerDisputesApi.createDispute(disputeData);

      // Upload evidence files if any
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          try {
            await buyerDisputesApi.uploadEvidence(dispute.id, file);
          } catch (error) {
            console.error('Failed to upload file:', file.name, error);
          }
        }
      }

      toast.success('Dispute created successfully');
      router.push(`/account/disputes/${dispute.id}`);
    } catch (error: any) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        toast.error('We could not find that order or you do not have access. Please pick another order.');
        setCurrentStep('select-order');
        setSelectedOrderId('');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create dispute');
      }
      console.error('Failed to create dispute', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation for each step
  const canProceed = () => {
    switch (currentStep) {
      case 'select-order':
        return !!selectedOrderId;
      case 'category':
        return !!category;
      case 'description':
        return description.length >= 50;
      case 'evidence':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Load orders on mount
  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      toast.error('Please sign in to file a dispute');
      router.replace(`/auth/login?returnUrl=${encodeURIComponent('/account/disputes/create')}`);
      return;
    }
    loadOrders();
  }, [initialized, user]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <StepIndicator step="select-order" current={currentStep} label="Select Order" />
        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
        <StepIndicator step="category" current={currentStep} label="Category" />
        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
        <StepIndicator step="description" current={currentStep} label="Description" />
        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
        <StepIndicator step="evidence" current={currentStep} label="Evidence" />
        <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
        <StepIndicator step="review" current={currentStep} label="Review" />
      </div>

      {/* Step content */}
      <Card className="p-6">
        {currentStep === 'select-order' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Select Order to Dispute</h2>
              <p className="text-gray-600 mt-1">Choose the order you want to file a dispute for</p>
            </div>

            {loadingOrders ? (
              <div className="text-center py-8 text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No eligible orders found</div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <label
                    key={order.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedOrderId === order.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="order"
                      value={order.id}
                      checked={selectedOrderId === order.id}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.event.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Order #{order.id.slice(0, 8)} • {order.currency}{' '}
                          {(Number(order.totalCents) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Purchased {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedOrderId === order.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'category' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Dispute Category</h2>
              <p className="text-gray-600 mt-1">What issue are you experiencing?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="">Select a category</option>
                  {Object.entries(DISPUTE_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <Input
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g., Email never received"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide more specific details about the issue
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'description' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Describe the Issue</h2>
              <p className="text-gray-600 mt-1">Provide detailed information about your dispute</p>
            </div>

            <div>
              <Label htmlFor="description">Description * (minimum 50 characters)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail. Include relevant dates, what you've tried, and what resolution you're seeking..."
                rows={8}
                maxLength={2000}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {description.length < 50 ? (
                    <span className="text-amber-600">
                      <AlertCircle className="inline h-3 w-3 mr-1" />
                      {50 - description.length} more characters required
                    </span>
                  ) : (
                    <span className="text-green-600">
                      <CheckCircle2 className="inline h-3 w-3 mr-1" />
                      Description looks good
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{description.length} / 2000</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'evidence' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Upload Evidence (Optional)</h2>
              <p className="text-gray-600 mt-1">
                Add documents, screenshots, or other files to support your case
              </p>
            </div>

            <div>
              <Label htmlFor="evidence">Evidence Files</Label>
              <div className="mt-2">
                <label
                  htmlFor="evidence"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload files</span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, Images, Word docs (max 10MB each)
                  </span>
                  <input
                    id="evidence"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Review Your Dispute</h2>
              <p className="text-gray-600 mt-1">
                Please review all details before submitting
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Order Details</h3>
                {selectedOrder && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Event:</strong> {selectedOrder.event.title}
                    </p>
                    <p>
                      <strong>Order ID:</strong> {selectedOrder.id}
                    </p>
                    <p>
                      <strong>Amount:</strong> {selectedOrder.currency}{' '}
                      {(Number(selectedOrder.totalCents) / 100).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Dispute Information</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Category:</strong> {category && DISPUTE_CATEGORIES[category]}
                  </p>
                  {subcategory && (
                    <p>
                      <strong>Subcategory:</strong> {subcategory}
                    </p>
                  )}
                  <p>
                    <strong>Description:</strong>
                  </p>
                  <p className="whitespace-pre-wrap pl-4">{description}</p>
                </div>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Evidence</h3>
                  <div className="text-sm text-gray-600">
                    <p>{evidenceFiles.length} file(s) to be uploaded</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>The event organizer has 7 days to respond</li>
                  <li>You'll receive notifications about updates</li>
                  <li>You can add messages and evidence at any time</li>
                  <li>A moderator may review if needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 'select-order'}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {currentStep !== 'review' ? (
          <Button type="button" onClick={nextStep} disabled={!canProceed()}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading || !canProceed()}>
            {loading ? 'Submitting...' : 'Submit Dispute'}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  current,
  label,
}: {
  step: Step;
  current: Step;
  label: string;
}) {
  const steps: Step[] = ['select-order', 'category', 'description', 'evidence', 'review'];
  const currentIndex = steps.indexOf(current);
  const stepIndex = steps.indexOf(step);
  const isActive = step === current;
  const isCompleted = stepIndex < currentIndex;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : isCompleted
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepIndex + 1}
      </div>
      <span className="text-xs mt-1 text-gray-600 text-center whitespace-nowrap">{label}</span>
    </div>
  );
}
