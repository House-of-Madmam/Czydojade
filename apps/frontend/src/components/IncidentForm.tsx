'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { reportIncident } from '@/api/queries/reportIncident';
import { useState } from 'react';
import { z } from 'zod';
import { IncidentPriority, IncidentType } from '@/api/types/incident';
import BinaryToggleGroup from './ui/BinaryToggleGroup';
import GeolocationStatus from './GeolocationStatus';
import { store } from '@/store';
import StopPicker from './StopPicker';

const formSchema = z.object({
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(IncidentType),
  priority: z.nativeEnum(IncidentPriority),
  stopId: z.string().optional(),
  // if stopId is provided, lineId, latitude and longitude are not used
  lineId: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSuccess?: () => void;
}

const tramLines = [
  { uuid: '550e8400-e29b-41d4-a716-446655440003', label: 'Line A' },
  { uuid: '550e8400-e29b-41d4-a716-446655440004', label: 'Line B' },
  { uuid: '550e8400-e29b-41d4-a716-446655440005', label: 'Line C' },
];

export default function IncidentForm({ onSuccess }: Props) {
  const [useLocation, setUseLocation] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      description: '',
      type: IncidentType.VehicleBreakdown,
      priority: IncidentPriority.Medium,
      stopId: '',
      lineId: '',
      latitude: '',
      longitude: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { latitude, longitude } = store.getState().geolocation;
      if (useLocation && latitude !== null && longitude !== null) {
        values.latitude = latitude.toString();
        values.longitude = longitude.toString();
        values.stopId = undefined;
      } else {
        values.lineId = undefined;
      }
      const sanitizedValues = {
        ...values,
        description: values.description || undefined,
        stopId: values.stopId || undefined,
        lineId: values.lineId || undefined,
        latitude: values.latitude || undefined,
        longitude: values.longitude || undefined,
      };

      await reportIncident(sanitizedValues);

      onSuccess?.();
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Registration error',
      });
    }
  }

  return (
    <div className="px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <BinaryToggleGroup
            options={[
              { label: 'Use Location', value: 'location' },
              { label: 'Select Stop', value: 'stop' },
            ]}
            value={useLocation ? 'location' : 'stop'}
            onValueChange={(event) => setUseLocation(event.target.value === 'location')}
          />
          {useLocation ? (
            <>
              <FormField
                control={form.control}
                name="lineId"
                render={({ field }) => (
                  <>
                    <GeolocationStatus />
                    <FormItem>
                      <FormLabel>Tram line</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tram line" />
                          </SelectTrigger>
                          <SelectContent>
                            {tramLines.map(({ uuid, label }) => (
                              <SelectItem
                                key={uuid}
                                value={uuid}
                              >
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
            </>
          ) : (
            <FormField
              control={form.control}
              name="stopId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stop</FormLabel>
                  <FormControl>
                    <StopPicker
                      onSelect={(stop) => field.onChange(stop.id)}
                      radiusMeters={300}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {['vehicleBreakdown', 'infrastructureBreakdown', 'dangerInsideVehicle'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          value={option}
                          checked={field.value === option}
                          onChange={() => field.onChange(option)}
                          className="form-radio"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {['low', 'medium', 'high', 'critical'].map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Describe the incident"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500 font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-6"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Submitting...' : 'Report Incident'}
          </Button>
        </form>
      </Form>
      {form.formState.errors.root && (
        <div className="text-red-600 text-sm mt-3 text-center bg-red-50 border border-red-200 rounded-lg p-3">
          {form.formState.errors.root.message}
        </div>
      )}
    </div>
  );
}
