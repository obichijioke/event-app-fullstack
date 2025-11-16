import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

export interface UseFormStateOptions<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export interface UseFormStateReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  updateField: (name: keyof T, value: any) => void;
  resetForm: () => void;
}

/**
 * Custom hook for managing form state with loading and submission
 *
 * @param options - Configuration options
 * @returns Form state and handlers
 *
 * @example
 * const { formData, loading, handleChange, handleSubmit } = useFormState({
 *   initialData: { name: '', email: '' },
 *   onSubmit: async (data) => {
 *     await api.createUser(data);
 *   },
 *   onSuccess: () => toast.success('User created!'),
 * });
 */
export function useFormState<T extends Record<string, any>>({
  initialData,
  onSubmit,
  onSuccess,
  onError,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<T>(initialData);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      let processedValue: any = value;

      // Handle different input types
      if (type === 'number') {
        processedValue = value === '' ? 0 : Number(value);
      } else if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
      }

      return {
        ...prev,
        [name]: processedValue,
      };
    });
  }, []);

  const updateField = useCallback((name: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        await onSubmit(formData);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [formData, onSubmit, onSuccess, onError]
  );

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    setFormData,
    loading,
    handleChange,
    handleSubmit,
    updateField,
    resetForm,
  };
}
